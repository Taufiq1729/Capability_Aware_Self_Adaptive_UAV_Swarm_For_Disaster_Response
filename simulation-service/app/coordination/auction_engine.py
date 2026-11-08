import time
import math
from typing import Dict, Any, List, Optional, Tuple

class DistributedAuctionCoordinator:
    """
    Stage 7: Decentralized Task Reallocation via Local Auction / Distributed Bidding.
    Enforces atomic task ownership, eliminates duplicate assignments, and
    supports local safety fallback when network partitions occur.
    """
    def __init__(self):
        # Active auctions: task_id -> dict
        self.active_auctions: Dict[str, Dict[str, Any]] = {}
        # Completed reallocation events log
        self.reallocation_events: List[Dict[str, Any]] = []

    def start_auction(self, task: Dict[str, Any], initiating_drone_id: str, reason: str, sim_time: float) -> Dict[str, Any]:
        """
        Drone initiates a distributed auction for a task it can no longer perform.
        """
        task_id = task["taskId"]
        auction = {
            "taskId": task_id,
            "task": task,
            "initiating_drone_id": initiating_drone_id,
            "reason": reason,
            "bids": {}, # drone_id -> bid_score
            "started_at": sim_time,
            "status": "OPEN",
            "winner_drone_id": None
        }
        self.active_auctions[task_id] = auction
        return auction

    def submit_bid(self, task_id: str, drone_id: str, drone_cap: Dict[str, float], drone_pos: Tuple[float, float], task_loc: Tuple[float, float], battery_pct: float) -> Optional[float]:
        """
        Drone evaluates its own capability for the specific task and computes a bidding score.
        Score formula combines:
        - Required sensor capability for task
        - Euclidean proximity to task site
        - Remaining energy reserve
        """
        auction = self.active_auctions.get(task_id)
        if not auction or auction["status"] != "OPEN":
            return None

        task = auction["task"]
        task_type = task.get("taskType", "SEARCH")
        
        # Hard capability check: if drone lacks base requirement, bid is 0.0 (ineligible)
        if battery_pct < 22.0 or drone_cap["c_Mobility"] < 0.35:
            return None

        req_cap = 0.0
        if task_type == "SEARCH":
            req_cap = max(drone_cap["c_RGB"], drone_cap["c_Thermal"])
        elif task_type == "VICTIM_DETECTION":
            req_cap = drone_cap["c_Thermal"]
        elif task_type == "MAPPING":
            req_cap = max(drone_cap["c_LiDAR"], drone_cap["c_RGB"]) * drone_cap["c_Localization"]
        elif task_type == "COMMUNICATION_RELAY":
            req_cap = drone_cap["c_Communication"]
        else:
            req_cap = 0.5

        if req_cap < 0.40:
            return None # Cannot bid without sufficient capability

        # Distance penalty: closer drones bid higher
        dist = math.hypot(drone_pos[0] - task_loc[0], drone_pos[1] - task_loc[1])
        norm_dist_factor = max(0.1, 1.0 - (dist / 1000.0))
        
        # Energy factor
        energy_factor = battery_pct / 100.0

        # Composite bid score in [0.0, 1.0]
        bid_score = round(0.50 * req_cap + 0.30 * norm_dist_factor + 0.20 * energy_factor, 4)
        
        auction["bids"][drone_id] = {
            "score": bid_score,
            "drone_id": drone_id,
            "distance": round(dist, 1),
            "capability_val": round(req_cap, 3)
        }
        return bid_score

    def resolve_auction(self, task_id: str, sim_time: float) -> Optional[Dict[str, Any]]:
        """
        Closes auction and awards task to highest bidder.
        If no bids submitted (e.g. all nearby drones busy/partitioned), marks as UNRESOLVED.
        """
        auction = self.active_auctions.get(task_id)
        if not auction or auction["status"] != "OPEN":
            return None

        bids = auction["bids"]
        if not bids:
            auction["status"] = "UNRESOLVED"
            event = {
                "eventType": "TASK_UNRESOLVED",
                "taskId": task_id,
                "initiator": auction["initiating_drone_id"],
                "winner": None,
                "reason": "No eligible or reachable peers submitted valid bids",
                "timestamp": sim_time
            }
            self.reallocation_events.append(event)
            return auction

        # Select highest bid
        best_drone_id = max(bids.keys(), key=lambda d: bids[d]["score"])
        auction["winner_drone_id"] = best_drone_id
        auction["status"] = "RESOLVED"
        
        event = {
            "eventType": "TASK_REASSIGNED",
            "taskId": task_id,
            "initiator": auction["initiating_drone_id"],
            "winner": best_drone_id,
            "winningScore": bids[best_drone_id]["score"],
            "allBids": bids,
            "timestamp": sim_time,
            "reason": auction["reason"]
        }
        self.reallocation_events.append(event)
        return auction

    def get_recent_events(self, limit: int = 25) -> List[Dict[str, Any]]:
        return self.reallocation_events[-limit:]
