import { pythonClient } from '../services/pythonClient.js';
import { Experiment } from '../models/Experiment.js';
import { isDbConnected } from '../config/db.js';

export const runBenchmarkExperiment = async (req, res) => {
  try {
    const {
      numDrones = 6,
      numVictims = 8,
      faultProbability = 0.35,
      commReliability = 0.90,
      disasterSeverity = 'HIGH',
      simulationDurationSec = 60,
      randomSeed = 42
    } = req.body;

    const pythonRes = await pythonClient.post('/experiments/run', {
      numDrones,
      numVictims,
      faultProbability,
      commReliability,
      disasterSeverity,
      simulationDurationSec,
      randomSeed
    });

    const expData = pythonRes.data;

    // Persist to MongoDB
    if (isDbConnected && expData.results) {
      const expId = `EXP-${Date.now()}`;
      for (const [baselineName, metrics] of Object.entries(expData.results)) {
        await Experiment.create({
          experimentId: `${expId}-${baselineName}`,
          configuration: expData.config,
          baseline: baselineName,
          randomSeed,
          metrics
        }).catch(e => console.warn('[DB Experiment save error]:', e.message));
      }
    }

    res.json(expData);
  } catch (err) {
    const msg = err.response?.data?.detail || err.message;
    res.status(500).json({ error: msg });
  }
};

export const exportBenchmarkCSV = async (req, res) => {
  try {
    const { results } = req.body;
    if (!results || typeof results !== 'object') {
      return res.status(400).json({ error: 'Results object required for CSV export' });
    }

    const headers = [
      'Baseline',
      'DetectionPrecision',
      'DetectionRecall',
      'F1Score',
      'FalseAlarmRate',
      'DetectionLatencyMs',
      'RoleAdaptationTimeSec',
      'VictimDetectionRatePct',
      'AreaCoveragePct',
      'MissionCompletionRatePct',
      'TaskRecoveryRatePct',
      'EnergyConsumptionJoules',
      'CommOverheadMsgs',
      'DiagnosticInferenceTimeMs'
    ];

    const rows = [];
    for (const [baseline, m] of Object.entries(results)) {
      rows.push([
        baseline,
        m.detectionPrecision,
        m.detectionRecall,
        m.f1Score,
        m.falseAlarmRate,
        m.detectionLatencyMs,
        m.roleAdaptationTimeSec,
        m.victimDetectionRate,
        m.areaCoveragePct,
        m.missionCompletionRate,
        m.taskRecoveryRate,
        m.energyConsumptionJoules,
        m.commOverheadMsgs,
        m.diagnosticInferenceTimeMs
      ].join(','));
    }

    const csvContent = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="uav_swarm_research_benchmark.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getExperimentHistory = async (req, res) => {
  try {
    if (isDbConnected) {
      const history = await Experiment.find().sort({ createdAt: -1 }).limit(40).lean();
      return res.json({ history });
    }
    res.json({ history: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
