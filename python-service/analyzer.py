import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class ResourceAnalyzer:
    """
    Object-Oriented Service Class for Campus Resource Consumption Analysis,
    Cost Estimation, and Sustainability Recommendations.
    """

    def __init__(self, default_rate_per_kwh: float = None):
        if default_rate_per_kwh is not None:
            self.default_rate_per_kwh = float(default_rate_per_kwh)
        else:
            self.default_rate_per_kwh = float(os.getenv("DEFAULT_RATE_PER_KWH", 0.15))

    def calculate_consumption(
        self,
        power_watts: float,
        hours_per_day: float,
        days: int = 30,
        device_count: int = 1,
    ) -> float:
        """
        Calculate total energy consumption in kilowatt-hours (kWh).
        Formula: (Power in Watts * Hours/Day * Days * Device Count) / 1000
        """
        if power_watts < 0 or hours_per_day < 0 or days < 0 or device_count < 0:
            raise ValueError("All consumption parameters must be non-negative numbers.")
        if hours_per_day > 24:
            raise ValueError("Hours per day cannot exceed 24.")

        total_watt_hours = power_watts * hours_per_day * days * device_count
        consumption_kwh = total_watt_hours / 1000.0
        return round(consumption_kwh, 2)

    def calculate_cost(
        self,
        consumption_kwh: float,
        rate_per_kwh: float = None,
    ) -> float:
        """
        Calculate estimated cost in USD based on kWh consumed and electricity tariff.
        """
        if consumption_kwh < 0:
            raise ValueError("Consumption kWh cannot be negative.")

        rate = rate_per_kwh if rate_per_kwh is not None else self.default_rate_per_kwh
        if rate < 0:
            raise ValueError("Rate per kWh cannot be negative.")

        total_cost = consumption_kwh * rate
        return round(total_cost, 2)

    def generate_recommendation(
        self,
        consumption_kwh: float,
        resource_type: str = "Electricity",
        device_name: str = "Equipment",
    ) -> str:
        """
        Generate actionable sustainability recommendation and insight based on consumption levels.
        """
        resource_type_lower = (resource_type or "").lower()

        if consumption_kwh == 0:
            return f"No {resource_type} consumption recorded for {device_name}. Ensure tracking sensors are operational."

        if "ac" in resource_type_lower or "hvac" in resource_type_lower:
            if consumption_kwh > 800:
                return (
                    f"High HVAC consumption ({consumption_kwh} kWh). Recommendation: Set campus thermostats to 24°C (75°F), "
                    "service air filters, and install automated occupancy timers to reduce load by up to 25%."
                )
            elif consumption_kwh > 300:
                return (
                    f"Moderate HVAC consumption ({consumption_kwh} kWh). Recommendation: Check building insulation, seal window leaks, "
                    "and schedule automated shutdown during non-operational campus hours."
                )
            else:
                return f"HVAC consumption is within efficient thresholds ({consumption_kwh} kWh). Continue periodic filter maintenance."

        elif "water" in resource_type_lower:
            if consumption_kwh > 500:
                return (
                    f"Elevated water pumping/heating energy ({consumption_kwh} kWh). Recommendation: Inspect campus plumbing for hidden leaks "
                    "and deploy low-flow aerators to conserve both water and heating energy."
                )
            else:
                return f"Water-related energy usage is optimal ({consumption_kwh} kWh). Maintain smart metering sensors."

        elif "light" in resource_type_lower:
            if consumption_kwh > 250:
                return (
                    f"High lighting consumption ({consumption_kwh} kWh). Recommendation: Retrofit remaining fluorescent fixtures with high-efficiency "
                    "LEDs and add PIR motion sensors in lecture halls and corridors."
                )
            else:
                return f"Lighting consumption is efficient ({consumption_kwh} kWh). Good adherence to energy-saving policies."

        else:
            # General electricity / equipment
            if consumption_kwh > 1000:
                return (
                    f"Critical energy consumption detected ({consumption_kwh} kWh for {device_name}). Recommendation: Conduct an immediate energy audit, "
                    "identify phantom loads, and transition major loads to smart relays or off-peak hours."
                )
            elif consumption_kwh > 400:
                return (
                    f"Elevated consumption ({consumption_kwh} kWh for {device_name}). Recommendation: Enable automatic sleep modes on lab computers, "
                    "turn off standby equipment, and review daily operational schedules."
                )
            else:
                return f"Optimal energy consumption profile ({consumption_kwh} kWh). Keep monitoring to sustain green campus benchmarks."
