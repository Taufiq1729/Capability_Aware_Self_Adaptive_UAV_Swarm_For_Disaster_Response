import { pythonClient } from '../services/pythonClient.js';
import { FaultEvent } from '../models/FaultEvent.js';
import { isDbConnected } from '../config/db.js';
import { simulationBridge } from '../services/simulationBridge.js';

export const injectFault = async (req, res) => {
  try {
    const { droneId, component, faultType, severity, gradual } = req.body;
    if (!droneId || !component || !faultType) {
      return res.status(400).json({ error: 'Missing required fields: droneId, component, faultType' });
    }

    const pythonRes = await pythonClient.post('/fault/inject', {
      droneId,
      component,
      faultType,
      severity: severity !== undefined ? parseFloat(severity) : 0.8,
      gradual: !!gradual
    });

    // Record to database
    if (isDbConnected) {
      const faultDoc = new FaultEvent({
        droneId,
        component,
        faultType,
        severity: (severity > 0.8 ? 'CRITICAL' : 'MODERATE'),
        confidence: 0.90,
        details: { gradual }
      });
      await faultDoc.save().catch(e => console.warn('[DB Fault save error]:', e.message));
    }

    if (simulationBridge.io) {
      simulationBridge.io.emit('anomaly_detected', pythonRes.data.event);
    }

    res.json(pythonRes.data);
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    res.status(500).json({ error: msg });
  }
};

export const clearFault = async (req, res) => {
  try {
    const { droneId, component } = req.body;
    const pythonRes = await pythonClient.post('/fault/clear', { droneId, component });
    res.json(pythonRes.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFaultHistory = async (req, res) => {
  try {
    if (isDbConnected) {
      const faults = await FaultEvent.find().sort({ createdAt: -1 }).limit(50).lean();
      return res.json({ faults });
    }
    res.json({ faults: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
