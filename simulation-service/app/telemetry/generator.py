import random
import math
from typing import Dict, Any, List, Optional

class TelemetryGenerator:
    """
    Stage 1: Generates realistic onboard component telemetry for UAVs,
    distinguishing between intrinsic hardware faults, gradual degradation,
    and external environmental effects (smoke, dust, multipath).
    
    Includes role-aware battery consumption physics:
    - Search & Exploration / Victim Detection: High consumption (~0.32 - 0.35%/step)
    - Mapping: Moderate consumption (~0.24%/step)
    - Communication Relay (adapted): LOW CONSUMPTION (~0.10%/step) due to camera payload shutdown & eco-hover!
    """
    ROLE_BASE_DRAIN = {
        "Search and exploration": 0.35,     # High power: Active RGB/LiDAR + zigzag search sweep
        "Victim detection": 0.32,           # High power: FLIR sensor cooling + search sweep
        "Mapping and reconnaissance": 0.24, # Moderate power: High altitude LiDAR survey
        "Communication relay": 0.10,        # LOW POWER: Cameras powered off, station-keeping mesh relay hover
        "Return to Home / Land": 0.05       # Minimal power: Low throttle descent
    }

    def __init__(self, drone_id: str):
        self.drone_id = drone_id
        
        # Base physical state
        self.battery_level: float = 100.0   # %
        self.battery_voltage: float = 24.8  # V (6S LiPo: nominal 22.2V, full 25.2V)
        self.battery_temp: float = 28.0     # °C
        self.latest_drain_rate: float = 0.35 # % per step
        
        self.motor_health: float = 1.0      # 0.0 to 1.0
        self.motor_vibration: float = 0.8   # G-force RMS (normal ~ 0.5 - 1.2 G)
        self.motor_temp: float = 42.0       # °C
        
        self.rgb_health: float = 1.0        # 0.0 to 1.0
        self.thermal_health: float = 1.0    # 0.0 to 1.0
        self.lidar_health: float = 1.0      # 0.0 to 1.0
        
        self.gps_accuracy: float = 1.0      # 1.0 = centimeter/RTK, 0.1 = degraded
        self.gps_hdop: float = 0.9          # Normal < 1.2
        self.sat_count: int = 16
        
        self.comm_radio_health: float = 1.0
        self.rssi_dbm: float = -55.0
        self.snr_db: float = 28.0
        
        self.compute_load: float = 38.0     # % CPU
        self.compute_temp: float = 52.0     # °C
        
        # Injected faults table: component -> dict(type, severity, decay_rate)
        self.injected_faults: Dict[str, Dict[str, Any]] = {}

    def inject_fault(self, component: str, fault_type: str, severity: float = 0.8, gradual: bool = False):
        self.injected_faults[component] = {
            "fault_type": fault_type,
            "target_severity": severity,
            "current_severity": 0.1 if gradual else severity,
            "gradual": gradual,
            "step_count": 0
        }

    def clear_fault(self, component: Optional[str] = None):
        if component:
            self.injected_faults.pop(component, None)
        else:
            self.injected_faults.clear()

    def step(self, local_smoke_density: float = 0.0, flight_speed: float = 4.0, current_role: str = "Search and exploration") -> Dict[str, Any]:
        """
        Advances the telemetry by one time tick, applying dynamics, faults, and role-aware battery consumption.
        """
        # 1. Advance gradual faults
        for comp, f in self.injected_faults.items():
            f["step_count"] += 1
            if f["gradual"] and f["current_severity"] < f["target_severity"]:
                f["current_severity"] = min(f["target_severity"], f["current_severity"] + 0.04)

        # 2. Role-Dependent Battery Consumption Physics
        # At start: All drones in Search role consume identical base drain (0.35%/step)
        # After adaptation: Relay drones consume only 0.10%/step (cameras powered down, eco hover)
        base_drain = self.ROLE_BASE_DRAIN.get(current_role, 0.35)
        motor_mult = 1.0 + (1.0 - self.motor_health) * 1.5  # Damaged motors draw more current
        
        if "battery" in self.injected_faults:
            b_fault = self.injected_faults["battery"]
            if b_fault["fault_type"] == "rapid_discharge":
                base_drain *= (3.0 + b_fault["current_severity"] * 3.5)
            elif b_fault["fault_type"] == "cell_undervoltage":
                self.battery_voltage -= 0.05 * b_fault["current_severity"]

        self.latest_drain_rate = base_drain * motor_mult
        self.battery_level = max(0.0, self.battery_level - self.latest_drain_rate)
        
        # Voltage drop follows discharge curve
        self.battery_voltage = 19.8 + (self.battery_level / 100.0) * 5.2 + random.uniform(-0.04, 0.04)
        self.battery_temp += random.uniform(-0.1, 0.2) + (0.5 if base_drain > 0.2 else -0.1)
        self.battery_temp = max(25.0, min(68.0, self.battery_temp))

        # 3. Motor health and vibration
        motor_fault = self.injected_faults.get("motor")
        if motor_fault:
            sev = motor_fault["current_severity"]
            self.motor_health = max(0.05, 1.0 - sev)
            self.motor_vibration = 1.0 + sev * 6.5 + random.uniform(-0.3, 0.3)
            self.motor_temp = 42.0 + sev * 45.0 + random.uniform(-1.0, 1.0)
        else:
            self.motor_health = 1.0
            self.motor_vibration = 0.8 + random.uniform(-0.15, 0.15)
            self.motor_temp = 42.0 + (flight_speed * 0.8) + random.uniform(-0.5, 0.5)

        # 4. RGB Camera (Affected by intrinsic fault + smoke occlusion)
        rgb_fault = self.injected_faults.get("rgb_camera")
        if rgb_fault:
            sev = rgb_fault["current_severity"]
            self.rgb_health = max(0.0, 1.0 - sev)
            rgb_fps = 0.0 if sev > 0.9 else max(1.0, 30.0 * (1.0 - sev))
        else:
            self.rgb_health = 1.0
            rgb_fps = 30.0

        # Environmental smoke reduces optical clarity without damaging camera hardware
        environmental_rgb_clarity = max(0.05, 1.0 - local_smoke_density * 0.92)

        # 5. Thermal Camera (FLIR)
        thm_fault = self.injected_faults.get("thermal_camera")
        if thm_fault:
            sev = thm_fault["current_severity"]
            self.thermal_health = max(0.0, 1.0 - sev)
            thermal_netd_mk = 50.0 + sev * 190.0 + random.uniform(-5.0, 5.0)
            thermal_calib_drift = sev * 8.5 + random.uniform(-0.2, 0.2)
        else:
            self.thermal_health = 1.0
            thermal_netd_mk = 48.0 + random.uniform(-3.0, 3.0)
            thermal_calib_drift = random.uniform(-0.1, 0.1)

        environmental_thermal_factor = max(0.4, 1.0 - local_smoke_density * 0.25)

        # 6. LiDAR Range Scanner
        lid_fault = self.injected_faults.get("lidar")
        if lid_fault:
            sev = lid_fault["current_severity"]
            self.lidar_health = max(0.0, 1.0 - sev)
            lidar_return_density = max(5000.0, 100000.0 * (1.0 - sev))
            lidar_range_noise_cm = 1.5 + sev * 35.0
        else:
            self.lidar_health = 1.0
            lidar_return_density = 98000.0 + random.uniform(-2000.0, 2000.0)
            lidar_range_noise_cm = 1.2 + random.uniform(-0.2, 0.2)

        environmental_lidar_factor = max(0.6, 1.0 - local_smoke_density * 0.35)

        # 7. GPS / Localization
        gps_fault = self.injected_faults.get("gps")
        if gps_fault:
            sev = gps_fault["current_severity"]
            self.gps_accuracy = max(0.05, 1.0 - sev)
            self.gps_hdop = 0.9 + sev * 4.8 + random.uniform(-0.2, 0.2)
            self.sat_count = max(4, int(16 - sev * 10))
            gps_drift_m = sev * 18.0 + random.uniform(-0.5, 0.5)
        else:
            self.gps_accuracy = 1.0
            self.gps_hdop = 0.9 + random.uniform(-0.1, 0.1)
            self.sat_count = random.choice([15, 16, 17])
            gps_drift_m = random.uniform(0.05, 0.35)

        # 8. Communication Radio
        comm_fault = self.injected_faults.get("comm_radio")
        if comm_fault:
            sev = comm_fault["current_severity"]
            self.comm_radio_health = max(0.05, 1.0 - sev)
            self.rssi_dbm = -55.0 - sev * 40.0 + random.uniform(-2.0, 2.0)
            self.snr_db = max(2.0, 28.0 - sev * 24.0)
            packet_loss_rate = min(0.98, 0.02 + sev * 0.9)
        else:
            self.comm_radio_health = 1.0
            self.rssi_dbm = -55.0 + random.uniform(-2.0, 2.0)
            self.snr_db = 28.0 + random.uniform(-1.0, 1.0)
            packet_loss_rate = 0.02 + random.uniform(0.0, 0.02)

        # 9. Compute load: Relay powers down vision compute (only 18% CPU vs 62% for Search)
        compute_health = 1.0
        if current_role == "Communication relay":
            self.compute_load = 18.0 + random.uniform(-2.0, 2.0)
            self.compute_temp = 44.0 + random.uniform(-0.5, 0.5)
            inference_latency_ms = 0.6
        else:
            self.compute_load = 58.0 + (flight_speed * 2.0) + random.uniform(-3.0, 3.0)
            self.compute_temp = 54.0 + (flight_speed * 1.5) + random.uniform(-1.0, 1.0)
            inference_latency_ms = 1.4

        return {
            "drone_id": self.drone_id,
            "battery": {
                "remaining_pct": round(self.battery_level, 1),
                "voltage_v": round(self.battery_voltage, 2),
                "temperature_c": round(self.battery_temp, 1),
                "drain_rate_pct": round(self.latest_drain_rate, 3)
            },
            "motor": {
                "health": round(self.motor_health, 3),
                "vibration_g": round(self.motor_vibration, 2),
                "temperature_c": round(self.motor_temp, 1)
            },
            "rgb_camera": {
                "hardware_health": round(self.rgb_health, 3),
                "clarity_index": round(environmental_rgb_clarity, 3),
                "fps": rgb_fps
            },
            "thermal_camera": {
                "hardware_health": round(self.thermal_health, 3),
                "effective_factor": round(environmental_thermal_factor, 3),
                "netd_mk": round(thermal_netd_mk, 1),
                "drift_offset": round(thermal_calib_drift, 2)
            },
            "lidar": {
                "hardware_health": round(self.lidar_health, 3),
                "effective_factor": round(environmental_lidar_factor, 3),
                "point_rate": int(lidar_return_density),
                "point_rate_hz": int(lidar_return_density),
                "range_noise_cm": round(lidar_range_noise_cm, 2),
                "range_error_m": round(lidar_range_noise_cm / 100.0, 3)
            },
            "localization": {
                "accuracy": round(self.gps_accuracy, 3),
                "hdop": round(self.gps_hdop, 2),
                "satellites": self.sat_count,
                "position_drift_m": round(gps_drift_m, 2)
            },
            "communication": {
                "radio_health": round(self.comm_radio_health, 3),
                "rssi_dbm": round(self.rssi_dbm, 1),
                "snr_db": round(self.snr_db, 1),
                "packet_loss_rate": round(packet_loss_rate, 3)
            },
            "compute": {
                "health": round(compute_health, 3),
                "cpu_load_pct": round(self.compute_load, 1),
                "temp_c": round(self.compute_temp, 1),
                "latency_ms": round(inference_latency_ms, 1)
            },
            "environment": {
                "smoke_density": round(local_smoke_density, 3)
            }
        }
