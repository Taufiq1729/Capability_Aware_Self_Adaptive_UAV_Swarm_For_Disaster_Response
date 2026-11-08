from typing import Dict, Any, List

class CapabilityEstimator:
    """
    Stage 4: Remaining Capability Estimation.
    Outputs normalized vector [c_RGB, c_Thermal, c_LiDAR, c_Communication, c_Mobility, c_Localization, c_Energy, c_Compute]
    in [0.0, 1.0].
    
    IMPORTANT RESEARCH REQUIREMENT:
    Diagnostic confidence is decoupled from capability levels.
    """
    def __init__(self, drone_id: str):
        self.drone_id = drone_id

    def estimate(self, telemetry: Dict[str, Any], fault_assessment: Dict[str, Any]) -> Dict[str, Any]:
        # 1. c_RGB: Combines hardware sensor health and operational frame rate
        hw_rgb = telemetry["rgb_camera"]["hardware_health"]
        fps = telemetry["rgb_camera"]["fps"]
        clarity = telemetry["rgb_camera"]["clarity_index"]
        c_RGB = max(0.0, min(1.0, hw_rgb * (fps / 30.0) * min(1.0, clarity + 0.2)))

        # 2. c_Thermal: Based on hardware health and radiometric noise
        hw_thermal = telemetry["thermal_camera"]["hardware_health"]
        netd = telemetry["thermal_camera"]["netd_mk"]
        noise_penalty = max(0.0, (netd - 40.0) / 160.0)
        c_Thermal = max(0.0, min(1.0, hw_thermal - noise_penalty))

        # 3. c_LiDAR: Based on point return rate and range noise
        hw_lidar = telemetry["lidar"]["hardware_health"]
        range_noise = telemetry["lidar"]["range_noise_cm"]
        noise_pen = max(0.0, (range_noise - 2.0) / 25.0)
        c_LiDAR = max(0.0, min(1.0, hw_lidar - noise_pen))

        # 4. c_Communication: Radio link health, RSSI, packet loss
        hw_comm = telemetry["communication"]["radio_health"]
        per = telemetry["communication"]["packet_loss_rate"]
        c_Comm = max(0.0, min(1.0, hw_comm * (1.0 - per)))

        # 5. c_Mobility: Motor vibration, motor temperature
        hw_motor = telemetry["motor"]["health"]
        vib = telemetry["motor"]["vibration_g"]
        temp = telemetry["motor"]["temperature_c"]
        vib_penalty = max(0.0, (vib - 1.2) / 6.0)
        temp_penalty = max(0.0, (temp - 50.0) / 40.0)
        c_Mobility = max(0.0, min(1.0, hw_motor - (vib_penalty * 0.6 + temp_penalty * 0.4)))

        # 6. c_Localization: GNSS HDOP and satellite count
        hdop = telemetry["localization"]["hdop"]
        hdop_penalty = max(0.0, (hdop - 1.0) / 4.0)
        c_Loc = max(0.0, min(1.0, telemetry["localization"]["accuracy"] - hdop_penalty))

        # 7. c_Energy: Remaining battery charge and battery health
        pct_bat = telemetry["battery"]["remaining_pct"]
        c_Energy = max(0.0, min(1.0, pct_bat / 100.0))

        # 8. c_Compute: CPU utilization margin and inference latency
        cpu_load = telemetry["compute"]["cpu_load_pct"]
        latency = telemetry["compute"]["latency_ms"]
        compute_margin = max(0.0, (100.0 - cpu_load) / 100.0)
        c_Compute = max(0.0, min(1.0, compute_margin * (1.0 if latency < 40 else 40.0 / latency)))

        capability_vector = {
            "c_RGB": round(c_RGB, 3),
            "c_Thermal": round(c_Thermal, 3),
            "c_LiDAR": round(c_LiDAR, 3),
            "c_Communication": round(c_Comm, 3),
            "c_Mobility": round(c_Mobility, 3),
            "c_Localization": round(c_Loc, 3),
            "c_Energy": round(c_Energy, 3),
            "c_Compute": round(c_Compute, 3),
        }

        # Operational status derivation
        min_critical_val = min(c_Mobility, c_Loc, c_Energy)
        if min_critical_val < 0.20 or c_Energy < 0.15:
            op_status = "CRITICAL"
        elif any(v < 0.55 for v in capability_vector.values()):
            op_status = "DEGRADED"
        else:
            op_status = "HEALTHY"

        return {
            "drone_id": self.drone_id,
            "capability_vector": capability_vector,
            "diagnostic_confidence": fault_assessment.get("diagnostic_confidence", 0.95),
            "operational_status": op_status
        }
