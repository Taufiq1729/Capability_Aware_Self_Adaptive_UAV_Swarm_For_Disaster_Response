import mongoose from 'mongoose';

const experimentSchema = new mongoose.Schema({
  experimentId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: 'Swarm Fault Resilience Benchmark' },
  configuration: {
    numDrones: { type: Number, default: 6 },
    numVictims: { type: Number, default: 8 },
    faultProbability: { type: Number, default: 0.35 },
    commReliability: { type: Number, default: 0.90 },
    disasterSeverity: { type: String, default: 'HIGH' },
    simulationDurationSec: { type: Number, default: 120 },
    randomSeed: { type: Number, default: 42 }
  },
  baseline: {
    type: String,
    enum: [
      'A_FIXED_ROLES',
      'B_ANOMALY_ONLY',
      'C_BASIC_ADAPTATION',
      'D_PROPOSED_CONFIDENCE_AWARE'
    ],
    required: true
  },
  randomSeed: { type: Number, default: 42 },
  metrics: {
    detectionPrecision: { type: Number, default: 0 },
    detectionRecall: { type: Number, default: 0 },
    f1Score: { type: Number, default: 0 },
    falseAlarmRate: { type: Number, default: 0 },
    detectionLatencyMs: { type: Number, default: 0 },
    roleAdaptationTimeSec: { type: Number, default: 0 },
    victimDetectionRate: { type: Number, default: 0 },
    areaCoveragePct: { type: Number, default: 0 },
    missionCompletionRate: { type: Number, default: 0 },
    taskRecoveryRate: { type: Number, default: 0 },
    energyConsumptionJoules: { type: Number, default: 0 },
    commOverheadMsgs: { type: Number, default: 0 },
    diagnosticInferenceTimeMs: { type: Number, default: 0 }
  },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Experiment = mongoose.models.Experiment || mongoose.model('Experiment', experimentSchema);
