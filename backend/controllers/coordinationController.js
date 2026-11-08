import { pythonClient } from '../services/pythonClient.js';
import { CoordinationEvent } from '../models/CoordinationEvent.js';
import { isDbConnected } from '../config/db.js';

export const getCoordinationTopology = async (req, res) => {
  try {
    const pythonRes = await pythonClient.get('/simulation/state');
    const topology = pythonRes.data.topology || {};
    const tasks = pythonRes.data.tasks || [];
    const recentEvents = pythonRes.data.recent_events || [];

    res.json({
      topology,
      tasks,
      recentEvents
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCoordinationEvents = async (req, res) => {
  try {
    if (isDbConnected) {
      const events = await CoordinationEvent.find().sort({ createdAt: -1 }).limit(100).lean();
      return res.json({ events });
    }
    const pythonRes = await pythonClient.get('/simulation/state');
    res.json({ events: pythonRes.data.recent_events || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
