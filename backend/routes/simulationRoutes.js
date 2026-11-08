import express from 'express';
import {
  getSimulationStatus,
  startSimulation,
  pauseSimulation,
  setSimulationSpeed,
  resetSimulation,
  stepSimulation,
  updateEnvironment
} from '../controllers/simulationController.js';

const router = express.Router();

router.get('/status', getSimulationStatus);
router.post('/start', startSimulation);
router.post('/pause', pauseSimulation);
router.post('/speed', setSimulationSpeed);
router.post('/reset', resetSimulation);
router.post('/step', stepSimulation);
router.post('/environment', updateEnvironment);

export default router;
