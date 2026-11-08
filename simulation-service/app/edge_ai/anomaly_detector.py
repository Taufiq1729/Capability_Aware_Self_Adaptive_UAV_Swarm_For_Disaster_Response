import math
import numpy as np
from typing import Dict, Any, List, Tuple
from collections import deque

class EdgeAnomalyDetector:
    """
    Stage 2: Lightweight Edge Anomaly Detection running locally on UAV.
    Employs fast statistical Z-score deviations and rolling variance checks
    across multi-channel telemetry streams without high compute overhead.
    """
    def __init__(self, drone_id: str, history_len: int = 15, anomaly_threshold: float = 0.55):
        self.drone_id = drone_id
        self.history_len = history_len
        self.anomaly_threshold = anomaly_threshold
        
        # Rolling baseline buffers for normal operation tracking
        self.buffers: Dict[str, deque] = {
            "motor_vibration": deque(maxlen=history_len),
            "motor_temp": deque(maxlen=history_len),
            "battery_voltage": deque(maxlen=history_len),
            "rgb_fps": deque(maxlen=history_len),
            "thermal_netd": deque(maxlen=history_len),
            "lidar_noise": deque(maxlen=history_len),
            "gps_hdop": deque(maxlen=history_len),
            "comm_rssi": deque(maxlen=history_len),
            "compute_load": deque(maxlen=history_len),
        }
        
        # Nominal bounds [min_normal, max_normal, max_tolerable]
        self.channel_limits = {
            "motor_vibration": (0.5, 1.5, 5.0),
            "motor_temp": (35.0, 55.0, 85.0),
            "battery_voltage": (20.5, 25.2, 19.5), # low is worse
            "rgb_fps": (24.0, 32.0, 5.0),          # low is worse
            "thermal_netd": (30.0, 60.0, 180.0),
            "lidar_noise": (1.0, 4.0, 25.0),
            "gps_hdop": (0.6, 1.5, 4.5),
            "comm_rssi": (-75.0, -40.0, -95.0),    # low is worse
            "compute_load": (20.0, 65.0, 95.0),
        }
        
        self.consecutive_anomaly_count = 0
        self.last_score = 0.0

    def process(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates multi-channel anomaly deviations.
        Returns:
            anomaly_score (0.0 to 1.0)
            is_anomalous (bool)
            flagged_channels (list of str)
            trigger_deep_assessment (bool)
        """
        extracted_values = {
            "motor_vibration": telemetry["motor"]["vibration_g"],
            "motor_temp": telemetry["motor"]["temperature_c"],
            "battery_voltage": telemetry["battery"]["voltage_v"],
            "rgb_fps": telemetry["rgb_camera"]["fps"],
            "thermal_netd": telemetry["thermal_camera"]["netd_mk"],
            "lidar_noise": telemetry["lidar"]["range_noise_cm"],
            "gps_hdop": telemetry["localization"]["hdop"],
            "comm_rssi": telemetry["communication"]["rssi_dbm"],
            "compute_load": telemetry["compute"]["cpu_load_pct"],
        }
        
        channel_scores = {}
        flagged_channels = []
        
        for ch, val in extracted_values.items():
            norm_min, norm_max, worst = self.channel_limits[ch]
            
            # Distance from acceptable nominal envelope
            if norm_min <= val <= norm_max:
                dev = 0.0
            elif val > norm_max:
                dev = min(1.0, (val - norm_max) / max(1e-3, abs(worst - norm_max)))
            else: # val < norm_min
                dev = min(1.0, (norm_min - val) / max(1e-3, abs(norm_min - worst)))
            
            channel_scores[ch] = dev
            if dev > 0.45:
                flagged_channels.append(ch)
                
            self.buffers[ch].append(val)

        # Non-linear aggregate anomaly score: Max single-channel penalty + mean of top channels
        sorted_scores = sorted(channel_scores.values(), reverse=True)
        max_score = sorted_scores[0] if sorted_scores else 0.0
        top_mean = float(np.mean(sorted_scores[:3])) if len(sorted_scores) >= 3 else max_score
        
        # Fused anomaly score
        anomaly_score = min(1.0, 0.65 * max_score + 0.35 * top_mean)
        
        is_anomalous = anomaly_score >= self.anomaly_threshold
        
        if is_anomalous:
            self.consecutive_anomaly_count += 1
        else:
            self.consecutive_anomaly_count = max(0, self.consecutive_anomaly_count - 1)
            
        # Trigger deep assessment when:
        # 1. Anomaly score exceeds deep assessment threshold
        # 2. Anomaly persists for 2 or more consecutive cycles
        # 3. Sudden critical drop in mandatory flight systems (motor, battery, GPS)
        critical_components_compromised = (
            channel_scores["motor_vibration"] > 0.65 or 
            channel_scores["battery_voltage"] > 0.60 or
            channel_scores["gps_hdop"] > 0.75
        )
        
        trigger_deep = (
            anomaly_score >= 0.65 or 
            self.consecutive_anomaly_count >= 2 or
            critical_components_compromised
        )
        
        self.last_score = anomaly_score
        
        return {
            "drone_id": self.drone_id,
            "anomaly_score": round(anomaly_score, 4),
            "is_anomalous": is_anomalous,
            "flagged_channels": flagged_channels,
            "channel_scores": {k: round(v, 3) for k, v in channel_scores.items()},
            "consecutive_anomalies": self.consecutive_anomaly_count,
            "trigger_deep_assessment": trigger_deep
        }
