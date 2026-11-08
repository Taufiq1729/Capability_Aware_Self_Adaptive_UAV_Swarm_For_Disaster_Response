import { pythonClient } from './pythonClient.js';
import { Drone } from '../models/Drone.js';
import { Mission } from '../models/Mission.js';
import { FaultEvent } from '../models/FaultEvent.js';
import { CoordinationEvent } from '../models/CoordinationEvent.js';
import { isDbConnected } from '../config/db.js';

class SimulationBridge {
  constructor() {
    this.io = null;
    this.intervalId = null;
    this.isRunning = false;
    this.simSpeed = 1.0;
    this.latestState = null;
    this.lastPersistStep = 0;
  }

  setSocketIO(ioInstance) {
    this.io = ioInstance;
  }

  async start() {
    this.isRunning = true;
    try {
      await pythonClient.post('/simulation/start');
    } catch (e) {
      console.warn('[Bridge] Warning starting python simulation:', e.message);
    }

    if (this.intervalId) clearInterval(this.intervalId);
    
    // Tick at 500ms intervals (2Hz simulation cycle)
    const intervalMs = Math.max(100, Math.floor(500 / this.simSpeed));
    this.intervalId = setInterval(() => this.tick(), intervalMs);

    if (this.io) {
      this.io.emit('simulation_status', { isRunning: true, speed: this.simSpeed });
    }
  }

  async pause() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    try {
      await pythonClient.post('/simulation/pause');
    } catch (e) {
      console.warn('[Bridge] Warning pausing python simulation:', e.message);
    }
    if (this.io) {
      this.io.emit('simulation_status', { isRunning: false, speed: this.simSpeed });
    }
  }

  async setSpeed(speedMultiplier) {
    this.simSpeed = Math.max(0.5, Math.min(5.0, speedMultiplier));
    if (this.isRunning) {
      await this.start();
    }
  }

  async reset(numDrones = 6, seed = 42) {
    const wasRunning = this.isRunning;
    if (this.intervalId) clearInterval(this.intervalId);
    
    try {
      const res = await pythonClient.post('/simulation/reset', { numDrones, seed });
      this.latestState = res.data.state;
    } catch (e) {
      console.warn('[Bridge] Python reset error:', e.message);
    }

    if (wasRunning) {
      await this.start();
    } else {
      this.isRunning = false;
      if (this.io) {
        this.io.emit('simulation_status', { isRunning: false, speed: this.simSpeed });
        if (this.latestState) this.io.emit('telemetry_update', this.latestState);
      }
    }
  }

  async tick() {
    try {
      const res = await pythonClient.post('/simulation/step', { dt: 1.0 });
      const state = res.data;
      this.latestState = state;

      if (!this.io) return;

      // Broadcast telemetry update
      this.io.emit('telemetry_update', state);

      // Check events and broadcast specific socket channels
      if (state.recent_events && state.recent_events.length > 0) {
        for (const evt of state.recent_events) {
          if (evt.eventType === 'ROLE_CHANGED') {
            this.io.emit('role_changed', evt);
          } else if (evt.eventType === 'TASK_REASSIGNMENT_REQUESTED') {
            this.io.emit('task_reallocation_requested', evt);
          } else if (evt.eventType === 'TASK_REASSIGNED') {
            this.io.emit('task_reassigned', evt);
          } else if (evt.eventType === 'FAULT_INJECTED') {
            this.io.emit('anomaly_detected', evt);
          }
        }
      }

      // Persist significant periodic snapshots to MongoDB every 10 steps
      if (isDbConnected && state.step - this.lastPersistStep >= 10) {
        this.lastPersistStep = state.step;
        this.persistSnapshot(state).catch(e => console.warn('[DB Persist error]:', e.message));
      }
    } catch (err) {
      // Python microservice might be restarting or paused
    }
  }

  async persistSnapshot(state) {
    if (!state || !state.drones) return;
    for (const d of state.drones) {
      await Drone.findOneAndUpdate(
        { droneId: d.droneId },
        {
          droneId: d.droneId,
          position: { x: d.x, y: d.y, z: 20 },
          currentRole: d.currentRole,
          battery: d.battery,
          capabilityVector: d.capabilities,
          operationalStatus: d.operationalStatus,
          diagnosticConfidence: d.diagnostic_confidence,
          assignedTasks: d.assigned_tasks,
          feasibleRoles: d.feasible_roles
        },
        { upsert: true, new: true }
      );
    }
  }
}

export const simulationBridge = new SimulationBridge();
