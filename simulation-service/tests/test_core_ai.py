import unittest
import numpy as np

from app.telemetry.generator import TelemetryGenerator
from app.edge_ai.anomaly_detector import EdgeAnomalyDetector
from app.edge_ai.fault_diagnoser import EdgeFaultDiagnoser
from app.edge_ai.capability_estimator import CapabilityEstimator
from app.adaptation.role_selector import SafetyConstrainedRoleSelector
from app.communication.p2p_mesh import P2PCommunicationMesh
from app.coordination.auction_engine import DistributedAuctionCoordinator

class TestCoreAIArchitecture(unittest.TestCase):
    def setUp(self):
        self.drone_id = "UAV-TEST-01"
        self.telemetry_gen = TelemetryGenerator(self.drone_id)
        self.anomaly_detector = EdgeAnomalyDetector(self.drone_id)
        self.fault_diagnoser = EdgeFaultDiagnoser(self.drone_id)
        self.capability_estimator = CapabilityEstimator(self.drone_id)
        self.role_selector = SafetyConstrainedRoleSelector(self.drone_id)

    def test_stage_1_and_2_nominal_behavior(self):
        """Verify normal telemetry yields low anomaly score"""
        t = self.telemetry_gen.step(local_smoke_density=0.0)
        res = self.anomaly_detector.process(t)
        self.assertLess(res["anomaly_score"], 0.55)
        self.assertFalse(res["is_anomalous"])

    def test_stage_2_anomaly_detection_on_motor_failure(self):
        """Verify high anomaly score upon motor degradation"""
        self.telemetry_gen.inject_fault("motor", "bearing_seizure", severity=0.90)
        t = self.telemetry_gen.step()
        res = self.anomaly_detector.process(t)
        self.assertGreaterEqual(res["anomaly_score"], 0.60)
        self.assertTrue(res["is_anomalous"])
        self.assertTrue(res["trigger_deep_assessment"])

    def test_stage_3_optical_vs_environmental_smoke_disambiguation(self):
        """Environmental smoke must NOT be classified as hardware camera fault"""
        # Scenario A: Dense smoke, hardware intact
        t_smoke = self.telemetry_gen.step(local_smoke_density=0.85)
        anom = self.anomaly_detector.process(t_smoke)
        diag = self.fault_diagnoser.assess_fault(t_smoke, anom)
        if diag["primary_fault"]["component"] == "rgb_camera":
            self.assertEqual(diag["primary_fault"]["category"], "ENVIRONMENTAL_SMOKE_OCCLUSION")

        # Scenario B: Hardware sensor broken (0 FPS), no smoke
        self.telemetry_gen.inject_fault("rgb_camera", "hardware_failure", severity=1.0)
        t_broken = self.telemetry_gen.step(local_smoke_density=0.0)
        anom_broken = self.anomaly_detector.process(t_broken)
        diag_broken = self.fault_diagnoser.assess_fault(t_broken, anom_broken)
        self.assertEqual(diag_broken["primary_fault"]["category"], "OPTICAL_HARDWARE_FAILURE")
        self.assertGreaterEqual(diag_broken["diagnostic_confidence"], 0.85)

    def test_stage_4_capability_confidence_separation(self):
        """High confidence must NOT imply high capability"""
        self.telemetry_gen.inject_fault("rgb_camera", "hardware_failure", severity=1.0)
        t = self.telemetry_gen.step()
        anom = self.anomaly_detector.process(t)
        diag = self.fault_diagnoser.assess_fault(t, anom)
        cap_res = self.capability_estimator.estimate(t, diag)
        
        # c_RGB must be 0.0, but confidence in diagnosis is high (~0.90+)
        self.assertEqual(cap_res["capability_vector"]["c_RGB"], 0.0)
        self.assertGreaterEqual(cap_res["diagnostic_confidence"], 0.85)

    def test_stage_5_non_compensable_hard_constraints(self):
        """A failed mandatory component must bar the role, regardless of other scores"""
        cap = {
            "c_RGB": 0.0, # Camera dead
            "c_Thermal": 0.0, # Thermal dead
            "c_LiDAR": 1.0,
            "c_Communication": 1.0,
            "c_Mobility": 1.0,
            "c_Localization": 1.0,
            "c_Energy": 1.0,
            "c_Compute": 1.0
        }
        feasibility = self.role_selector.evaluate_role_feasibility(cap, battery_pct=100.0)
        # Search & Victim detection are barred because optical sensors are 0
        self.assertFalse(feasibility["Search and exploration"])
        self.assertFalse(feasibility["Victim detection"])
        # Mapping or relay is allowed
        self.assertTrue(feasibility["Mapping and reconnaissance"])

    def test_stage_5_battery_emergency_safety_abort(self):
        """Battery < 18% must mandate Return to Home / Land"""
        cap = {
            "c_RGB": 1.0, "c_Thermal": 1.0, "c_LiDAR": 1.0, "c_Communication": 1.0,
            "c_Mobility": 1.0, "c_Localization": 1.0, "c_Energy": 0.12, "c_Compute": 1.0
        }
        new_role, feasible, reason = self.role_selector.select_best_role(
            "Search and exploration", cap, battery_pct=12.0
        )
        self.assertEqual(new_role, "Return to Home / Land")
        self.assertIn("Local safety abort", reason)

    def test_stage_6_p2p_mesh_networkx(self):
        """Verify spatial connectivity and partition detection"""
        mesh = P2PCommunicationMesh(comm_range=200.0)
        # Two drones close, one drone far away
        positions = {
            "UAV-1": (100.0, 100.0),
            "UAV-2": (150.0, 120.0), # dist ~ 53m (connected)
            "UAV-3": (700.0, 500.0)  # dist ~ 720m (isolated)
        }
        comm_health = {"UAV-1": 1.0, "UAV-2": 1.0, "UAV-3": 1.0}
        g = mesh.update_topology(positions, comm_health)
        self.assertTrue(g.has_edge("UAV-1", "UAV-2"))
        self.assertFalse(g.has_edge("UAV-1", "UAV-3"))
        snap = mesh.get_topology_snapshot()
        self.assertTrue(snap["is_partitioned"])

    def test_stage_7_distributed_auction_task_reallocation(self):
        """Verify decentralized auction bidding awards task to best capable peer"""
        auction = DistributedAuctionCoordinator()
        task = {
            "taskId": "TSK-TEST",
            "taskType": "SEARCH",
            "location": {"x": 200.0, "y": 200.0}
        }
        auction.start_auction(task, initiating_drone_id="UAV-Alpha", reason="Camera failure", sim_time=10.0)
        
        # Peer B has high capability and is close
        bid_b = auction.submit_bid(
            task_id="TSK-TEST",
            drone_id="UAV-Beta",
            drone_cap={"c_RGB": 0.95, "c_Thermal": 0.9, "c_Mobility": 0.9, "c_Communication": 0.9},
            drone_pos=(210.0, 210.0),
            task_loc=(200.0, 200.0),
            battery_pct=90.0
        )
        
        # Peer C has low battery and is far away
        bid_c = auction.submit_bid(
            task_id="TSK-TEST",
            drone_id="UAV-Gamma",
            drone_cap={"c_RGB": 0.5, "c_Thermal": 0.4, "c_Mobility": 0.6, "c_Communication": 0.8},
            drone_pos=(600.0, 500.0),
            task_loc=(200.0, 200.0),
            battery_pct=30.0
        )
        
        self.assertIsNotNone(bid_b)
        self.assertIsNotNone(bid_c)
        self.assertGreater(bid_b, bid_c)
        
        resolved = auction.resolve_auction("TSK-TEST", sim_time=12.0)
        self.assertEqual(resolved["winner_drone_id"], "UAV-Beta")

if __name__ == "__main__":
    unittest.main()
