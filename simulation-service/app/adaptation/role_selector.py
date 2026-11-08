from typing import Dict, Any, List, Optional, Tuple

class SafetyConstrainedRoleSelector:
    """
    Stage 5: Safety-Constrained Adaptive Role Selector.
    Enforces STRICT hard constraints and battery safety margins.
    A weighted score NEVER compensates for a failed mandatory component.
    """
    ROLES = [
        "Search and exploration",
        "Victim detection",
        "Mapping and reconnaissance",
        "Communication relay",
        "Return to Home / Land"
    ]

    def __init__(self, drone_id: str):
        self.drone_id = drone_id

    def evaluate_role_feasibility(self, cap: Dict[str, float], battery_pct: float) -> Dict[str, bool]:
        """
        Evaluates hard physical constraints for each role independently.
        Returns a dictionary of role -> is_feasible.
        """
        feasibility = {}

        # Battery emergency check
        if battery_pct < 18.0 or cap["c_Energy"] < 0.18 or cap["c_Mobility"] < 0.25:
            # All active operational roles are strictly barred
            return {
                "Search and exploration": False,
                "Victim detection": False,
                "Mapping and reconnaissance": False,
                "Communication relay": False,
                "Return to Home / Land": True
            }

        # 1. Search and exploration
        # Needs decent mobility, localization, compute, and visual sensing (RGB or Thermal)
        search_sensor_ok = (cap["c_RGB"] >= 0.45) or (cap["c_Thermal"] >= 0.55)
        feasibility["Search and exploration"] = bool(
            search_sensor_ok and
            cap["c_Mobility"] >= 0.45 and
            cap["c_Localization"] >= 0.40 and
            cap["c_Energy"] >= 0.22 and
            cap["c_Compute"] >= 0.30
        )

        # 2. Victim detection
        # Mandatory: Thermal capability (vital for locating survivors trapped under rubble/smoke)
        # or exceptionally high RGB clarity if smoke is absent
        victim_sensor_ok = (cap["c_Thermal"] >= 0.50) or (cap["c_RGB"] >= 0.65)
        feasibility["Victim detection"] = bool(
            victim_sensor_ok and
            cap["c_Mobility"] >= 0.35 and
            cap["c_Localization"] >= 0.40 and
            cap["c_Energy"] >= 0.20
        )

        # 3. Mapping and reconnaissance
        # Mandatory: High localization precision and LiDAR or high-res camera
        mapping_sensor_ok = (cap["c_LiDAR"] >= 0.48) or (cap["c_RGB"] >= 0.60)
        feasibility["Mapping and reconnaissance"] = bool(
            mapping_sensor_ok and
            cap["c_Localization"] >= 0.50 and
            cap["c_Mobility"] >= 0.40 and
            cap["c_Energy"] >= 0.22
        )

        # 4. Communication relay
        # Dedicated to high-throughput wireless bridging; requires strong radio link
        feasibility["Communication relay"] = bool(
            cap["c_Communication"] >= 0.55 and
            cap["c_Mobility"] >= 0.25 and # Hovering or low-speed loitering acceptable
            cap["c_Localization"] >= 0.25 and
            cap["c_Energy"] >= 0.18
        )

        # 5. RTL / Safe Land is always feasible as a safety fallback
        feasibility["Return to Home / Land"] = True

        return feasibility

    def select_best_role(self, current_role: str, cap: Dict[str, float], battery_pct: float, mission_needs: Optional[Dict[str, int]] = None) -> Tuple[str, List[str], str]:
        """
        Selects feasible role with highest operational utility or switches to safe fallback.
        Returns: (new_role, feasible_roles_list, reason_for_transition)
        """
        feasibility = self.evaluate_role_feasibility(cap, battery_pct)
        feasible_roles = [r for r, ok in feasibility.items() if ok and r != "Return to Home / Land"]

        # If current role is still feasible and has good health, preserve role stability
        if current_role in feasible_roles:
            return current_role, feasible_roles, "Current role constraints satisfied"

        # If no active mission roles are feasible, trigger RTL
        if not feasible_roles:
            return "Return to Home / Land", ["Return to Home / Land"], "Critical hardware or energy degradation: Local safety abort triggered"

        # Utility calculation for feasible candidate roles
        role_utilities = {}
        for r in feasible_roles:
            if r == "Search and exploration":
                u = 0.35 * cap["c_RGB"] + 0.30 * cap["c_Mobility"] + 0.20 * cap["c_Localization"] + 0.15 * cap["c_Energy"]
            elif r == "Victim detection":
                u = 0.50 * cap["c_Thermal"] + 0.25 * cap["c_Localization"] + 0.25 * cap["c_Energy"]
            elif r == "Mapping and reconnaissance":
                u = 0.45 * cap["c_LiDAR"] + 0.35 * cap["c_Localization"] + 0.20 * cap["c_Mobility"]
            elif r == "Communication relay":
                u = 0.60 * cap["c_Communication"] + 0.25 * cap["c_Energy"] + 0.15 * cap["c_Mobility"]
            else:
                u = 0.1
            role_utilities[r] = u

        best_role = max(role_utilities.items(), key=lambda x: x[1])[0]
        reason = f"Adapted from '{current_role}' to '{best_role}' due to capability constraints"
        return best_role, feasible_roles, reason
