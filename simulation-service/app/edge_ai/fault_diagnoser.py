import time
import math
import numpy as np
from typing import Dict, Any, List, Optional

from app.edge_ai.torch_health_model import PyTorchHealthEvaluator

class EdgeFaultDiagnoser:
    """
    Stage 3: Deeper Fault Assessment.
    Identifies fault category, specific affected component, severity,
    and diagnostic confidence using PyTorch deep neural network and multi-sensor correlation.
    """
    def __init__(self, drone_id: str):
        self.drone_id = drone_id
        self.torch_evaluator = PyTorchHealthEvaluator()

    def assess_fault(self, telemetry: Dict[str, Any], anomaly_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes diagnostic reasoning across telemetry channels.
        Distinguishes environmental obscuration (smoke/dust) from hardware breakdown.
        """
        start_time = time.time()
        
        # 0. PyTorch Deep Neural Network Assessment
        torch_res = self.torch_evaluator.evaluate(telemetry)
        
        ch_scores = anomaly_result.get("channel_scores", {})
        smoke_density = telemetry["environment"]["smoke_density"]
        
        diagnosed_faults = []
        overall_severity = "NONE"
        highest_severity_num = 0
        confidences = []
        
        # 1. Motor Evaluation
        vib = telemetry["motor"]["vibration_g"]
        temp = telemetry["motor"]["temperature_c"]
        if vib > 2.0 or temp > 65.0:
            sev_num = 3 if (vib > 4.5 or temp > 78.0) else 2
            conf = min(0.98, 0.70 + (vib / 8.0) * 0.25)
            diagnosed_faults.append({
                "component": "motor",
                "category": "MECHANICAL_PROPULSION_FAULT",
                "severity": "CRITICAL" if sev_num == 3 else "MODERATE",
                "severity_val": sev_num,
                "confidence": round(conf, 3),
                "evidence": f"Vibration RMS {vib:.1f}G, Stator Temp {temp:.1f}°C"
            })
            highest_severity_num = max(highest_severity_num, sev_num)
            confidences.append(conf)

        # 2. Battery Evaluation
        v_bat = telemetry["battery"]["voltage_v"]
        pct_bat = telemetry["battery"]["remaining_pct"]
        if pct_bat < 20.0 or v_bat < 20.8:
            sev_num = 3 if pct_bat < 12.0 else 2
            conf = 0.95
            diagnosed_faults.append({
                "component": "battery",
                "category": "ENERGY_DEPLETION_OR_CELL_FAULT",
                "severity": "CRITICAL" if sev_num == 3 else "MODERATE",
                "severity_val": sev_num,
                "confidence": round(conf, 3),
                "evidence": f"Remaining Charge {pct_bat:.1f}%, Voltage {v_bat:.2f}V"
            })
            highest_severity_num = max(highest_severity_num, sev_num)
            confidences.append(conf)

        # 3. RGB Camera vs Smoke Disambiguation
        fps = telemetry["rgb_camera"]["fps"]
        clarity = telemetry["rgb_camera"]["clarity_index"]
        hw_rgb = telemetry["rgb_camera"]["hardware_health"]
        
        if fps < 15 or hw_rgb < 0.6:
            # Physical camera failure: FPS dropped or sensor hardware faulted
            sev_num = 3 if fps == 0 else 2
            conf = 0.94
            diagnosed_faults.append({
                "component": "rgb_camera",
                "category": "OPTICAL_HARDWARE_FAILURE",
                "severity": "CRITICAL" if sev_num == 3 else "MODERATE",
                "severity_val": sev_num,
                "confidence": round(conf, 3),
                "evidence": f"Hardware Sensor Health {hw_rgb:.2f}, Stream Rate {fps} FPS"
            })
            highest_severity_num = max(highest_severity_num, sev_num)
            confidences.append(conf)
        elif clarity < 0.4 and smoke_density > 0.4:
            # Environmental occlusion, NOT hardware fault
            conf = 0.88
            diagnosed_faults.append({
                "component": "rgb_camera",
                "category": "ENVIRONMENTAL_SMOKE_OCCLUSION",
                "severity": "MODERATE",
                "severity_val": 1,
                "confidence": round(conf, 3),
                "evidence": f"Smoke Density {smoke_density:.2f} causing visual opacity; hardware intact"
            })
            highest_severity_num = max(highest_severity_num, 1)
            confidences.append(conf)

        # 4. Thermal Camera
        netd = telemetry["thermal_camera"]["netd_mk"]
        drift = telemetry["thermal_camera"]["drift_offset"]
        if netd > 100.0 or abs(drift) > 4.0:
            sev_num = 3 if netd > 180.0 else 2
            conf = 0.93
            diagnosed_faults.append({
                "component": "thermal_camera",
                "category": "THERMAL_SENSOR_DRIFT",
                "severity": "CRITICAL" if sev_num == 3 else "MODERATE",
                "severity_val": sev_num,
                "confidence": round(conf, 3),
                "evidence": f"NETD {netd:.1f}mK, Calibration Bias {drift:.1f}°C"
            })
            highest_severity_num = max(highest_severity_num, sev_num)
            confidences.append(conf)

        # 5. LiDAR
        pts = telemetry["lidar"]["point_rate_hz"]
        err_lidar = telemetry["lidar"]["range_error_m"]
        if pts < 40000.0 or err_lidar > 0.5:
            sev_num = 3 if pts < 10000.0 else 2
            conf = 0.95
            diagnosed_faults.append({
                "component": "lidar",
                "category": "LIDAR_OPTICAL_DEGRADATION",
                "severity": "CRITICAL" if sev_num == 3 else "MODERATE",
                "severity_val": sev_num,
                "confidence": round(conf, 3),
                "evidence": f"Return Rate {pts:.0f} pts/s, Range Error {err_lidar:.2f}m"
            })
            highest_severity_num = max(highest_severity_num, sev_num)
            confidences.append(conf)

        # 6. GPS / GNSS
        hdop = telemetry["localization"]["hdop"]
        drift_m = telemetry["localization"]["position_drift_m"]
        if hdop > 3.0 or drift_m > 8.0:
            sev_num = 3 if drift_m > 15.0 else 2
            conf = 0.90
            diagnosed_faults.append({
                "component": "gps",
                "category": "GNSS_MULTIPATH_DRIFT",
                "severity": "CRITICAL" if sev_num == 3 else "MODERATE",
                "severity_val": sev_num,
                "confidence": round(conf, 3),
                "evidence": f"HDOP {hdop:.2f}, Position Drift {drift_m:.1f}m"
            })
            highest_severity_num = max(highest_severity_num, sev_num)
            confidences.append(conf)

        # 7. Communication
        rssi = telemetry["communication"]["rssi_dbm"]
        per = telemetry["communication"]["packet_loss_rate"]
        if rssi < -85.0 or per > 0.4:
            sev_num = 3 if per > 0.75 else 2
            conf = 0.91
            diagnosed_faults.append({
                "component": "communication",
                "category": "RADIO_LINK_DEGRADATION",
                "severity": "CRITICAL" if sev_num == 3 else "MODERATE",
                "severity_val": sev_num,
                "confidence": round(conf, 3),
                "evidence": f"RSSI {rssi:.1f}dBm, Packet Loss {per*100:.1f}%"
            })
            highest_severity_num = max(highest_severity_num, sev_num)
            confidences.append(conf)

        # Severity classification
        sev_map = {0: "NONE", 1: "LOW", 2: "MODERATE", 3: "CRITICAL"}
        overall_severity = sev_map.get(highest_severity_num, torch_res.get("severity_class", "NONE"))
        
        # Blend rule-based confidence with PyTorch neural confidence
        torch_conf = torch_res.get("diagnostic_confidence", 0.95)
        rule_conf = float(np.mean(confidences)) if confidences else 0.96
        fused_confidence = 0.5 * torch_conf + 0.5 * rule_conf
        
        inference_latency_ms = round((time.time() - start_time) * 1000.0, 2)
        
        primary_fault = diagnosed_faults[0] if diagnosed_faults else {
            "component": "none",
            "category": "NOMINAL_HEALTH",
            "severity": "NONE",
            "confidence": round(torch_conf, 3),
            "evidence": "All subsystems within operational tolerances (SwarmHealthNet verified)"
        }

        return {
            "drone_id": self.drone_id,
            "primary_fault": primary_fault,
            "all_faults": diagnosed_faults,
            "overall_severity": overall_severity,
            "diagnostic_confidence": round(fused_confidence, 3),
            "inference_time_ms": max(0.8, inference_latency_ms),
            "torch_assessment": torch_res,
            "assessed_at": time.time()
        }
