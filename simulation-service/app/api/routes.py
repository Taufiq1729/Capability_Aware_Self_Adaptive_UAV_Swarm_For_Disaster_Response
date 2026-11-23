from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import torch
import networkx as nx
import pettingzoo

from app.agents.swarm_manager import SwarmManager
from app.experiments.evaluator import ExperimentEvaluator

router = APIRouter()

# Global swarm manager instance for active simulation
swarm_manager = SwarmManager(num_drones=6, seed=42, complexity="MEDIUM")
evaluator = ExperimentEvaluator()

class ResetRequest(BaseModel):
    numDrones: Optional[int] = 6
    seed: Optional[int] = 42
    buildingComplexity: Optional[str] = "MEDIUM"

class FaultInjectionRequest(BaseModel):
    droneId: str
    component: str
    faultType: str
    severity: float = Field(default=0.8, ge=0.1, le=1.0)
    gradual: bool = False

class ClearFaultRequest(BaseModel):
    droneId: str
    component: Optional[str] = None

class EnvironmentUpdateRequest(BaseModel):
    dustLevel: Optional[float] = None
    commRange: Optional[float] = None

class StepRequest(BaseModel):
    dt: Optional[float] = 1.0

class ExperimentRunRequest(BaseModel):
    numDrones: int = 6
    numVictims: int = 8
    faultProbability: float = 0.35
    commReliability: float = 0.90
    disasterSeverity: str = "HIGH"
    simulationDurationSec: int = 60
    randomSeed: int = 42

@router.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "uav-swarm-simulation-ai",
        "active_drones": len(swarm_manager.drones),
        "building_complexity": swarm_manager.complexity,
        "num_floors": swarm_manager.env.num_floors,
        "sim_time": swarm_manager.sim_time,
        "is_running": swarm_manager.is_running,
        "libraries": {
            "pytorch": torch.__version__,
            "networkx": nx.__version__,
            "pettingzoo": pettingzoo.__version__
        }
    }

@router.post("/simulation/start")
def start_simulation():
    swarm_manager.is_running = True
    return {"success": True, "is_running": True}

@router.post("/simulation/pause")
def pause_simulation():
    swarm_manager.is_running = False
    return {"success": True, "is_running": False}

@router.post("/simulation/step")
def step_simulation(req: StepRequest):
    state = swarm_manager.step(dt=req.dt or 1.0)
    return state

@router.post("/simulation/reset")
def reset_simulation(req: ResetRequest):
    swarm_manager.reset(
        num_drones=req.numDrones,
        seed=req.seed,
        complexity=req.buildingComplexity or "MEDIUM"
    )
    return {
        "success": True,
        "state": swarm_manager.step(dt=0.0)
    }

@router.get("/simulation/state")
def get_simulation_state():
    return {
        "step": swarm_manager.step_count,
        "sim_time": swarm_manager.sim_time,
        "is_running": swarm_manager.is_running,
        "coverage_percent": swarm_manager.env.get_coverage_percentage(),
        "victims_detected": len([v for v in swarm_manager.env.victims if v["detected"]]),
        "total_victims": len(swarm_manager.env.victims),
        "drones": [d.to_dict() for d in swarm_manager.drones.values()],
        "environment": swarm_manager.env.to_dict(),
        "topology": swarm_manager.mesh.get_topology_snapshot(),
        "tasks": swarm_manager.tasks,
        "recent_events": swarm_manager.recent_events[-15:],
        "ai_stack": {
            "pytorch_model": "SwarmHealthNet-v2 (12-dim multimodal tensor)",
            "pytorch_version": torch.__version__,
            "networkx_version": nx.__version__,
            "pettingzoo_version": pettingzoo.__version__
        }
    }

@router.post("/fault/inject")
def inject_fault(req: FaultInjectionRequest):
    res = swarm_manager.inject_fault(
        drone_id=req.droneId,
        component=req.component,
        fault_type=req.faultType,
        severity=req.severity,
        gradual=req.gradual
    )
    return res

@router.post("/fault/clear")
def clear_fault(req: ClearFaultRequest):
    swarm_manager.clear_fault(drone_id=req.droneId, component=req.component)
    return {"success": True, "message": f"Cleared fault on {req.droneId}"}

@router.post("/environment/update")
def update_environment(req: EnvironmentUpdateRequest):
    swarm_manager.set_environment_params(dust_level=req.dustLevel, comm_range=req.commRange)
    return {
        "success": True,
        "global_dust_level": swarm_manager.env.global_dust_level,
        "comm_range": swarm_manager.mesh.comm_range
    }

@router.post("/experiments/benchmark")
@router.post("/experiments/run")
def run_benchmark(req: ExperimentRunRequest):
    results = evaluator.run_comparative_experiment(
        num_drones=req.numDrones or 6,
        num_victims=req.numVictims or 8,
        fault_prob=req.faultProbability if req.faultProbability is not None else 0.35,
        comm_reliability=req.commReliability if req.commReliability is not None else 0.90,
        sim_duration_sec=req.simulationDurationSec or 45,
        seed=req.randomSeed or 42
    )
    return {
        "success": True,
        "config": req.dict(),
        "results": results
    }
