import math
import random
import time
from typing import Dict, Any, List, Optional, Tuple

from app.environment.disaster_env import DisasterEnvironment
from app.agents.uav_agent import UAVAgent
from app.communication.p2p_mesh import P2PCommunicationMesh
from app.coordination.auction_engine import DistributedAuctionCoordinator

class SwarmManager:
    """
    Manages decentralized UAV swarm simulation lifecycle,
    coordination events, disaster interactions, and research state.
    """
    def __init__(self, num_drones: int = 6, seed: int = 42):
        self.num_drones = num_drones
        self.seed = seed
        self.sim_time = 0.0
        self.step_count = 0
        self.is_running = False
        self.sim_speed = 1.0 # 1x, 2x, etc.
        
        self.env = DisasterEnvironment(width=800.0, height=600.0, seed=seed)
        self.mesh = P2PCommunicationMesh(comm_range=230.0, base_packet_loss=0.04)
        self.auction_coordinator = DistributedAuctionCoordinator()
        
        self.drones: Dict[str, UAVAgent] = {}
        self.tasks: List[Dict[str, Any]] = []
        self.recent_events: List[Dict[str, Any]] = []
        
        self.initialize_swarm()
        self.initialize_tasks()

    def initialize_swarm(self):
        self.drones.clear()
        initial_configs = [
            ("UAV-Alpha", 150.0, 150.0, "Search and exploration"),
            ("UAV-Beta", 300.0, 180.0, "Victim detection"),
            ("UAV-Gamma", 450.0, 220.0, "Mapping and reconnaissance"),
            ("UAV-Delta", 600.0, 280.0, "Communication relay"),
            ("UAV-Epsilon", 250.0, 420.0, "Search and exploration"),
            ("UAV-Zeta", 520.0, 450.0, "Victim detection"),
        ]
        
        count = min(len(initial_configs), self.num_drones)
        for i in range(count):
            did, x, y, role = initial_configs[i]
            self.drones[did] = UAVAgent(did, x, y, role)

    def initialize_tasks(self):
        self.tasks = [
            {
                "taskId": "TSK-101",
                "title": "Sector A Rubble Search",
                "taskType": "SEARCH",
                "location": {"x": 160.0, "y": 180.0},
                "assignedDrone": "UAV-Alpha",
                "taskStatus": "IN_PROGRESS",
                "priority": 8
            },
            {
                "taskId": "TSK-102",
                "title": "Trapped Survivor Detection",
                "taskType": "VICTIM_DETECTION",
                "location": {"x": 260.0, "y": 390.0},
                "assignedDrone": "UAV-Beta",
                "taskStatus": "IN_PROGRESS",
                "priority": 10
            },
            {
                "taskId": "TSK-103",
                "title": "Collapsed Commercial Infrastructure Mapping",
                "taskType": "MAPPING",
                "location": {"x": 450.0, "y": 140.0},
                "assignedDrone": "UAV-Gamma",
                "taskStatus": "IN_PROGRESS",
                "priority": 7
            },
            {
                "taskId": "TSK-104",
                "title": "Emergency Relay Corridor Link",
                "taskType": "COMMUNICATION_RELAY",
                "location": {"x": 400.0, "y": 300.0},
                "assignedDrone": "UAV-Delta",
                "taskStatus": "IN_PROGRESS",
                "priority": 9
            },
            {
                "taskId": "TSK-105",
                "title": "Sector B Perimeter Search",
                "taskType": "SEARCH",
                "location": {"x": 580.0, "y": 420.0},
                "assignedDrone": "UAV-Epsilon",
                "taskStatus": "IN_PROGRESS",
                "priority": 6
            }
        ]

    def reset(self, num_drones: Optional[int] = None, seed: Optional[int] = None):
        if seed is not None:
            self.seed = seed
        if num_drones is not None:
            self.num_drones = num_drones
            
        self.sim_time = 0.0
        self.step_count = 0
        self.env.reset(self.seed)
        self.initialize_swarm()
        self.initialize_tasks()
        self.recent_events.clear()

    def inject_fault(self, drone_id: str, component: str, fault_type: str, severity: float = 0.8, gradual: bool = False) -> Dict[str, Any]:
        drone = self.drones.get(drone_id)
        if not drone:
            return {"success": False, "error": f"Drone {drone_id} not found"}

        drone.telemetry_gen.inject_fault(component, fault_type, severity, gradual)
        event = {
            "eventType": "FAULT_INJECTED",
            "droneId": drone_id,
            "component": component,
            "faultType": fault_type,
            "severity": severity,
            "gradual": gradual,
            "timestamp": self.sim_time,
            "message": f"Injected {fault_type} on {component} of {drone_id}"
        }
        self.recent_events.append(event)
        return {"success": True, "event": event}

    def clear_fault(self, drone_id: str, component: Optional[str] = None):
        drone = self.drones.get(drone_id)
        if drone:
            drone.telemetry_gen.clear_fault(component)

    def set_environment_params(self, dust_level: Optional[float] = None, comm_range: Optional[float] = None):
        if dust_level is not None:
            self.env.global_dust_level = max(0.0, min(1.0, dust_level))
        if comm_range is not None:
            self.mesh.comm_range = max(50.0, min(600.0, comm_range))

    def step(self, dt: float = 1.0) -> Dict[str, Any]:
        """
        Executes one full simulation time step.
        """
        self.step_count += 1
        self.sim_time += dt
        
        # 1. Update motion and step edge intelligence for each drone
        drone_states = []
        positions = {}
        comm_healths = {}

        for did, drone in self.drones.items():
            # Local smoke density at drone location
            smoke_val = self.env.get_smoke_density_at(drone.x, drone.y)
            
            # Physical motion
            drone.update_motion(dt=dt, world_width=self.env.width, world_height=self.env.height)
            
            # Local edge intelligence pipeline (Stages 1-5)
            state = drone.step_edge_intelligence(local_smoke_density=smoke_val)
            drone_states.append(state)
            
            positions[did] = (drone.x, drone.y)
            comm_healths[did] = drone.latest_capabilities.get("c_Communication", 1.0)

            # Sensor coverage marking on environment grid
            drone_fov = 70.0 * drone.latest_capabilities.get("c_LiDAR", 1.0)
            self.env.mark_coverage(drone.x, drone.y, fov_radius=max(35.0, drone_fov))

            # 2. Check for Role Adaptation & Task Reassignment Need
            if state["role_changed"]:
                prev_role = state["previous_role"]
                new_role = state["current_role"]
                event = {
                    "eventType": "ROLE_CHANGED",
                    "droneId": did,
                    "previousRole": prev_role,
                    "newRole": new_role,
                    "reason": state["adaptation_reason"],
                    "timestamp": self.sim_time
                }
                self.recent_events.append(event)

                # Check if this drone held tasks requiring its former role
                for task in self.tasks:
                    if task.get("assignedDrone") == did and task.get("taskStatus") == "IN_PROGRESS":
                        # Initiate decentralized bidding for task
                        auction = self.auction_coordinator.start_auction(
                            task=task,
                            initiating_drone_id=did,
                            reason=f"Primary sensor degraded; adapted from {prev_role} to {new_role}",
                            sim_time=self.sim_time
                        )
                        task["taskStatus"] = "BIDDING"
                        task["assignedDrone"] = None
                        self.recent_events.append({
                            "eventType": "TASK_REASSIGNMENT_REQUESTED",
                            "taskId": task["taskId"],
                            "initiatingDrone": did,
                            "timestamp": self.sim_time
                        })

        # 3. Update P2P Communication Mesh Topology (Stage 6)
        comm_graph = self.mesh.update_topology(positions, comm_healths)
        topology_snapshot = self.mesh.get_topology_snapshot()

        # 4. Process Decentralized Task Auctions with Connected Peers (Stage 7)
        for task_id, auction in list(self.auction_coordinator.active_auctions.items()):
            if auction["status"] == "OPEN":
                initiator = auction["initiating_drone_id"]
                # Only 1-hop reachable peers in current graph can receive request & submit bids
                reachable_peers = list(comm_graph.neighbors(initiator)) if initiator in comm_graph else []
                
                for peer_id in reachable_peers:
                    peer_drone = self.drones[peer_id]
                    # Drone evaluates its own capability and bids
                    bid_val = self.auction_coordinator.submit_bid(
                        task_id=task_id,
                        drone_id=peer_id,
                        drone_cap=peer_drone.latest_capabilities,
                        drone_pos=(peer_drone.x, peer_drone.y),
                        task_loc=(auction["task"]["location"]["x"], auction["task"]["location"]["y"]),
                        battery_pct=peer_drone.telemetry_gen.battery_level
                    )
                    if bid_val is not None:
                        self.recent_events.append({
                            "eventType": "BID_SUBMITTED",
                            "taskId": task_id,
                            "droneId": peer_id,
                            "bidScore": bid_val,
                            "timestamp": self.sim_time
                        })

                # Resolve auction
                resolved_auction = self.auction_coordinator.resolve_auction(task_id, self.sim_time)
                if resolved_auction and resolved_auction["status"] == "RESOLVED":
                    winner_id = resolved_auction["winner_drone_id"]
                    # Update task assignment
                    for t in self.tasks:
                        if t["taskId"] == task_id:
                            t["assignedDrone"] = winner_id
                            t["taskStatus"] = "IN_PROGRESS"
                            self.drones[winner_id].assigned_tasks.append(task_id)
                            # Vector winner toward task site
                            self.drones[winner_id].set_target(t["location"]["x"], t["location"]["y"])
                            break
                    self.recent_events.append({
                        "eventType": "TASK_REASSIGNED",
                        "taskId": task_id,
                        "awardedTo": winner_id,
                        "timestamp": self.sim_time
                    })

        # 5. Check Victim Detection across the Disaster Environment
        for v in self.env.victims:
            if not v["detected"]:
                for did, drone in self.drones.items():
                    dist = math.hypot(drone.x - v["x"], drone.y - v["y"])
                    if dist < 65.0:
                        # Detection probability depends on drone sensor capabilities & environmental smoke
                        smoke = self.env.get_smoke_density_at(v["x"], v["y"])
                        c_rgb = drone.latest_capabilities.get("c_RGB", 0.0) * max(0.1, 1.0 - smoke * 0.8)
                        c_th = drone.latest_capabilities.get("c_Thermal", 0.0) * max(0.2, 1.0 - smoke * 0.15)
                        
                        det_prob = max(c_th * 0.85, c_rgb * 0.70)
                        if random.random() < det_prob:
                            v["detected"] = True
                            v["detected_by"] = did
                            v["detected_at_step"] = self.step_count
                            v["detection_modality"] = "Thermal FLIR" if c_th > c_rgb else "RGB High-Res"
                            self.recent_events.append({
                                "eventType": "VICTIM_LOCATED",
                                "victimId": v["id"],
                                "droneId": did,
                                "modality": v["detection_modality"],
                                "location": {"x": v["x"], "y": v["y"]},
                                "timestamp": self.sim_time
                            })
                            break

        coverage_pct = self.env.get_coverage_percentage()
        detected_victims_count = sum(1 for v in self.env.victims if v["detected"])

        return {
            "step": self.step_count,
            "sim_time": round(self.sim_time, 1),
            "coverage_percent": coverage_pct,
            "victims_detected": detected_victims_count,
            "total_victims": len(self.env.victims),
            "drones": [d.to_dict() for d in self.drones.values()],
            "detailed_drone_states": {d["drone_id"]: d for d in drone_states},
            "environment": self.env.to_dict(),
            "topology": topology_snapshot,
            "tasks": self.tasks,
            "recent_events": self.recent_events[-15:]
        }
