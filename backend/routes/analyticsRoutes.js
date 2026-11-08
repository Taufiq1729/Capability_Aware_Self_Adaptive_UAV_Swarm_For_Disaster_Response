import express from 'express';
import { runBenchmarkExperiment, exportBenchmarkCSV, getExperimentHistory } from '../controllers/analyticsController.js';

const router = express.Router();

router.post('/run', runBenchmarkExperiment);
router.post('/export-csv', exportBenchmarkCSV);
router.get('/history', getExperimentHistory);

export default router;
