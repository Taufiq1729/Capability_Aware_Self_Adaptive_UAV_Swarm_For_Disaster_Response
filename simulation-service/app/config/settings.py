from pydantic import BaseModel
from typing import List, Tuple

class SimulationConfig(BaseModel):
    world_width: float = 800.0
    world_height: float = 600.0
    default_comm_range: float = 230.0
    default_comm_loss_rate: float = 0.05
    sensor_fov_radius: float = 75.0
    telemetry_frequency_hz: float = 2.0
    anomaly_threshold: float = 0.55
    deep_diagnosis_threshold: float = 0.65
    critical_battery_threshold: float = 18.0
    rtl_battery_threshold: float = 25.0
    
    # Sensor smoke attenuation factors
    smoke_rgb_attenuation: float = 0.75     # Smoke degrades RGB significantly
    smoke_thermal_attenuation: float = 0.15 # Smoke has lower effect on thermal
    smoke_lidar_attenuation: float = 0.40   # LiDAR suffers backscatter from dense smoke

settings = SimulationConfig()
