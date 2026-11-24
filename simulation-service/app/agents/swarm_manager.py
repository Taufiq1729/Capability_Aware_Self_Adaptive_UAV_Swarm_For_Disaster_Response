import math
import random
import time
from typing import Dict, Any, List, Optional, Tuple

from app.environment.disaster_env import DisasterEnvironment
from app.agents.uav_agent import UAVAgent
from app.communication.p2p_mesh import P2PCommunicationMesh
from app.coordination.auction_engine import DistributedAuctionCoordinator

DRONE_NAMES = [
    "UAV-Alpha", "UAV-Beta", "UAV-Gamma", "UAV-Delta",
    "UAV-Epsilon", "UAV-Zeta", "UAV-Eta", "UAV-Theta",
    "UAV-Iota", "UAV-Kappa", "UAV-Lambda", "UAV-Mu"
]

DRONE_COLORS = [
    "#06B6D4", # Alpha: Electric Cyan
    "#10B981", # Beta: Vivid Emerald
    "#F59E0B", # Gamma: Bright Amber
    "#8B5CF6", # Delta: Neon Purple
    "#EC4899", # Epsilon: Radiant Pink
    "#3B82F6", # Zeta: Royal Blue
    "#14B8A6", # Eta: Teal
    "#F97316", # Theta: Vivid Orange
    "#A855F7", # Iota: Bright Violet
    "#84CC16", # Kappa: Lime Green
    "#E11D48", # Lambda: Crimson Rose
    "#0284C7"  # Mu: Sky Blue
]

class SwarmManager:
    """
    Manages decentralized UAV swarm simulation lifecycle,
    coordination events, disaster interactions, and research state.
    """
    def __init__(self, num_drones: int = 6, seed: int = 42, complexity: str = "MEDIUM"):
        self.num_drones = max(3, min(12, num_drones))
        self.seed = seed
        self.complexity = complexity
        self.sim_time = 0.0
        self.step_count = 0
        self.is_running = False
        self.sim_speed = 1.0
        
        self.env = DisasterEnvironment(width=800.0, height=600.0, complexity=complexity, seed=seed)
        self.mesh = P2PCommunicationMesh(comm_range=240.0, base_packet_loss=0.03)
        self.auction_coordinator = DistributedAuctionCoordinator()
        
        self.drones: Dict[str, UAVAgent] = {}
        self.tasks: List[Dict[str, Any]] = []
        self.recent_events: List[Dict[str, Any]] = []
        
        self.initialize_swarm()
        self.initialize_tasks()

        # Compute initial topology so topology snapshot is immediately populated on startup
        positions = {did: (d.x, d.y) for did, d in self.drones.items()}
        comm_healths = {did: 1.0 for did in self.drones.keys()}
        drone_floors = {did: d.current_floor for did, d in self.drones.items()}
        self.mesh.update_topology(positions, comm_healths, drone_floors=drone_floors)

    def initialize_swarm(self):
        """
        Initializes swarm nodes.
        CRITICAL REQUIREMENT: At start, ALL drones work on SEARCHING!
        Battery of all drones reduces at the exact same uniform rate at start.
        """
        self.drones.clear()
        
        # Position nodes strategically across the multistorey building floors
        floor_positions = [
            (140.0, 130.0, 1),
            (360.0, 130.0, 1),
            (560.0, 140.0, 1),
            (160.0, 300.0, 2),
            (380.0, 300.0, 2),
            (580.0, 310.0, 2),
            (240.0, 480.0, 3),
            (520.0, 480.0, 3),
            (100.0, 200.0, 1),
            (450.0, 200.0, 2),
            (300.0, 400.0, 3),
            (650.0, 400.0, 3)
        ]

        for i in range(self.num_drones):
            did = DRONE_NAMES[i % len(DRONE_NAMES)]
            color = DRONE_COLORS[i % len(DRONE_COLORS)]
            pos = floor_positions[i % len(floor_positions)]
            x, y, raw_floor = pos
            floor = min(raw_floor, self.env.num_floors)
            
            # ALL drones initialize in SEARCH role!
            initial_role = "Search and exploration"
            
            drone = UAVAgent(
                drone_id=did,
                init_x=x,
                init_y=y,
                initial_role=initial_role,
                assigned_color=color,
                current_floor=floor
            )

            # Assign systematic patrol route traversing all rooms, corridors, and victim sectors
            patrol = []
            num_rooms = len(self.env.rooms)
            for step_r in range(num_rooms):
                r_idx = (i + step_r) % num_rooms
                rm = self.env.rooms[r_idx]
                # Room center search waypoint
                patrol.append({
                    "x": float(rm["x"] + rm["w"] * 0.5),
                    "y": float(rm["y"] + rm["h"] * 0.5),
                    "z": float(rm.get("floor", 1) * 6.0)
                })
                # Check for trapped victim in this room/zone
                for v in self.env.victims:
                    if v.get("room") == rm["id"] or v.get("room_id") == rm["id"] or v.get("floor") == rm["floor"]:
                        patrol.append({
                            "x": float(v["x"]),
                            "y": float(v["y"]),
                            "z": float(v.get("floor", 1) * 8.0)
                        })
                # Hallway / transit waypoint
                patrol.append({
                    "x": float(rm["x"] + 20.0),
                    "y": float(self.env.height * 0.5),
                    "z": float(rm.get("floor", 1) * 6.0)
                })
            drone.set_patrol_route(patrol)

            self.drones[did] = drone

    def initialize_tasks(self):
        """
        Generates initial search tasks across building rooms.
        Every drone starts with a search task, ensuring uniform battery consumption at start.
        """
        self.tasks.clear()
        task_types = ["SEARCH", "VICTIM_DETECTION", "SEARCH", "SEARCH", "VICTIM_DETECTION", "SEARCH"]
        
        for idx, (did, drone) in enumerate(self.drones.items()):
            # Find closest room to drone
            room = self.env.rooms[idx % len(self.env.rooms)]
            task_type = task_types[idx % len(task_types)]
            
            tsk = {
                "taskId": f"TSK-{101 + idx}",
                "title": f"Floor {room['floor']} {room['name']} Autonomous Search",
                "taskType": task_type,
                "location": {"x": float(room["x"] + room["w"] / 2.0), "y": float(room["y"] + room["h"] / 2.0)},
                "assignedDrone": did,
                "previousDrone": None,
                "acquiredFrom": None,
                "handoverReason": None,
                "handoverConfidence": None,
                "handoverTimestamp": None,
                "taskStatus": "IN_PROGRESS",
                "priority": 8 + (idx % 3),
                "assignedBasedOnHealth": {
                    "healthStatus": "HEALTHY",
                    "confidence": 0.98,
                    "reason": "Nominal sensor baseline; active search deployment"
                },
                "handoverHistory": []
            }
            self.tasks.append(tsk)
            drone.assigned_tasks = [tsk["taskId"]]

    def reset(self, num_drones: Optional[int] = None, seed: Optional[int] = None, complexity: Optional[str] = None):
        if seed is not None:
            self.seed = seed
        if num_drones is not None:
            self.num_drones = max(3, min(12, num_drones))
        if complexity is not None:
            self.complexity = complexity
            
        self.sim_time = 0.0
        self.step_count = 0
        self.env.reset(self.seed, self.complexity)
        self.initialize_swarm()
        self.initialize_tasks()

        # Compute initial topology so topology snapshot is immediately populated on startup
        positions = {did: (d.x, d.y) for did, d in self.drones.items()}
        comm_healths = {did: 1.0 for did in self.drones.keys()}
        drone_floors = {did: d.current_floor for did, d in self.drones.items()}
        self.mesh.update_topology(positions, comm_healths, drone_floors=drone_floors)
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
            self.mesh.comm_range = max(60.0, min(600.0, comm_range))

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
        drone_floors = {}

        for did, drone in self.drones.items():
            # Local smoke density at drone location
            smoke_val = self.env.get_smoke_density_at(drone.x, drone.y)
            
            # Physical motion
            drone.update_motion(dt=dt, world_width=self.env.width, world_height=self.env.height)
            
            # Local edge intelligence pipeline (Stages 1-5)
            # Battery consumption is strictly determined by drone.current_role
            state = drone.step_edge_intelligence(local_smoke_density=smoke_val)
            drone_states.append(state)
            
            positions[did] = (drone.x, drone.y)
            comm_healths[did] = drone.latest_capabilities.get("c_Communication", 1.0)
            drone_floors[did] = drone.current_floor

            # Sensor coverage marking on environment grid
            drone_fov = 70.0 * drone.latest_capabilities.get("c_LiDAR", 1.0)
            self.env.mark_coverage(drone.x, drone.y, fov_radius=max(35.0, drone_fov))

            # Check for victim detection in FOV & Automated START Triage
            for victim in self.env.victims:
                if not victim["detected"]:
                    dist = math.hypot(drone.x - victim["x"], drone.y - victim["y"])
                    # Check sensory capability
                    rgb_cap = drone.latest_capabilities.get("c_RGB", 1.0)
                    thm_cap = drone.latest_capabilities.get("c_Thermal", 1.0)
                    
                    if dist <= 65.0 and (rgb_cap >= 0.50 or thm_cap >= 0.55):
                        victim["detected"] = True
                        victim["detected_by"] = did
                        victim["detected_at_step"] = self.step_count
                        victim["detection_modality"] = "THERMAL_FLIR" if thm_cap > rgb_cap else "RGB_VISION"
                        victim["triage_step"] = self.step_count
                        
                        t_tag = victim.get("triage_tag", "RED")
                        self.recent_events.append({
                            "eventType": "VICTIM_LOCATED",
                            "victimId": victim["id"],
                            "droneId": did,
                            "triageTag": t_tag,
                            "vitalSummary": f"Temp {victim.get('vital_temp_c', 37.0)}°C, Pulse {victim.get('pulse_bpm', 80)} BPM",
                            "location": {"x": victim["x"], "y": victim["y"], "floor": victim["floor"]},
                            "modality": victim["detection_modality"],
                            "timestamp": round(self.sim_time, 1)
                        })

                        # Automated Emergency First-Aid / Radio Beacon Drop for Immediate (RED/YELLOW) Survivors
                        if t_tag in ["RED", "YELLOW"] and victim.get("payload_status") != "DELIVERED":
                            mob_cap = drone.latest_capabilities.get("c_Mobility", 1.0)
                            if mob_cap >= 0.35:
                                victim["payload_status"] = "DELIVERED"
                                victim["payload_delivered_by"] = did
                                victim["payload_delivered_at_step"] = self.step_count
                                self.recent_events.append({
                                    "eventType": "EMERGENCY_PAYLOAD_DELIVERED",
                                    "victimId": victim["id"],
                                    "droneId": did,
                                    "triageTag": t_tag,
                                    "location": {"x": victim["x"], "y": victim["y"], "floor": victim["floor"]},
                                    "message": f"UAV {did} deployed emergency medical beacon kit to {t_tag} survivor ({victim['name']}).",
                                    "timestamp": round(self.sim_time, 1)
                                })

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
                    "timestamp": round(self.sim_time, 1)
                }
                self.recent_events.append(event)

                # Autonomous Stairwell Mesh Self-Healing:
                # If role adapted to Communication Relay, dispatch drone to the central vertical architectural stairwell
                if "relay" in new_role.lower():
                    drone.set_target(390.0, 310.0, tz=18.0)
                    self.recent_events.append({
                        "eventType": "AUTONOMOUS_MESH_RELAY_DISPATCH",
                        "droneId": did,
                        "target": "Central Stairwell Vertical RF Anchor (390, 310)",
                        "reason": "Relocating to stairwell line-of-sight duct to heal 3D floor network partition.",
                        "timestamp": round(self.sim_time, 1)
                    })

                # Check if this drone held tasks requiring capabilities it no longer possesses
                for task in self.tasks:
                    if task.get("assignedDrone") == did and task.get("taskStatus") == "IN_PROGRESS":
                        auction = self.auction_coordinator.start_auction(
                            task=task,
                            initiating_drone_id=did,
                            reason=f"Primary sensor degraded ({state['diagnosis']['primary_fault']['category']}). Role autonomously adapted from '{prev_role}' to '{new_role}'.",
                            sim_time=self.sim_time,
                            initiator_health_status=state["operational_status"],
                            initiator_fault=state["diagnosis"]["primary_fault"]["category"],
                            initiator_confidence=state["diagnosis"]["diagnostic_confidence"]
                        )
                        task["taskStatus"] = "BIDDING"
                        task["previousDrone"] = did
                        task["assignedDrone"] = None
                        self.recent_events.append({
                            "eventType": "TASK_REASSIGNMENT_REQUESTED",
                            "taskId": task["taskId"],
                            "initiatingDrone": did,
                            "reason": auction["reason"],
                            "timestamp": round(self.sim_time, 1)
                        })

        # 3. Update P2P Communication Mesh Topology using NetworkX (Stage 6) with 3D Floor Attenuation
        comm_graph = self.mesh.update_topology(positions, comm_healths, drone_floors=drone_floors)
        topology_snapshot = self.mesh.get_topology_snapshot()

        # 4. Process Decentralized Task Auctions with Connected Peers (Stage 7)
        for task_id, auction in list(self.auction_coordinator.active_auctions.items()):
            if auction["status"] == "OPEN":
                initiator = auction["initiating_drone_id"]
                reachable_peers = list(comm_graph.neighbors(initiator)) if initiator in comm_graph else []
                
                for peer_id in reachable_peers:
                    peer_drone = self.drones[peer_id]
                    bid_val = self.auction_coordinator.submit_bid(
                        task_id=task_id,
                        drone_id=peer_id,
                        drone_cap=peer_drone.latest_capabilities,
                        drone_pos=(peer_drone.x, peer_drone.y),
                        task_loc=(auction["task"]["location"]["x"], auction["task"]["location"]["y"]),
                        battery_pct=peer_drone.telemetry_gen.battery_level,
                        health_status=peer_drone.operational_status,
                        diagnostic_confidence=peer_drone.latest_diagnosis.get("diagnostic_confidence", 0.98),
                        active_faults=list(peer_drone.telemetry_gen.injected_faults.keys())
                    )
                    if bid_val is not None:
                        self.recent_events.append({
                            "eventType": "BID_SUBMITTED",
                            "taskId": task_id,
                            "droneId": peer_id,
                            "bidScore": bid_val,
                            "healthStatus": peer_drone.operational_status,
                            "diagnosticConfidence": peer_drone.latest_diagnosis.get("diagnostic_confidence", 0.98),
                            "timestamp": round(self.sim_time, 1)
                        })

                # Resolve auction
                resolved_auction = self.auction_coordinator.resolve_auction(task_id, self.sim_time)
                if resolved_auction and resolved_auction["status"] == "RESOLVED":
                    winner_id = resolved_auction["winner_drone_id"]
                    winner_drone = self.drones[winner_id]
                    initiator_id = resolved_auction["initiating_drone_id"]
                    initiator_drone = self.drones.get(initiator_id)
                    winner_bid = resolved_auction["bids"][winner_id]

                    # 1. Update task assignment & lineage
                    for t in self.tasks:
                        if t["taskId"] == task_id:
                            t["assignedDrone"] = winner_id
                            t["previousDrone"] = initiator_id
                            t["acquiredFrom"] = initiator_id
                            t["handoverReason"] = f"Acquired from {initiator_id} due to {resolved_auction.get('initiator_fault')} (Diag Conf: {round(resolved_auction.get('initiator_confidence', 0.95)*100)}%)"
                            t["handoverTimestamp"] = round(self.sim_time, 1)
                            t["taskStatus"] = "IN_PROGRESS"
                            t["assignedBasedOnHealth"] = {
                                "healthStatus": winner_drone.operational_status,
                                "confidence": winner_bid.get("diagnostic_confidence", 0.98),
                                "winningBidScore": winner_bid["score"],
                                "reason": f"Highest healthy bid ({winner_bid['score']}) based on intact sensor payload"
                            }
                            if "handoverHistory" not in t:
                                t["handoverHistory"] = []
                            t["handoverHistory"].append({
                                "fromDrone": initiator_id,
                                "toDrone": winner_id,
                                "reason": t["handoverReason"],
                                "initiatorHealth": resolved_auction.get("initiator_health_status", "DEGRADED"),
                                "winnerHealth": winner_drone.operational_status,
                                "bidScore": winner_bid["score"],
                                "timestamp": round(self.sim_time, 1)
                            })
                            
                            if task_id not in winner_drone.assigned_tasks:
                                winner_drone.assigned_tasks.append(task_id)
                            winner_drone.set_target(t["location"]["x"], t["location"]["y"])
                            break

                    # 2. Failing drone receives alternative low-power Communication Relay task
                    if initiator_drone and initiator_drone.current_role == "Communication relay":
                        relay_task_id = f"TSK-RELAY-{initiator_id}"
                        existing_relay = next((t for t in self.tasks if t["taskId"] == relay_task_id), None)
                        if not existing_relay:
                            # Position relay drone at midpoint of swarm using NetworkX graph centroid
                            centroid_x = sum(d.x for d in self.drones.values()) / max(1, len(self.drones))
                            centroid_y = sum(d.y for d in self.drones.values()) / max(1, len(self.drones))
                            
                            new_relay_task = {
                                "taskId": relay_task_id,
                                "title": f"Dynamic Mesh Relay Link ({initiator_id})",
                                "taskType": "COMMUNICATION_RELAY",
                                "location": {"x": round(centroid_x, 1), "y": round(centroid_y, 1)},
                                "assignedDrone": initiator_id,
                                "previousDrone": None,
                                "acquiredFrom": None,
                                "handoverReason": f"Autonomously assigned alternative Relay role following {resolved_auction.get('initiator_fault')}",
                                "handoverConfidence": resolved_auction.get("initiator_confidence", 0.95),
                                "handoverTimestamp": round(self.sim_time, 1),
                                "taskStatus": "IN_PROGRESS",
                                "priority": 9,
                                "assignedBasedOnHealth": {
                                    "healthStatus": initiator_drone.operational_status,
                                    "confidence": resolved_auction.get("initiator_confidence", 0.95),
                                    "reason": "Radio intact; powers down cameras for eco-hover (draws only 0.10% battery/step)"
                                },
                                "handoverHistory": []
                            }
                            self.tasks.append(new_relay_task)
                            initiator_drone.assigned_tasks = [relay_task_id]
                            initiator_drone.set_target(centroid_x, centroid_y)

                    self.recent_events.append({
                        "eventType": "TASK_REASSIGNED",
                        "taskId": task_id,
                        "fromDrone": initiator_id,
                        "awardedTo": winner_id,
                        "winningScore": winner_bid["score"],
                        "timestamp": round(self.sim_time, 1)
                    })

        # Return full simulation state snapshot
        detailed_states = {d["drone_id"]: d for d in drone_states}
        
        return {
            "step": self.step_count,
            "sim_time": round(self.sim_time, 1),
            "is_running": self.is_running,
            "coverage_percent": self.env.get_coverage_percentage(),
            "victims_detected": len([v for v in self.env.victims if v["detected"]]),
            "total_victims": len(self.env.victims),
            "drones": [d.to_dict() for d in self.drones.values()],
            "environment": self.env.to_dict(),
            "topology": topology_snapshot,
            "tasks": self.tasks,
            "recent_events": self.recent_events[-15:],
            "detailed_drone_states": detailed_states
        }
