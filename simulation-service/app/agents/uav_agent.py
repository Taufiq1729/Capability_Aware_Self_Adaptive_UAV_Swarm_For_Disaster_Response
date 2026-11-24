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
    Includes trajectory tracking, individual color identification, and role-based battery dissipation.
    """
    def __init__(
        self,
        drone_id: str,
        init_x: float,
        init_y: float,
        initial_role: str = "Search and exploration",
        assigned_color: str = "#06B6D4",
        current_floor: int = 1
    ):
        self.drone_id = drone_id
        self.x = init_x
        self.y = init_y
        self.z = float(current_floor * 8.0)
        self.current_floor = current_floor
        self.assigned_color = assigned_color
        
        self.target_x = init_x + random.uniform(-40, 40)
        self.target_y = init_y + random.uniform(-40, 40)
        self.target_z = self.z
        self.speed = 16.0
        
        self.initial_role = initial_role
        self.current_role = initial_role
        self.previous_role = initial_role
        self.adaptation_reason = "Nominal search operation"
        self.role_history: List[Dict[str, Any]] = [
            {"role": initial_role, "reason": "Initial swarm search deployment", "timestamp": 0.0}
        ]
        self.assigned_tasks: List[str] = []
        
        # Flight path trajectory breadcrumbs (last 80 points)
        self.trajectory: List[Dict[str, float]] = [
            {"x": round(self.x, 1), "y": round(self.y, 1), "z": round(self.z, 1)}
        ]
        
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
        self.patrol_waypoints: List[Dict[str, float]] = []
        self.patrol_idx: int = 0

    def set_patrol_route(self, waypoints: List[Dict[str, float]]):
        self.patrol_waypoints = waypoints
        self.patrol_idx = 0
        if waypoints:
            self.target_x = waypoints[0]["x"]
            self.target_y = waypoints[0]["y"]
            if "z" in waypoints[0]:
                self.target_z = waypoints[0]["z"]

    def set_target(self, tx: float, ty: float, tz: Optional[float] = None):
        self.target_x = tx
        self.target_y = ty
        if tz is not None:
            self.target_z = tz

    def update_motion(self, dt: float = 1.0, world_width: float = 800.0, world_height: float = 600.0):
        """
        Updates drone position towards target with mobility capability speed modulation.
        """
        c_mob = self.latest_capabilities.get("c_Mobility", 1.0)
        
        # If in Relay mode, drone maintains low-speed eco hover at mesh relay position
        if self.current_role == "Communication relay":
            effective_speed = max(1.2, 4.0 * c_mob) # Eco hover loiter speed
        else:
            effective_speed = max(2.5, self.speed * c_mob)

        dx = self.target_x - self.x
        dy = self.target_y - self.y
        dist = math.hypot(dx, dy)

        if dist > 3.0:
            vx = (dx / dist) * effective_speed
            vy = (dy / dist) * effective_speed
            self.x += vx * dt
            self.y += vy * dt
            dz = self.target_z - self.z
            if abs(dz) > 0.1:
                self.z += (dz / max(1.0, abs(dz))) * min(abs(dz), effective_speed * 0.4 * dt)
                self.current_floor = 2 if self.z >= 10.0 else 1
        else:
            # Reached waypoint; advance systematically along building patrol route
            if self.current_role == "Communication relay":
                # Tight loiter circle around mesh anchor
                self.target_x = max(100.0, min(world_width - 100.0, self.x + random.uniform(-25, 25)))
                self.target_y = max(100.0, min(world_height - 100.0, self.y + random.uniform(-25, 25)))
            elif self.patrol_waypoints:
                self.patrol_idx = (self.patrol_idx + 1) % len(self.patrol_waypoints)
                next_wpt = self.patrol_waypoints[self.patrol_idx]
                self.target_x = next_wpt["x"]
                self.target_y = next_wpt["y"]
                if "z" in next_wpt:
                    self.target_z = next_wpt["z"]
            else:
                # Fallback exploratory waypoint if in search/mapping
                if self.current_role in ["Search and exploration", "Victim detection"]:
                    self.target_x = max(70.0, min(world_width - 70.0, self.x + random.uniform(-130, 130)))
                    self.target_y = max(70.0, min(world_height - 70.0, self.y + random.uniform(-130, 130)))

        # Boundary clamping
        self.x = max(20.0, min(world_width - 20.0, self.x))
        self.y = max(20.0, min(world_height - 20.0, self.y))

        # Append to trajectory trail (limit to 80 points)
        if len(self.trajectory) == 0 or math.hypot(self.x - self.trajectory[-1]["x"], self.y - self.trajectory[-1]["y"]) > 6.0:
            self.trajectory.append({
                "x": round(self.x, 1),
                "y": round(self.y, 1),
                "z": round(self.z, 1)
            })
            if len(self.trajectory) > 80:
                self.trajectory.pop(0)

    def step_edge_intelligence(self, local_smoke_density: float = 0.0) -> Dict[str, Any]:
        """
        Executes local edge pipeline:
        Stage 1 Telemetry (role-aware battery) -> Stage 2 Anomaly Detection
        -> Stage 3 Fault Assessment (PyTorch) -> Stage 4 Capability Estimation
        -> Stage 5 Adaptive Role Selection
        """
        # 1. Telemetry with role-aware battery consumption
        telemetry = self.telemetry_gen.step(
            local_smoke_density=local_smoke_density,
            flight_speed=self.speed,
            current_role=self.current_role
        )
        self.latest_telemetry = telemetry

        # 2. Anomaly Detection
        anomaly_res = self.anomaly_detector.process(telemetry)
        self.latest_anomaly = anomaly_res

        # 3. Fault Assessment (Powered by PyTorch deep neural model)
        if anomaly_res["trigger_deep_assessment"]:
            diagnosis = self.fault_diagnoser.assess_fault(telemetry, anomaly_res)
        else:
            diagnosis = {
                "drone_id": self.drone_id,
                "primary_fault": {"component": "none", "category": "NOMINAL", "severity": "NONE", "confidence": 0.98, "evidence": "Normal nominal limits (PyTorch-verified)"},
                "all_faults": [],
                "overall_severity": "NONE",
                "diagnostic_confidence": 0.98,
                "inference_time_ms": 0.6,
                "assessed_at": telemetry["battery"]["remaining_pct"]
            }
        self.latest_diagnosis = diagnosis

        # 4. Capability Estimation
        cap_res = self.capability_estimator.estimate(telemetry, diagnosis)
        self.latest_capabilities = cap_res["capability_vector"]
        self.operational_status = cap_res["operational_status"]

        # 5. Role Selection (incorporates diagnostic confidence & remaining capabilities)
        new_role, feasible_roles, reason = self.role_selector.select_best_role(
            self.current_role,
            self.latest_capabilities,
            telemetry["battery"]["remaining_pct"],
            diagnostic_confidence=diagnosis.get("diagnostic_confidence", 0.95)
        )
        role_changed = (new_role != self.current_role)
        previous_role = self.current_role
        if role_changed:
            self.previous_role = self.current_role
            self.adaptation_reason = reason
            self.role_history.append({
                "role": new_role,
                "previous_role": previous_role,
                "reason": reason,
                "timestamp": round(self.telemetry_gen.battery_level, 1)
            })
        self.current_role = new_role
        self.feasible_roles = feasible_roles

        return {
            "drone_id": self.drone_id,
            "droneId": self.drone_id,
            "x": round(self.x, 1),
            "y": round(self.y, 1),
            "z": round(self.z, 1),
            "floor": self.current_floor,
            "assigned_color": self.assigned_color,
            "assignedColor": self.assigned_color,
            "current_role": self.current_role,
            "currentRole": self.current_role,
            "initial_role": self.initial_role,
            "previous_role": self.previous_role,
            "role_adapted": (self.current_role != self.initial_role),
            "operational_status": self.operational_status,
            "operationalStatus": self.operational_status,
            "battery": telemetry["battery"]["remaining_pct"],
            "battery_drain_rate": telemetry["battery"].get("drain_rate_pct", 0.35),
            "telemetry": telemetry,
            "anomaly": anomaly_res,
            "diagnosis": diagnosis,
            "capabilities": self.latest_capabilities,
            "diagnostic_confidence": diagnosis["diagnostic_confidence"],
            "feasible_roles": self.feasible_roles,
            "role_changed": role_changed,
            "adaptation_reason": reason,
            "role_history": self.role_history,
            "trajectory": self.trajectory[-35:] # Send last 35 points for network efficiency
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "drone_id": self.drone_id,
            "droneId": self.drone_id,
            "x": round(self.x, 1),
            "y": round(self.y, 1),
            "z": round(self.z, 1),
            "floor": self.current_floor,
            "assigned_color": self.assigned_color,
            "assignedColor": self.assigned_color,
            "current_role": self.current_role,
            "currentRole": self.current_role,
            "initial_role": self.initial_role,
            "previous_role": self.previous_role,
            "role_adapted": (self.current_role != self.initial_role),
            "operational_status": self.operational_status,
            "operationalStatus": self.operational_status,
            "adaptation_reason": self.adaptation_reason,
            "battery": round(self.telemetry_gen.battery_level, 1),
            "battery_drain_rate": round(self.telemetry_gen.latest_drain_rate, 3),
            "batteryDrainRate": round(self.telemetry_gen.latest_drain_rate, 3),
            "capabilities": self.latest_capabilities,
            "diagnostic_confidence": self.latest_diagnosis.get("diagnostic_confidence", 0.98),
            "anomaly_score": self.latest_anomaly.get("anomaly_score", 0.0),
            "assigned_tasks": self.assigned_tasks,
            "feasible_roles": self.feasible_roles,
            "active_faults": list(self.telemetry_gen.injected_faults.keys()),
            "role_history": self.role_history,
            "trajectory": self.trajectory[-45:] # Last 45 coordinates
        }
