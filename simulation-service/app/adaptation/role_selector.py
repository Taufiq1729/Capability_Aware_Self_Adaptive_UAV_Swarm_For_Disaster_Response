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
        A role is strictly barred if its mandatory primary subsystem is degraded or failed.
        """
        feasibility = {}

        # Battery emergency check or severe propulsion failure
        if battery_pct < 18.0 or cap.get("c_Energy", 1.0) < 0.18 or cap.get("c_Mobility", 1.0) < 0.22:
            return {
                "Search and exploration": False,
                "Victim detection": False,
                "Mapping and reconnaissance": False,
                "Communication relay": False,
                "Return to Home / Land": True
            }

        # 1. Search and exploration:
        # Mandatory: RGB optical camera pipeline (c_RGB >= 0.50) and active mobility
        search_sensor_ok = (cap.get("c_RGB", 0.0) >= 0.50)
        feasibility["Search and exploration"] = bool(
            search_sensor_ok and
            cap.get("c_Mobility", 0.0) >= 0.45 and
            cap.get("c_Localization", 0.0) >= 0.40 and
            cap.get("c_Energy", 0.0) >= 0.22 and
            battery_pct >= 22.0
        )

        # 2. Victim detection:
        # Mandatory: High-sensitivity Radiometric Thermal FLIR camera (c_Thermal >= 0.55)
        # Cannot be performed if thermal sensor is corrupted or drifting
        victim_sensor_ok = (cap.get("c_Thermal", 0.0) >= 0.55)
        feasibility["Victim detection"] = bool(
            victim_sensor_ok and
            cap.get("c_Mobility", 0.0) >= 0.35 and
            cap.get("c_Localization", 0.0) >= 0.40 and
            cap.get("c_Energy", 0.0) >= 0.20 and
            battery_pct >= 20.0
        )

        # 3. Mapping and reconnaissance:
        # Mandatory: Precision LiDAR rangefinder return (c_LiDAR >= 0.50) and centimeter GPS
        mapping_sensor_ok = (cap.get("c_LiDAR", 0.0) >= 0.50)
        feasibility["Mapping and reconnaissance"] = bool(
            mapping_sensor_ok and
            cap.get("c_Localization", 0.0) >= 0.50 and
            cap.get("c_Mobility", 0.0) >= 0.40 and
            cap.get("c_Energy", 0.0) >= 0.22 and
            battery_pct >= 22.0
        )

        # 4. Communication relay:
        # Dedicated to high-throughput wireless bridging; requires strong radio link
        # Can loiter/hover in place, so mobility constraint is minimal
        relay_radio_ok = (cap.get("c_Communication", 0.0) >= 0.55)
        feasibility["Communication relay"] = bool(
            relay_radio_ok and
            cap.get("c_Mobility", 0.0) >= 0.20 and
            cap.get("c_Energy", 0.0) >= 0.18 and
            battery_pct >= 18.0
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

        # Battery emergency check (< 18%)
        if battery_pct < 18.0 or cap.get("c_Energy", 1.0) < 0.18:
            return (
                "Return to Home / Land",
                ["Return to Home / Land"],
                f"Low battery emergency ({battery_pct:.1f}% < 18%): Local safety abort triggered (Return to Home)"
            )

        # If no active mission roles are feasible, trigger RTL
        if not feasible_roles:
            return (
                "Return to Home / Land",
                ["Return to Home / Land"],
                "Critical hardware degradation: All operational roles barred. Local safety abort triggered."
            )

        # Verify whether the primary capability for the current role is still healthy
        current_role_viable = (current_role in feasible_roles)
        if current_role == "Search and exploration" and cap.get("c_RGB", 0.0) < 0.50:
            current_role_viable = False
        elif current_role == "Victim detection" and cap.get("c_Thermal", 0.0) < 0.55:
            current_role_viable = False
        elif current_role == "Mapping and reconnaissance" and cap.get("c_LiDAR", 0.0) < 0.50:
            current_role_viable = False
        elif current_role == "Communication relay" and cap.get("c_Communication", 0.0) < 0.55:
            current_role_viable = False

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

        # Best role by capability utility
        best_role = max(role_utilities.items(), key=lambda x: x[1])[0]

        # If current role is viable and not significantly outclassed, preserve role stability
        if current_role_viable:
            current_util = role_utilities.get(current_role, 0.0)
            best_util = role_utilities[best_role]
            if best_util - current_util <= 0.15:
                return current_role, feasible_roles, "Current role constraints satisfied and operational"

        reason = f"Health-driven adaptation: Role switched from '{current_role}' to '{best_role}' based on remaining capability utility (Diag Conf: {round(diagnostic_confidence * 100)}%)"
        return best_role, feasible_roles, reason
