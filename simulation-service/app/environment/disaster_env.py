import random
import math
import numpy as np
from typing import List, Dict, Any, Optional

class DisasterEnvironment:
    def __init__(self, width: float = 800.0, height: float = 600.0, seed: Optional[int] = 42):
        self.width = width
        self.height = height
        self.seed = seed
        self.grid_cell_size = 20.0
        self.grid_cols = int(width / self.grid_cell_size)
        self.grid_rows = int(height / self.grid_cell_size)
        
        self.obstacles: List[Dict[str, Any]] = []
        self.smoke_zones: List[Dict[str, Any]] = []
        self.victims: List[Dict[str, Any]] = []
        self.coverage_grid = np.zeros((self.grid_rows, self.grid_cols), dtype=np.uint8)
        self.global_dust_level: float = 0.15
        
        self.reset(seed)

    def reset(self, seed: Optional[int] = None):
        if seed is not None:
            self.seed = seed
            random.seed(seed)
            np.random.seed(seed)
            
        self.coverage_grid = np.zeros((self.grid_rows, self.grid_cols), dtype=np.uint8)
        self.obstacles.clear()
        self.smoke_zones.clear()
        self.victims.clear()
        
        # Predefined realistic disaster structures (collapsed structures, rubble zones)
        self.obstacles = [
            {"id": "obs_1", "x": 120, "y": 140, "width": 100, "height": 80, "type": "collapsed_hospital"},
            {"id": "obs_2", "x": 420, "y": 120, "width": 140, "height": 90, "type": "rubble_commercial"},
            {"id": "obs_3", "x": 220, "y": 340, "width": 110, "height": 130, "type": "collapsed_bridge"},
            {"id": "obs_4", "x": 560, "y": 360, "width": 130, "height": 110, "type": "industrial_debris"},
            {"id": "obs_5", "x": 340, "y": 240, "width": 80, "height": 70, "type": "crater_obstruction"}
        ]
        
        # Smoke and fire hazard plumes
        self.smoke_zones = [
            {"id": "smoke_1", "x": 240, "y": 180, "radius": 110, "density": 0.85, "type": "chemical_fire_plume"},
            {"id": "smoke_2", "x": 580, "y": 400, "radius": 95, "density": 0.70, "type": "smoldering_rubble"},
            {"id": "smoke_3", "x": 380, "y": 460, "radius": 80, "density": 0.55, "type": "dust_plume"}
        ]
        
        # Victims trapped in rubble
        initial_victim_coords = [
            (160, 180, "Critical Trapped", 0.9),
            (480, 160, "Hypothermia Risk", 0.7),
            (260, 390, "Under Concrete Slab", 0.85),
            (620, 410, "Signals Distress", 0.95),
            (360, 270, "Cellular Ping", 0.6),
            (680, 200, "Surface Visible", 0.4),
            (150, 480, "Thermal Signature Only", 0.8),
            (440, 490, "Voice Acoustic Echo", 0.75),
        ]
        
        for i, (vx, vy, condition, urgency) in enumerate(initial_victim_coords):
            self.victims.append({
                "id": f"victim_{i+1}",
                "x": float(vx),
                "y": float(vy),
                "condition": condition,
                "urgency": urgency,
                "detected": False,
                "detected_by": None,
                "detected_at_step": None,
                "detection_modality": None
            })

    def get_smoke_density_at(self, x: float, y: float) -> float:
        """Returns smoke density at coordinate [0, 1]"""
        max_density = self.global_dust_level
        for sz in self.smoke_zones:
            dist = math.hypot(x - sz["x"], y - sz["y"])
            if dist < sz["radius"]:
                # Quadratic falloff
                factor = 1.0 - (dist / sz["radius"])
                density = sz["density"] * factor
                if density > max_density:
                    max_density = density
        return min(1.0, max_density)

    def mark_coverage(self, x: float, y: float, fov_radius: float = 65.0):
        """Mark scanned grid cells based on sensor FOV"""
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
        if total == 0:
            return 0.0
        scanned = int(np.sum(self.coverage_grid))
        return round((scanned / total) * 100.0, 2)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "width": self.width,
            "height": self.height,
            "obstacles": self.obstacles,
            "smoke_zones": self.smoke_zones,
            "victims": self.victims,
            "coverage_percent": self.get_coverage_percentage(),
            "global_dust_level": self.global_dust_level
        }
