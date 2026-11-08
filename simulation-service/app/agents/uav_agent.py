import math
import random
from typing import Dict, Any, List, Optional, Tuple

from app.telemetry.generator import TelemetryGenerator
from app.edge_ai.anomaly_detector import EdgeAnomalyDetector
from app.edge_ai.fault_diagnoser import EdgeFaultDiagnoser
from app.edge_ai.capability_estimator import CapabilityEstimator
from app.adaptation.role_selector import SafetyConstrainedRoleSelector

class UAVAgent:
    """
    Autonomous UAV Agent executing edge intelligence and self-adaptive behaviors.
    """
    def __init__(self, drone_id: str, init_x: float, init_y: float, initial_role: str = "Search and exploration"):
        self.drone_id = drone_id
        self.x = init_x
        self.y = init_y
        self.z = 20.0
        self.target_x = init_x + random.uniform(-40, 40)
        self.target_y = init_y + random.uniform(-40, 40)
        self.speed = 3.5
        
        self.current_role = initial_role
        self.assigned_tasks: List[str] = []
        
        # Modules
        self.telemetry_gen = TelemetryGenerator(drone_id)
        self.anomaly_detector = EdgeAnomalyDetector(drone_id)
        self.fault_diagnoser = EdgeFaultDiagnoser(drone_id)
        self.capability_estimator = CapabilityEstimator(drone_id)
        self.role_selector = SafetyConstrainedRoleSelector(drone_id)
        
        # Current state cache
        self.latest_telemetry: Dict[str, Any] = {}
        self.latest_anomaly: Dict[str, Any] = {}
        self.latest_diagnosis: Dict[str, Any] = {}
        self.latest_capabilities: Dict[str, Any] = {
            "c_RGB": 1.0, "c_Thermal": 1.0, "c_LiDAR": 1.0, "c_Communication": 1.0,
            "c_Mobility": 1.0, "c_Localization": 1.0, "c_Energy": 1.0, "c_Compute": 1.0
        }
        self.operational_status = "HEALTHY"
        self.feasible_roles: List[str] = [initial_role]
        self.state_history: List[Dict[str, Any]] = []

    def set_target(self, tx: float, ty: float):
        self.target_x = tx
        self.target_y = ty

    def update_motion(self, dt: float = 1.0, world_width: float = 800.0, world_height: float = 600.0):
        """
        Updates drone position towards target with mobility capability speed modulation.
        """
        c_mob = self.latest_capabilities.get("c_Mobility", 1.0)
        effective_speed = max(0.4, self.speed * c_mob)

        dx = self.target_x - self.x
        dy = self.target_y - self.y
        dist = math.hypot(dx, dy)

        if dist > 3.0:
            vx = (dx / dist) * effective_speed
            vy = (dy / dist) * effective_speed
            self.x += vx * dt
            self.y += vy * dt
        else:
            # Reached waypoint; pick exploratory waypoint if in search/mapping
            if self.current_role in ["Search and exploration", "Mapping and reconnaissance"]:
                self.target_x = max(50.0, min(world_width - 50.0, self.x + random.uniform(-140, 140)))
                self.target_y = max(50.0, min(world_height - 50.0, self.y + random.uniform(-140, 140)))

        # Boundary clamping
        self.x = max(20.0, min(world_width - 20.0, self.x))
        self.y = max(20.0, min(world_height - 20.0, self.y))

    def step_edge_intelligence(self, local_smoke_density: float = 0.0) -> Dict[str, Any]:
        """
        Executes the entire local edge pipeline:
        Stage 1 Telemetry -> Stage 2 Anomaly Detection -> Stage 3 Fault Assessment
        -> Stage 4 Capability Estimation -> Stage 5 Adaptive Role Selection
        """
        # 1. Telemetry
        telemetry = self.telemetry_gen.step(local_smoke_density=local_smoke_density, flight_speed=self.speed)
        self.latest_telemetry = telemetry

        # 2. Anomaly Detection
        anomaly_res = self.anomaly_detector.process(telemetry)
        self.latest_anomaly = anomaly_res

        # 3. Fault Assessment
        if anomaly_res["trigger_deep_assessment"]:
            diagnosis = self.fault_diagnoser.assess_fault(telemetry, anomaly_res)
        else:
            diagnosis = {
                "drone_id": self.drone_id,
                "primary_fault": {"component": "none", "category": "NOMINAL", "severity": "NONE", "confidence": 0.98, "evidence": "Normal nominal limits"},
                "all_faults": [],
                "overall_severity": "NONE",
                "diagnostic_confidence": 0.98,
                "inference_time_ms": 0.5,
                "assessed_at": telemetry["battery"]["remaining_pct"]
            }
        self.latest_diagnosis = diagnosis

        # 4. Capability Estimation
        cap_res = self.capability_estimator.estimate(telemetry, diagnosis)
        self.latest_capabilities = cap_res["capability_vector"]
        self.operational_status = cap_res["operational_status"]

        # 5. Role Selection
        new_role, feasible_roles, reason = self.role_selector.select_best_role(
            self.current_role,
            self.latest_capabilities,
            telemetry["battery"]["remaining_pct"]
        )
        role_changed = (new_role != self.current_role)
        previous_role = self.current_role
        self.current_role = new_role
        self.feasible_roles = feasible_roles

        return {
            "drone_id": self.drone_id,
            "x": round(self.x, 1),
            "y": round(self.y, 1),
            "current_role": self.current_role,
            "operational_status": self.operational_status,
            "battery": telemetry["battery"]["remaining_pct"],
            "telemetry": telemetry,
            "anomaly": anomaly_res,
            "diagnosis": diagnosis,
            "capabilities": self.latest_capabilities,
            "diagnostic_confidence": diagnosis["diagnostic_confidence"],
            "feasible_roles": self.feasible_roles,
            "role_changed": role_changed,
            "previous_role": previous_role,
            "adaptation_reason": reason
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "drone_id": self.drone_id,
            "x": round(self.x, 1),
            "y": round(self.y, 1),
            "current_role": self.current_role,
            "operational_status": self.operational_status,
            "battery": round(self.telemetry_gen.battery_level, 1),
            "capabilities": self.latest_capabilities,
            "diagnostic_confidence": self.latest_diagnosis.get("diagnostic_confidence", 0.98),
            "anomaly_score": self.latest_anomaly.get("anomaly_score", 0.0),
            "assigned_tasks": self.assigned_tasks,
            "feasible_roles": self.feasible_roles,
            "active_faults": list(self.telemetry_gen.injected_faults.keys())
        }
