import { pythonClient } from '../services/pythonClient.js';
import { Drone } from '../models/Drone.js';
import { isDbConnected } from '../config/db.js';

export const getAllDrones = async (req, res) => {
  try {
    const pythonRes = await pythonClient.get('/simulation/state');
    const drones = pythonRes.data.drones || [];
    res.json({ drones, count: drones.length });
  } catch (err) {
    if (isDbConnected) {
      const dbDrones = await Drone.find().lean();
      return res.json({ drones: dbDrones, count: dbDrones.length });
    }
    res.status(503).json({ error: 'Drone telemetry service unavailable' });
  }
};

export const getDroneDetails = async (req, res) => {
  try {
    const { droneId } = req.params;
    const pythonRes = await pythonClient.get('/simulation/state');
    const detailedStates = pythonRes.data.detailed_drone_states || {};
    const droneState = detailedStates[droneId];

    if (!droneState) {
      return res.status(404).json({ error: `Drone ${droneId} not found in active simulation` });
    }

    res.json(droneState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
