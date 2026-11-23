import random
import math
import numpy as np
from typing import List, Dict, Any, Optional

class DisasterEnvironment:
    """
    Multistorey Disaster Architectural Environment.
    Supports 3 building complexity configurations:
    - LOW: 2-Storey Outpost (Single Wing, 4 Key Rooms, Minor Rubble)
    - MEDIUM: 3-Storey Hospital Complex (Corridors, Stairwells, 8 Rooms, Moderate Collapse)
    - HIGH: 5-Storey Disaster Complex (Multi-wing, Collapsed Atrium, Elevator Shafts, 14 Rooms, Dense Smoke)
    """
    def __init__(self, width: float = 800.0, height: float = 600.0, complexity: str = "MEDIUM", seed: Optional[int] = 42):
        self.width = width
        self.height = height
        self.complexity = complexity.upper()
        self.seed = seed
        self.grid_cell_size = 20.0
        self.grid_cols = int(width / self.grid_cell_size)
        self.grid_rows = int(height / self.grid_cell_size)
        
        self.building_name = "St. Jude Metropolitan Medical Center (Disaster Sector 7)"
        self.num_floors = 3
        self.floors: List[Dict[str, Any]] = []
        self.structural_walls: List[Dict[str, Any]] = []
        self.rooms: List[Dict[str, Any]] = []
        self.obstacles: List[Dict[str, Any]] = []
        self.smoke_zones: List[Dict[str, Any]] = []
        self.victims: List[Dict[str, Any]] = []
        self.coverage_grid = np.zeros((self.grid_rows, self.grid_cols), dtype=np.uint8)
        self.global_dust_level: float = 0.15
        
        self.reset(seed, complexity)

    def reset(self, seed: Optional[int] = None, complexity: Optional[str] = None):
        if seed is not None:
            self.seed = seed
            random.seed(seed)
            np.random.seed(seed)
        if complexity is not None:
            self.complexity = complexity.upper()
            
        self.coverage_grid = np.zeros((self.grid_rows, self.grid_cols), dtype=np.uint8)
        self.floors.clear()
        self.structural_walls.clear()
        self.rooms.clear()
        self.obstacles.clear()
        self.smoke_zones.clear()
        self.victims.clear()
        
        # Configure based on Building Complexity
        if self.complexity == "LOW": # 2-Storey Residential Disaster House
            self.building_name = "Two-Storey Residential House (Earthquake Collapse & Debris)"
            self.num_floors = 2
            self.floors = [
                {"level": 1, "name": "Ground Floor (Living, Kitchen, Dining & Garage)", "elevation_z": 4.5, "color": "#06B6D4"},
                {"level": 2, "name": "Second Floor (Bedrooms, Bath & Roof Fracture)", "elevation_z": 13.5, "color": "#10B981"}
            ]
            self.rooms = [
                {"id": "H101", "name": "Living Room (Collapsed Ceiling & Sofa)", "floor": 1, "x": 90, "y": 70, "w": 200, "h": 150, "type": "LIVING_ROOM"},
                {"id": "H102", "name": "Kitchen & Dining (Fallen Cabinets)", "floor": 1, "x": 310, "y": 70, "w": 180, "h": 150, "type": "KITCHEN"},
                {"id": "H103", "name": "Garage & Workshop (Collapsed Rafters)", "floor": 1, "x": 510, "y": 70, "w": 190, "h": 150, "type": "GARAGE"},
                {"id": "H104", "name": "Central Hallway & Main Foyer", "floor": 1, "x": 90, "y": 240, "w": 200, "h": 150, "type": "HALLWAY"},
                {"id": "H201", "name": "Master Bedroom (Crushed Bed)", "floor": 2, "x": 310, "y": 240, "w": 190, "h": 150, "type": "MASTER_BEDROOM"},
                {"id": "H202", "name": "Kids Bedroom & Study (Drywall Rubble)", "floor": 2, "x": 520, "y": 240, "w": 180, "h": 150, "type": "BEDROOM"},
                {"id": "H203", "name": "Attic Loft & Broken Roof Opening", "floor": 2, "x": 200, "y": 410, "w": 400, "h": 150, "type": "ROOF_OPENING"}
            ]
            self.smoke_zones = [
                {"id": "smoke_1", "x": 190, "y": 140, "radius": 85, "density": 0.80, "type": "living_room_rubble_smoke"},
                {"id": "smoke_2", "x": 580, "y": 150, "radius": 75, "density": 0.65, "type": "garage_chemical_fumes"},
                {"id": "smoke_3", "x": 400, "y": 320, "radius": 75, "density": 0.60, "type": "bedroom_drywall_dust"}
            ]
            raw_victims = [
                (170, 130, 1, "H101", "Resident trapped under collapsed living room beam and sofa", "supine_pinned", 37.1, 84, 0.95),
                (380, 130, 1, "H102", "Resident pinned near dining table and debris", "sitting_distress", 37.0, 79, 0.85),
                (590, 130, 1, "H103", "Resident trapped under fallen garage roof rafters", "supine_pinned", 36.8, 86, 0.92),
                (400, 310, 2, "H201", "Resident trapped in master bedroom rubble pile", "supine_pinned", 37.4, 94, 0.96),
                (600, 310, 2, "H202", "Child survivor signaling distress with light", "standing_signaling", 36.9, 76, 0.85),
                (390, 480, 2, "H203", "Resident near roof fracture signaling for evacuation", "sitting_distress", 36.5, 72, 0.78)
            ]

        elif self.complexity == "HIGH": # 5-Storey Metropolitan Disaster Complex
            self.building_name = "Five-Storey Metropolitan Disaster Complex (Multi-Level Structural Collapse)"
            self.num_floors = 5
            self.floors = [
                {"level": 1, "name": "Level 1: Basement Storage, Generator & Cellar", "elevation_z": 4.0, "color": "#06B6D4"},
                {"level": 2, "name": "Level 2: Ground Grand Atrium & Main Lobby", "elevation_z": 13.5, "color": "#10B981"},
                {"level": 3, "name": "Level 3: Surgical ICU & Medical Suites", "elevation_z": 23.0, "color": "#F59E0B"},
                {"level": 4, "name": "Level 4: Server Vaults & Corporate Offices", "elevation_z": 32.5, "color": "#8B5CF6"},
                {"level": 5, "name": "Level 5: Broken Rooftop Helipad & Sky Deck", "elevation_z": 42.0, "color": "#EC4899"}
            ]
            self.rooms = [
                {"id": "H101", "name": "Basement Cellar & Foundation", "floor": 1, "x": 70, "y": 60, "w": 180, "h": 130, "type": "BASEMENT"},
                {"id": "H102", "name": "Furnace & Emergency Generator Room", "floor": 1, "x": 270, "y": 60, "w": 150, "h": 130, "type": "POWER"},
                {"id": "H103", "name": "Sub-Level Utility Storage", "floor": 1, "x": 440, "y": 60, "w": 260, "h": 130, "type": "STORAGE"},
                {"id": "H201", "name": "Grand Atrium (Structural Collapse)", "floor": 2, "x": 70, "y": 210, "w": 350, "h": 160, "type": "ATRIUM"},
                {"id": "H202", "name": "Reception Lobby & Security Desk", "floor": 2, "x": 570, "y": 60, "w": 160, "h": 150, "type": "RECEPTION"},
                {"id": "H301", "name": "Surgical ICU Trauma Wing", "floor": 3, "x": 70, "y": 390, "w": 220, "h": 160, "type": "ICU"},
                {"id": "H302", "name": "Inpatient Medical Wards", "floor": 3, "x": 310, "y": 390, "w": 180, "h": 160, "type": "WARD"},
                {"id": "H401", "name": "Server Vault & Corporate Offices", "floor": 4, "x": 510, "y": 230, "w": 220, "h": 160, "type": "SERVER_ROOM"},
                {"id": "H501", "name": "Rooftop Helipad & Sky Deck", "floor": 5, "x": 510, "y": 410, "w": 220, "h": 140, "type": "HELIPAD"}
            ]
            self.smoke_zones = [
                {"id": "smoke_1", "x": 220, "y": 140, "radius": 95, "density": 0.85, "type": "basement_smoldering_fire"},
                {"id": "smoke_2", "x": 240, "y": 280, "radius": 110, "density": 0.75, "type": "atrium_plaster_smoke"},
                {"id": "smoke_3", "x": 580, "y": 300, "radius": 85, "density": 0.65, "type": "roof_smoldering_vent"}
            ]
            raw_victims = [
                (140, 110, 1, "H101", "Basement technician pinned under concrete slab", "supine_pinned", 37.1, 88, 0.95),
                (320, 110, 1, "H102", "Generator operator trapped near electrical debris", "sitting_distress", 37.5, 96, 0.90),
                (470, 140, 1, "H103", "Storage worker pinned behind fallen metal shelving", "sitting_distress", 36.9, 82, 0.90),
                (180, 260, 2, "H201", "Civilian trapped in collapsed atrium rubble", "supine_pinned", 36.8, 80, 0.95),
                (340, 310, 2, "H201", "Injured survivor waving for assistance", "standing_signaling", 37.0, 85, 0.85),
                (630, 120, 2, "H202", "Visitor trapped behind security reception debris", "sitting_distress", 36.9, 76, 0.80),
                (160, 460, 3, "H301", "ICU patient pinned in bed debris", "supine_pinned", 37.3, 94, 0.98),
                (390, 460, 3, "H302", "Nurse trapped behind jammed blast door", "sitting_distress", 37.0, 78, 0.85),
                (600, 310, 4, "H401", "IT engineer pinned under server rack", "supine_pinned", 37.2, 86, 0.92),
                (620, 470, 5, "H501", "Rooftop observer signaling distress for heli-rescue", "standing_signaling", 36.6, 70, 0.75)
            ]

        else: # MEDIUM (Default 3-Storey Commercial Annex & Medical Clinic)
            self.building_name = "Three-Storey Commercial Annex & Clinic (Structural Failure & Debris)"
            self.num_floors = 3
            self.floors = [
                {"level": 1, "name": "Level 1: Ground Emergency Triage & Reception", "elevation_z": 4.5, "color": "#06B6D4"},
                {"level": 2, "name": "Level 2: Patient Ward & ICU Clinical Unit", "elevation_z": 14.0, "color": "#10B981"},
                {"level": 3, "name": "Level 3: Pathology Labs & Observation Roof Deck", "elevation_z": 23.5, "color": "#F59E0B"}
            ]
            self.rooms = [
                {"id": "M101", "name": "Emergency Triage Bay", "floor": 1, "x": 90, "y": 70, "w": 200, "h": 150, "type": "TRIAGE"},
                {"id": "M102", "name": "Main Clinic Reception & Lobby", "floor": 1, "x": 310, "y": 70, "w": 180, "h": 150, "type": "RECEPTION"},
                {"id": "M103", "name": "Pharmacy & Medical Supplies", "floor": 1, "x": 510, "y": 70, "w": 190, "h": 150, "type": "PHARMACY"},
                {"id": "M104", "name": "Central Stairwell & Elevator Shaft", "floor": 1, "x": 90, "y": 240, "w": 200, "h": 150, "type": "STAIRS"},
                {"id": "M201", "name": "Inpatient Ward A (Collapsed Partitions)", "floor": 2, "x": 310, "y": 240, "w": 190, "h": 150, "type": "WARD"},
                {"id": "M202", "name": "ICU Trauma Bay (Crushed Monitors)", "floor": 2, "x": 520, "y": 240, "w": 180, "h": 150, "type": "ICU"},
                {"id": "M203", "name": "Doctors Consultation Station", "floor": 2, "x": 90, "y": 410, "w": 200, "h": 150, "type": "CONSULTATION"},
                {"id": "M301", "name": "Pathology & Diagnostics Lab", "floor": 3, "x": 310, "y": 410, "w": 190, "h": 150, "type": "LABORATORY"},
                {"id": "M302", "name": "Observation Roof Deck & Skylight", "floor": 3, "x": 520, "y": 410, "w": 180, "h": 150, "type": "ROOF_DECK"}
            ]
            self.smoke_zones = [
                {"id": "smoke_1", "x": 190, "y": 140, "radius": 85, "density": 0.80, "type": "triage_dust_cloud"},
                {"id": "smoke_2", "x": 580, "y": 150, "radius": 75, "density": 0.65, "type": "pharmacy_chemical_smolder"},
                {"id": "smoke_3", "x": 400, "y": 320, "radius": 75, "density": 0.60, "type": "ward_drywall_dust"}
            ]
            raw_victims = [
                (170, 130, 1, "M101", "Triage patient pinned beneath collapsed exam table", "supine_pinned", 37.1, 84, 0.95),
                (380, 130, 1, "M102", "Receptionist trapped behind fallen reception counter", "sitting_distress", 36.9, 79, 0.85),
                (590, 130, 1, "M103", "Pharmacist pinned behind overturned medicine racks", "supine_pinned", 36.8, 86, 0.90),
                (400, 310, 2, "M201", "Inpatient pinned in bed frame amidst drywall collapse", "supine_pinned", 37.4, 94, 0.96),
                (600, 310, 2, "M202", "Trauma survivor signaling distress with flashlight", "standing_signaling", 37.0, 78, 0.85),
                (390, 480, 3, "M301", "Lab technician trapped beneath laboratory bench", "sitting_distress", 37.2, 88, 0.92),
                (600, 480, 3, "M302", "Rooftop observer signaling for evacuation", "standing_signaling", 36.5, 72, 0.78)
            ]

        # Convert raw victims to rich human casualty records
        for i, (vx, vy, floor, room_id, condition, posture, temp_c, hr_bpm, urgency) in enumerate(raw_victims):
            self.victims.append({
                "id": f"victim_{i+1}",
                "name": f"Human Casualty #{i+1:02d}",
                "x": float(vx),
                "y": float(vy),
                "z": float(floor * 9.0),
                "floor": int(floor),
                "room": room_id,
                "condition": condition,
                "body_posture": posture,  # 'supine_pinned', 'sitting_distress', 'standing_signaling'
                "vital_temp_c": float(temp_c),
                "pulse_bpm": int(hr_bpm),
                "urgency": float(urgency),
                "detected": False,
                "detected_by": None,
                "detected_at_step": None,
                "detection_modality": None
            })

        # Add architectural obstacle colliders corresponding to concrete pillars/walls
        for room in self.rooms:
            # Rubble inside room
            self.obstacles.append({
                "id": f"rubble_{room['id']}",
                "name": f"Debris: {room['name']}",
                "x": room["x"] + 15,
                "y": room["y"] + room["h"] - 35,
                "width": 55,
                "height": 25,
                "floor": room["floor"],
                "type": "collapsed_concrete_slab"
            })

    def get_smoke_density_at(self, x: float, y: float) -> float:
        """Returns smoke density at coordinate [0.0 - 1.0]"""
        max_density = self.global_dust_level
        for sz in self.smoke_zones:
            dist = math.hypot(x - sz["x"], y - sz["y"])
            if dist < sz["radius"]:
                factor = 1.0 - (dist / sz["radius"])
                density = sz["density"] * factor
                if density > max_density:
                    max_density = density
        return min(1.0, max_density)

    def mark_coverage(self, x: float, y: float, fov_radius: float = 65.0):
        min_c = max(0, int((x - fov_radius) / self.grid_cell_size))
        max_c = min(self.grid_cols - 1, int((x + fov_radius) / self.grid_cell_size))
        min_r = max(0, int((y - fov_radius) / self.grid_cell_size))
        max_r = min(self.grid_rows - 1, int((y + fov_radius) / self.grid_cell_size))
        
        for r in range(min_r, max_r + 1):
            for c in range(min_c, max_c + 1):
                cell_cx = (c + 0.5) * self.grid_cell_size
                cell_cy = (r + 0.5) * self.grid_cell_size
                if math.hypot(x - cell_cx, y - cell_cy) <= fov_radius:
                    self.coverage_grid[r, c] = 1

    def get_coverage_percentage(self) -> float:
        total = self.grid_rows * self.grid_cols
        covered = int(np.sum(self.coverage_grid))
        return round((covered / total) * 100.0, 1)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "building_name": self.building_name,
            "complexity": self.complexity,
            "num_floors": self.num_floors,
            "floors": self.floors,
            "rooms": self.rooms,
            "obstacles": self.obstacles,
            "smoke_zones": self.smoke_zones,
            "victims": self.victims,
            "global_dust_level": self.global_dust_level,
            "total_victims": len(self.victims),
            "victims_detected": len([v for v in self.victims if v["detected"]])
        }
