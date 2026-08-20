import os
from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Import OOP ResourceAnalyzer
try:
    from analyzer import ResourceAnalyzer
except ImportError:
    from .analyzer import ResourceAnalyzer

# Instantiate Flask App
app = Flask(__name__)
CORS(app)

# Initialize Analyzer instance
analyzer = ResourceAnalyzer()


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint for Python microservice"""
    return jsonify({
        "status": "ok",
        "service": "EcoCampus Python Resource Analyzer Microservice",
        "port": int(os.getenv("PORT", 5001))
    }), 200


@app.route("/api/analyze", methods=["POST"])
def analyze_resource():
    """
    POST endpoint: Analyze resource data
    Accepts JSON body:
      - power_watts (float) [Required unless consumption_kwh is directly provided]
      - hours_per_day (float) [Required unless consumption_kwh is provided]
      - days (int, default=30)
      - device_count (int, default=1)
      - rate_per_kwh (float, optional)
      - resource_type (string, default='Electricity')
      - device_name (string, default='Campus Equipment')
      - consumption_kwh (float, optional if directly known)

    Returns:
      {
        "success": true,
        "resource_type": str,
        "device_name": str,
        "consumption_kwh": float,
        "estimated_cost_usd": float,
        "rate_applied_usd_per_kwh": float,
        "recommendation": str
      }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "message": "Invalid or missing JSON request body"
            }), 400

        resource_type = data.get("resource_type", "Electricity")
        device_name = data.get("device_name", "Campus Device")
        rate_per_kwh = data.get("rate_per_kwh", None)

        if rate_per_kwh is not None:
            try:
                rate_per_kwh = float(rate_per_kwh)
            except (ValueError, TypeError):
                return jsonify({
                    "success": False,
                    "message": "Invalid rate_per_kwh: Must be a numeric value."
                }), 400

        # Determine consumption (either directly provided or calculated from parameters)
        if "consumption_kwh" in data and data["consumption_kwh"] is not None:
            try:
                consumption_kwh = round(float(data["consumption_kwh"]), 2)
                if consumption_kwh < 0:
                    raise ValueError()
            except (ValueError, TypeError):
                return jsonify({
                    "success": False,
                    "message": "Invalid consumption_kwh: Must be a non-negative number."
                }), 400
        else:
            # Validate power_watts and hours_per_day
            if "power_watts" not in data or "hours_per_day" not in data:
                return jsonify({
                    "success": False,
                    "message": "Missing required fields: Provide either ('power_watts' and 'hours_per_day') or 'consumption_kwh'."
                }), 400

            try:
                power_watts = float(data["power_watts"])
                hours_per_day = float(data["hours_per_day"])
                days = int(data.get("days", 30))
                device_count = int(data.get("device_count", 1))

                consumption_kwh = analyzer.calculate_consumption(
                    power_watts=power_watts,
                    hours_per_day=hours_per_day,
                    days=days,
                    device_count=device_count
                )
            except ValueError as ve:
                return jsonify({
                    "success": False,
                    "message": str(ve)
                }), 400
            except Exception as e:
                return jsonify({
                    "success": False,
                    "message": f"Calculation error: {str(e)}"
                }), 400

        # Calculate estimated cost
        try:
            estimated_cost = analyzer.calculate_cost(
                consumption_kwh=consumption_kwh,
                rate_per_kwh=rate_per_kwh
            )
        except ValueError as ve:
            return jsonify({
                "success": False,
                "message": str(ve)
            }), 400

        # Generate recommendation
        recommendation = analyzer.generate_recommendation(
            consumption_kwh=consumption_kwh,
            resource_type=resource_type,
            device_name=device_name
        )

        applied_rate = rate_per_kwh if rate_per_kwh is not None else analyzer.default_rate_per_kwh

        return jsonify({
            "success": True,
            "resource_type": resource_type,
            "device_name": device_name,
            "consumption_kwh": consumption_kwh,
            "estimated_cost_usd": estimated_cost,
            "rate_applied_usd_per_kwh": applied_rate,
            "recommendation": recommendation
        }), 200

    except Exception as ex:
        return jsonify({
            "success": False,
            "message": f"Server error processing analysis request: {str(ex)}"
        }), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    print(f"[EcoCampus Python Service] Starting Resource Analyzer on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=debug)
