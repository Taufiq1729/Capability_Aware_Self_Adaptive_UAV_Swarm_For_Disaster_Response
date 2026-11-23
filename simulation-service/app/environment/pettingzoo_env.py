import functools
import numpy as np
import gymnasium
from gymnasium.spaces import Box, Discrete, Dict as SpaceDict
from pettingzoo import ParallelEnv
from typing import Dict, Any, List, Optional, Tuple

class DisasterSwarmParallelEnv(ParallelEnv):
    """
    PettingZoo Multi-Agent Reinforcement Learning Parallel Environment
    for Autonomous Disaster Response Swarm.
    
    Agents: UAV-0, UAV-1, ..., UAV-(N-1)
    Observation Space: Continuous box of [x, y, z, vx, vy, battery, health, smoke, connectivity]
    Action Space: Continuous box of [target_dx, target_dy, target_dz, sensor_power_level]
    """
    metadata = {"render_modes": ["human", "rgb_array"], "name": "disaster_swarm_v1"}

    def __init__(self, num_drones: int = 6, width: float = 800.0, height: float = 600.0, num_floors: int = 3):
        super().__init__()
        self.num_drones = num_drones
        self.width = width
        self.height = height
        self.num_floors = num_floors
        
        self.possible_agents = [f"UAV-{i}" for i in range(num_drones)]
        self.agents = self.possible_agents[:]
        
        # Action space: [dx, dy, dz, sensor_mode (0=eco/relay, 1=full search)]
        self._action_spaces = {
            agent: Box(low=np.array([-5.0, -5.0, -2.0, 0.0], dtype=np.float32),
                       high=np.array([5.0, 5.0, 2.0, 1.0], dtype=np.float32),
                       dtype=np.float32)
            for agent in self.possible_agents
        }
        
        # Observation space: 14 continuous features per UAV
        self._observation_spaces = {
            agent: Box(low=-np.inf, high=np.inf, shape=(14,), dtype=np.float32)
            for agent in self.possible_agents
        }

    @functools.lru_cache(maxsize=None)
    def observation_space(self, agent: str):
        return self._observation_spaces[agent]

    @functools.lru_cache(maxsize=None)
    def action_space(self, agent: str):
        return self._action_spaces[agent]

    def reset(self, seed: Optional[int] = None, options: Optional[Dict[str, Any]] = None) -> Tuple[Dict[str, np.ndarray], Dict[str, Dict]]:
        self.agents = self.possible_agents[:]
        observations = {}
        infos = {}
        for idx, agent in enumerate(self.agents):
            obs = np.array([
                150.0 + idx * 80.0, # x
                150.0 + (idx % 3) * 100.0, # y
                10.0, # z
                0.0, 0.0, # vx, vy
                100.0, # battery %
                1.0, 1.0, 1.0, 1.0, # c_RGB, c_Thermal, c_LiDAR, c_Comm
                0.15, # local smoke
                1.0, # degree / connectivity
                1.0, # diagnostic confidence
                0.0  # role (0 = Search)
            ], dtype=np.float32)
            observations[agent] = obs
            infos[agent] = {
                "initial_role": "Search and exploration",
                "assigned_color": f"drone_color_{idx}",
                "battery_drain_rate": 0.35
            }
        return observations, infos

    def step(self, actions: Dict[str, np.ndarray]) -> Tuple[Dict[str, np.ndarray], Dict[str, float], Dict[str, bool], Dict[str, bool], Dict[str, Dict]]:
        observations = {}
        rewards = {}
        terminations = {agent: False for agent in self.agents}
        truncations = {agent: False for agent in self.agents}
        infos = {agent: {} for agent in self.agents}

        for agent in self.agents:
            # Simulated MARL step reward for cooperative coverage + energy conservation
            act = actions.get(agent, np.zeros(4, dtype=np.float32))
            sensor_mode = act[3] if len(act) > 3 else 1.0
            
            # Relay mode (sensor_mode < 0.5) gets energy conservation bonus
            energy_penalty = -0.35 if sensor_mode >= 0.5 else -0.10
            coverage_reward = 0.5 * sensor_mode
            step_reward = coverage_reward + energy_penalty
            
            rewards[agent] = float(step_reward)
            
            # Generate next obs placeholder
            observations[agent] = np.zeros(14, dtype=np.float32)
            infos[agent]["sensor_mode"] = "FULL_SEARCH" if sensor_mode >= 0.5 else "ECO_RELAY"

        return observations, rewards, terminations, truncations, infos
