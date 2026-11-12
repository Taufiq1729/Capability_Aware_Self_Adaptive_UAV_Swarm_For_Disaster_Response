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
        # Mandatory: High-framerate RGB optical camera pipeline
        search_sensor_ok = (cap.get("c_RGB", 0.0) >= 0.45)
        feasibility["Search and exploration"] = bool(
            search_sensor_ok and
            cap.get("c_Mobility", 0.0) >= 0.45 and
            cap.get("c_Localization", 0.0) >= 0.40 and
            cap.get("c_Energy", 0.0) >= 0.22 and
            cap.get("c_Compute", 0.0) >= 0.30
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

    def select_best_role(
        self,
        current_role: str,
        cap: Dict[str, float],
        battery_pct: float,
        mission_needs: Optional[Dict[str, int]] = None,
        diagnostic_confidence: float = 0.95
    ) -> Tuple[str, List[str], str]:
        """
        Stage 5: Autonomous Safety-Constrained Role Selection.
        Selects feasible role with highest operational utility or switches to safe fallback.
        - If diagnostic confidence is insufficient (<0.60), triggers conservative safety fallback.
        - If current role violates hard sensor/actuator constraints, dynamically selects the best
          viable operational role using remaining capabilities.
        Returns: (new_role, feasible_roles_list, reason_for_transition)
        """
        # Safety fallback branch: Insufficient diagnostic confidence
        if diagnostic_confidence < 0.60:
            return (
                "Return to Home / Land",
                ["Return to Home / Land"],
                f"Safety fallback: Insufficient diagnostic confidence ({round(diagnostic_confidence * 100)}% < 60%). Halting autonomous operations."
            )

        feasibility = self.evaluate_role_feasibility(cap, battery_pct)
        feasible_roles = [r for r, ok in feasibility.items() if ok and r != "Return to Home / Land"]

        # If current role is still feasible and has good health, preserve role stability
        if current_role in feasible_roles:
            return current_role, feasible_roles, "Current role constraints satisfied"

        # If no active mission roles are feasible, trigger RTL
        if not feasible_roles:
            return (
                "Return to Home / Land",
                ["Return to Home / Land"],
                "Critical hardware or energy degradation: Local safety abort triggered"
            )

        # Autonomous utility calculation for feasible candidate roles
        # Weighted operational utility matching surviving onboard sensors
        role_utilities = {}
        for r in feasible_roles:
            if r == "Search and exploration":
                u = 0.40 * cap.get("c_RGB", 0.0) + 0.25 * cap.get("c_Mobility", 0.0) + 0.20 * cap.get("c_Localization", 0.0) + 0.15 * cap.get("c_Energy", 0.0)
            elif r == "Victim detection":
                u = 0.50 * cap.get("c_Thermal", 0.0) + 0.25 * cap.get("c_Localization", 0.0) + 0.25 * cap.get("c_Energy", 0.0)
            elif r == "Mapping and reconnaissance":
                # High-fidelity 3D reconstruction fuses LiDAR with optical RGB texturing
                u = 0.40 * cap.get("c_LiDAR", 0.0) + 0.20 * cap.get("c_RGB", 0.0) + 0.25 * cap.get("c_Localization", 0.0) + 0.15 * cap.get("c_Mobility", 0.0)
            elif r == "Communication relay":
                u = 0.60 * cap.get("c_Communication", 0.0) + 0.25 * cap.get("c_Energy", 0.0) + 0.15 * cap.get("c_Mobility", 0.0)
            else:
                u = 0.10
            role_utilities[r] = round(u, 4)

        best_role = max(role_utilities.items(), key=lambda x: x[1])[0]
        reason = f"Autonomously adapted from '{current_role}' to '{best_role}' based on remaining capability utility (Diagnostic Confidence: {round(diagnostic_confidence * 100)}%)"
        return best_role, feasible_roles, reason
