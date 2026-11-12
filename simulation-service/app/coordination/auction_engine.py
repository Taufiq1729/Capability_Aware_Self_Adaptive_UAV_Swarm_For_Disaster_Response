import time
import math
from typing import Dict, Any, List, Optional, Tuple

class DistributedAuctionCoordinator:
    """
    Stage 7: Decentralized Task Reallocation via Local Auction / Distributed Bidding.
    Enforces atomic task ownership, confidence- and health-aware bidding,
    eliminates duplicate assignments, and maintains full handover lineage.
    """
    def __init__(self):
        # Active auctions: task_id -> dict
        self.active_auctions: Dict[str, Dict[str, Any]] = {}
        # Completed reallocation events log
        self.reallocation_events: List[Dict[str, Any]] = []

    def start_auction(
        self,
        task: Dict[str, Any],
        initiating_drone_id: str,
        reason: str,
        sim_time: float,
        initiator_health_status: str = "DEGRADED",
        initiator_fault: str = "Hardware Degradation",
        initiator_confidence: float = 0.95
    ) -> Dict[str, Any]:
        """
        Drone initiates a distributed auction for a task it can no longer perform.
        """
        task_id = task["taskId"]
        auction = {
            "taskId": task_id,
            "task": task,
            "initiating_drone_id": initiating_drone_id,
            "initiator_health_status": initiator_health_status,
            "initiator_fault": initiator_fault,
            "initiator_confidence": round(initiator_confidence, 3),
            "reason": reason,
            "bids": {}, # drone_id -> bid_dict
            "started_at": sim_time,
            "status": "OPEN",
            "winner_drone_id": None
        }
        self.active_auctions[task_id] = auction
        return auction

    def submit_bid(
        self,
        task_id: str,
        drone_id: str,
        drone_cap: Dict[str, float],
        drone_pos: Tuple[float, float],
        task_loc: Tuple[float, float],
        battery_pct: float,
        health_status: str = "HEALTHY",
        diagnostic_confidence: float = 0.95,
        active_faults: Optional[List[str]] = None
    ) -> Optional[float]:
        """
        Drone evaluates its own capability, health status, and diagnostic confidence
        for the specific task and computes an autonomous bidding score.
        Score formula combines:
        - Required sensor capability for task (35%)
        - Diagnostic confidence in healthy operation (25%)
        - Overall operational health status multiplier (15%)
        - Euclidean proximity to task site (15%)
        - Remaining energy reserve (10%)
        """
        auction = self.active_auctions.get(task_id)
        if not auction or auction["status"] != "OPEN":
            return None

        # Drone cannot bid for its own relinquished task
        if drone_id == auction["initiating_drone_id"]:
            return None

        # Hard safety and mobility check
        if battery_pct < 20.0 or drone_cap.get("c_Mobility", 0.0) < 0.35:
            return None

        # Critical health status bars task bidding
        if health_status == "CRITICAL":
            return None

        task = auction["task"]
        task_type = task.get("taskType", "SEARCH")
        faults = active_faults or []
        
        # Hard capability constraints per task type
        req_cap = 0.0
        if task_type in ["SEARCH", "VISUAL_SEARCH"]:
            # Needs working RGB or Thermal camera
            if "rgb_camera" in faults and drone_cap.get("c_Thermal", 0.0) < 0.50:
                return None
            req_cap = max(drone_cap.get("c_RGB", 0.0), drone_cap.get("c_Thermal", 0.0))
        elif task_type == "VICTIM_DETECTION":
            if "thermal_camera" in faults:
                return None
            req_cap = drone_cap.get("c_Thermal", 0.0)
        elif task_type == "MAPPING":
            if "lidar" in faults and drone_cap.get("c_RGB", 0.0) < 0.60:
                return None
            req_cap = max(drone_cap.get("c_LiDAR", 0.0), drone_cap.get("c_RGB", 0.0)) * drone_cap.get("c_Localization", 0.0)
        elif task_type == "COMMUNICATION_RELAY":
            if "communication" in faults:
                return None
            req_cap = drone_cap.get("c_Communication", 0.0)
        else:
            req_cap = 0.50

        if req_cap < 0.45:
            return None # Cannot bid without adequate capability

        # Health status multiplier
        health_multiplier = 1.0 if health_status == "HEALTHY" else (0.65 if health_status == "DEGRADED" else 0.0)

        # Distance penalty: closer drones bid higher
        dist = math.hypot(drone_pos[0] - task_loc[0], drone_pos[1] - task_loc[1])
        norm_dist_factor = max(0.1, 1.0 - (dist / 1000.0))
        
        # Energy factor
        energy_factor = battery_pct / 100.0

        # Confidence weighting: high confidence in system health boosts trust
        confidence_factor = max(0.4, min(1.0, diagnostic_confidence))

        # Composite bid score in [0.0, 1.0]
        bid_score = round(
            0.35 * req_cap +
            0.25 * confidence_factor +
            0.15 * health_multiplier +
            0.15 * norm_dist_factor +
            0.10 * energy_factor,
            4
        )
        
        auction["bids"][drone_id] = {
            "score": bid_score,
            "drone_id": drone_id,
            "health_status": health_status,
            "diagnostic_confidence": round(diagnostic_confidence, 3),
            "distance": round(dist, 1),
            "capability_val": round(req_cap, 3),
            "battery_pct": round(battery_pct, 1)
        }
        return bid_score

    def resolve_auction(self, task_id: str, sim_time: float) -> Optional[Dict[str, Any]]:
        """
        Closes auction and awards task to highest bidder with full lineage tracking.
        If no bids submitted (e.g. all nearby drones partitioned), marks as UNRESOLVED.
        """
        auction = self.active_auctions.get(task_id)
        if not auction or auction["status"] != "OPEN":
            return None

        bids = auction["bids"]
        initiator_id = auction["initiating_drone_id"]

        if not bids:
            auction["status"] = "UNRESOLVED"
            event = {
                "eventType": "TASK_UNRESOLVED",
                "taskId": task_id,
                "initiator": initiator_id,
                "winner": None,
                "reason": "No eligible or reachable peers submitted valid bids",
                "timestamp": round(sim_time, 1)
            }
            self.reallocation_events.append(event)
            return auction

        # Select highest bid
        best_drone_id = max(bids.keys(), key=lambda d: bids[d]["score"])
        winning_bid = bids[best_drone_id]
        
        auction["winner_drone_id"] = best_drone_id
        auction["status"] = "RESOLVED"
        
        event = {
            "eventType": "TASK_REASSIGNED",
            "taskId": task_id,
            "initiator": initiator_id,
            "initiatorHealth": auction.get("initiator_health_status", "DEGRADED"),
            "initiatorFault": auction.get("initiator_fault", "Hardware Degradation"),
            "initiatorConfidence": auction.get("initiator_confidence", 0.95),
            "winner": best_drone_id,
            "winnerHealth": winning_bid.get("health_status", "HEALTHY"),
            "winnerConfidence": winning_bid.get("diagnostic_confidence", 0.98),
            "winningScore": winning_bid["score"],
            "allBids": bids,
            "timestamp": round(sim_time, 1),
            "reason": auction["reason"]
        }
        self.reallocation_events.append(event)
        return auction

    def get_recent_events(self, limit: int = 25) -> List[Dict[str, Any]]:
        return self.reallocation_events[-limit:]
