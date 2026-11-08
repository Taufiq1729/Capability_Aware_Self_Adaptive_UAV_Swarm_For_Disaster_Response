import mongoose from 'mongoose';

const faultEventSchema = new mongoose.Schema({
  droneId: { type: String, required: true, index: true },
  component: { type: String, required: true },
  faultType: { type: String, required: true },
  severity: {
    type: String,
    enum: ['MINOR', 'MODERATE', 'CRITICAL', 'FATAL'],
    default: 'MODERATE'
  },
  confidence: { type: Number, default: 0.85 },
  anomalyScore: { type: Number, default: 0.5 },
  detectionTime: { type: Date, default: Date.now },
  assessmentTime: { type: Date, default: Date.now },
  detectionLatencyMs: { type: Number, default: 120 },
  recovered: { type: Boolean, default: false },
  details: { type: Object, default: {} }
}, { timestamps: true });

export const FaultEvent = mongoose.models.FaultEvent || mongoose.model('FaultEvent', faultEventSchema);
