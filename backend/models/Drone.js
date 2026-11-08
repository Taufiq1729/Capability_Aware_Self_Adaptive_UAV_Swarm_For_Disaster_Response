import mongoose from 'mongoose';

const droneSchema = new mongoose.Schema({
  droneId: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: '' },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 20 },
  },
  velocity: {
    vx: { type: Number, default: 0 },
    vy: { type: Number, default: 0 }
  },
  currentRole: {
    type: String,
    enum: [
      'Search and exploration',
      'Victim detection',
      'Mapping and reconnaissance',
      'Communication relay',
      'Return to Home / Land'
    ],
    default: 'Search and exploration'
  },
  battery: { type: Number, default: 100 },
  componentHealth: {
    motor: { type: Number, default: 1.0 },
    batteryHealth: { type: Number, default: 1.0 },
    rgbCamera: { type: Number, default: 1.0 },
    thermalCamera: { type: Number, default: 1.0 },
    lidar: { type: Number, default: 1.0 },
    gpsAccuracy: { type: Number, default: 1.0 },
    commRadio: { type: Number, default: 1.0 },
    compute: { type: Number, default: 1.0 },
  },
  capabilityVector: {
    c_RGB: { type: Number, default: 1.0 },
    c_Thermal: { type: Number, default: 1.0 },
    c_LiDAR: { type: Number, default: 1.0 },
    c_Communication: { type: Number, default: 1.0 },
    c_Mobility: { type: Number, default: 1.0 },
    c_Localization: { type: Number, default: 1.0 },
    c_Energy: { type: Number, default: 1.0 },
    c_Compute: { type: Number, default: 1.0 },
  },
  operationalStatus: {
    type: String,
    enum: ['HEALTHY', 'DEGRADED', 'CRITICAL', 'DISCONNECTED'],
    default: 'HEALTHY'
  },
  diagnosticConfidence: { type: Number, default: 1.0 },
  anomalyScore: { type: Number, default: 0.0 },
  activeFaults: [{
    component: String,
    faultType: String,
    severity: String,
    injectedAt: Date,
    confidence: Number
  }],
  assignedTasks: [String],
  feasibleRoles: [String],
  connectedPeers: [String],
  telemetryHistory: [{
    timestamp: { type: Date, default: Date.now },
    battery: Number,
    anomalyScore: Number,
    diagnosticConfidence: Number,
    role: String
  }]
}, { timestamps: true });

export const Drone = mongoose.models.Drone || mongoose.model('Drone', droneSchema);
