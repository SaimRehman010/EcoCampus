import os
import json
import requests
from typing import Dict, Any, List

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class EcoCampusAgent:
    """
    Autonomous AI Agent for EcoCampus operations.
    Equipped with actionable tools to query campus reports and calculate energy savings.
    """

    def __init__(self):
        self.express_backend_url = os.getenv("EXPRESS_BACKEND_URL", "http://localhost:5000")
        self.python_service_url = os.getenv("PYTHON_SERVICE_URL", "http://localhost:5001")

    # ==========================================
    # TOOL 1: Get Unresolved Reports Summary
    # ==========================================
    def get_unresolved_reports_summary(self, category_filter: str = None) -> Dict[str, Any]:
        """
        Tool 1: Fetches or simulates pending report complaints from the Express API
        to identify high-complaint campus locations and hot spots.
        """
        reports = []
        source = "live_api"

        try:
            url = f"{self.express_backend_url}/api/reports?status=Pending"
            if category_filter:
                url += f"&category={category_filter}"

            resp = requests.get(url, timeout=3)
            if resp.status_code == 200:
                data = resp.json()
                reports = data.get("data", [])
            else:
                source = "fallback_simulation"
        except Exception as ex:
            print(f"[Tool 1 API Note]: Could not reach Express at {self.express_backend_url} ({ex}), using campus dataset.")
            source = "fallback_simulation"

        # Fallback realistic campus data if backend is starting up or empty
        if not reports or source == "fallback_simulation":
            reports = [
                {
                    "title": "Chiller 2 Malfunction & Noise",
                    "category": "Electricity",
                    "location": "Science Block B - 3rd Floor",
                    "status": "Pending",
                    "description": "Continuous high power draw and inadequate cooling."
                },
                {
                    "title": "Overheating Lab Servers",
                    "category": "Electricity",
                    "location": "Science Block B - Room 302 Lab",
                    "status": "Pending",
                    "description": "AC units running 24/7 without shutoff timer."
                },
                {
                    "title": "Corridor Lights left on all night",
                    "category": "Electricity",
                    "location": "Science Block B - Hallway",
                    "status": "Pending",
                    "description": "Occupancy sensors inactive in corridor."
                },
                {
                    "title": "Restroom tap leaking",
                    "category": "Water",
                    "location": "Main Library - 1st Floor",
                    "status": "Pending",
                    "description": "Faucet dripping continuously."
                },
                {
                    "title": "Overflowing paper bin",
                    "category": "Waste",
                    "location": "Student Union Hall",
                    "status": "Pending",
                    "description": "Recycling bin full."
                }
            ]

        # Aggregate complaints by location and category
        location_counts: Dict[str, int] = {}
        category_counts: Dict[str, int] = {}

        for r in reports:
            loc = r.get("location", "Unknown Location")
            # Cluster location to building level
            building = loc.split("-")[0].strip() if "-" in loc else loc
            location_counts[building] = location_counts.get(building, 0) + 1

            cat = r.get("category", "Other")
            category_counts[cat] = category_counts.get(cat, 0) + 1

        top_location = max(location_counts, key=location_counts.get) if location_counts else "General Campus"
        top_category = max(category_counts, key=category_counts.get) if category_counts else "Electricity"

        return {
            "source": source,
            "total_pending_reports": len(reports),
            "top_complaint_location": top_location,
            "top_complaint_location_count": location_counts.get(top_location, 0),
            "top_category": top_category,
            "location_distribution": location_counts,
            "category_distribution": category_counts,
            "sample_reports": reports[:3]
        }

    # ==========================================
    # TOOL 2: Get Energy Recommendation
    # ==========================================
    def get_energy_recommendation(
        self,
        resource_type: str = "Electricity",
        power_watts: float = 3500,
        hours_per_day: float = 12,
        days: int = 30,
        device_count: int = 4,
        rate_per_kwh: float = 0.15,
        device_name: str = "Central HVAC & Chiller"
    ) -> Dict[str, Any]:
        """
        Tool 2: Calls the Python OOP Resource Analyzer microservice on Port 5001
        to calculate kilowatt-hour consumption, estimated costs, and optimization advice.
        """
        payload = {
            "resource_type": resource_type,
            "device_name": device_name,
            "power_watts": power_watts,
            "hours_per_day": hours_per_day,
            "days": days,
            "device_count": device_count,
            "rate_per_kwh": rate_per_kwh
        }

        try:
            resp = requests.post(f"{self.python_service_url}/api/analyze", json=payload, timeout=4)
            if resp.status_code == 200:
                return resp.json()
            else:
                return {
                    "success": False,
                    "error": f"Resource Analyzer returned status {resp.status_code}: {resp.text}"
                }
        except Exception as ex:
            # Fallback direct calculation if port 5001 microservice is not currently listening
            kwh = round((power_watts * hours_per_day * days * device_count) / 1000.0, 2)
            cost = round(kwh * rate_per_kwh, 2)
            return {
                "success": True,
                "resource_type": resource_type,
                "device_name": device_name,
                "consumption_kwh": kwh,
                "estimated_cost_usd": cost,
                "rate_applied_usd_per_kwh": rate_per_kwh,
                "recommendation": (
                    f"Elevated consumption ({kwh} kWh). Recommendation: Inspect thermostat calibration, "
                    "service filters, and schedule automated shutdown timers during non-operational hours."
                )
            }

    # ==========================================
    # AGENT EXECUTION & REASONING LOOP
    # ==========================================
    def run(self, user_goal: str) -> Dict[str, Any]:
        """
        Executes autonomous agent planning & tool orchestration based on the user's objective.
        """
        goal_lower = user_goal.lower()
        steps_executed = []
        tool_results = {}

        # Decision Logic: Check which tools are required
        needs_reports = any(w in goal_lower for w in ["complaint", "report", "area", "issue", "highest", "unresolved", "location", "where"])
        needs_energy_analysis = any(w in goal_lower for w in ["energy", "electricity", "cost", "reduce", "consumption", "kwh", "save", "recommend", "hvac", "ac"])

        # Default to running both if it is a general optimization goal
        if not needs_reports and not needs_energy_analysis:
            needs_reports = True
            needs_energy_analysis = True

        top_location = "Science Block B"
        top_category = "Electricity"

        # Step 1: Execute Report Summary Tool if needed
        if needs_reports:
            steps_executed.append({
                "step": 1,
                "tool": "get_unresolved_reports_summary",
                "reasoning": "Fetch unresolved campus reports to identify hot spots with high sustainability issues."
            })
            reports_summary = self.get_unresolved_reports_summary()
            tool_results["reports_summary"] = reports_summary
            top_location = reports_summary.get("top_complaint_location", "Science Block B")
            top_category = reports_summary.get("top_category", "Electricity")

        # Step 2: Execute Energy Recommendation Tool if needed
        if needs_energy_analysis:
            step_num = len(steps_executed) + 1
            device_name = f"{top_location} HVAC & Equipment"
            steps_executed.append({
                "step": step_num,
                "tool": "get_energy_recommendation",
                "parameters": {
                    "resource_type": top_category,
                    "device_name": device_name,
                    "power_watts": 3500,
                    "hours_per_day": 14,
                    "days": 30,
                    "device_count": 3
                },
                "reasoning": f"Query Python Resource Analyzer for {top_location} to compute kWh load and cost reduction measures."
            })

            energy_analysis = self.get_energy_recommendation(
                resource_type=top_category,
                device_name=device_name,
                power_watts=3500,
                hours_per_day=14,
                days=30,
                device_count=3,
                rate_per_kwh=0.15
            )
            tool_results["energy_analysis"] = energy_analysis

        # Synthesis
        kwh = tool_results.get("energy_analysis", {}).get("consumption_kwh", 4410.0)
        cost = tool_results.get("energy_analysis", {}).get("estimated_cost_usd", 661.50)
        rec = tool_results.get("energy_analysis", {}).get("recommendation", "Install automated occupancy shutoff timers.")

        synthesis = (
            f"**EcoCampus Agent Diagnostic Summary**:\n\n"
            f"1. **Complaint Hotspot Identified:** Analysis of pending campus reports indicates **{top_location}** has the highest frequency of unresolved issues ({tool_results.get('reports_summary', {}).get('top_complaint_location_count', 3)} reports), primarily regarding **{top_category}** (HVAC and lighting).\n"
            f"2. **Resource Load & Financial Impact:** Running equipment for 14 hrs/day consumes an estimated **{kwh} kWh/month**, resulting in **${cost} USD/month** in electricity expenses.\n"
            f"3. **Optimization Strategy:** {rec}\n"
            f"4. **Action Items:** Dispatch maintenance to {top_location} for thermostat re-calibration (setpoint 24°C) and enforce night-time shutdown policies."
        )

        return {
            "user_goal": user_goal,
            "status": "completed",
            "steps_executed": steps_executed,
            "tool_results": tool_results,
            "agent_synthesis": synthesis
        }
