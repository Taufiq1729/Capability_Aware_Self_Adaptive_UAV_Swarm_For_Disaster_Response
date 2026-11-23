import { simulationBridge } from '../services/simulationBridge.js';
import { pythonClient } from '../services/pythonClient.js';

export const getSimulationStatus = async (req, res) => {
  try {
    const pythonRes = await pythonClient.get('/simulation/state');
    res.json({
      isRunning: simulationBridge.isRunning,
      speed: simulationBridge.simSpeed,
      state: pythonRes.data
    });
  } catch (err) {
    if (simulationBridge.latestState) {
      return res.json({
        isRunning: simulationBridge.isRunning,
        speed: simulationBridge.simSpeed,
        state: simulationBridge.latestState
      });
    }
    res.status(503).json({ error: 'Simulation microservice unavailable: ' + err.message });
  }
};

export const startSimulation = async (req, res) => {
  try {
    await simulationBridge.start();
    res.json({ success: true, isRunning: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const pauseSimulation = async (req, res) => {
  try {
    await simulationBridge.pause();
    res.json({ success: true, isRunning: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const setSimulationSpeed = async (req, res) => {
  try {
    const speed = parseFloat(req.body.speed) || 1.0;
    await simulationBridge.setSpeed(speed);
    res.json({ success: true, speed: simulationBridge.simSpeed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resetSimulation = async (req, res) => {
  try {
    const { numDrones, seed, buildingComplexity } = req.body;
    await simulationBridge.reset(
      numDrones || 6,
      seed !== undefined ? seed : 42,
      buildingComplexity || 'MEDIUM'
    );
    res.json({ success: true, message: 'Simulation reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const stepSimulation = async (req, res) => {
  try {
    const pythonRes = await pythonClient.post('/simulation/step', { dt: 1.0 });
    simulationBridge.latestState = pythonRes.data;
    if (simulationBridge.io) {
      simulationBridge.io.emit('telemetry_update', pythonRes.data);
    }
    res.json(pythonRes.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateEnvironment = async (req, res) => {
  try {
    const { dustLevel, commRange } = req.body;
    const pythonRes = await pythonClient.post('/environment/update', { dustLevel, commRange });
    res.json(pythonRes.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
