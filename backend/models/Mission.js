import mongoose from 'mongoose';

const missionSchema = new mongoose.Schema({
  missionId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: 'Disaster Response Swarm Operation' },
  environment: {
    width: { type: Number, default: 800 },
    height: { type: Number, default: 600 },
    smokeDensity: { type: Number, default: 0.15 },
    dustLevel: { type: Number, default: 0.1 },
    commRange: { type: Number, default: 220 },
    packetLossRate: { type: Number, default: 0.05 },
    weatherCondition: { type: String, default: 'Hazy post-earthquake' }
  },
  missionStatus: {
    type: String,
    enum: ['IDLE', 'RUNNING', 'PAUSED', 'COMPLETED', 'ABORTED'],
    default: 'IDLE'
  },
  droneIds: [String],
  victimLocations: [{
    id: String,
    x: Number,
    y: Number,
    detected: { type: Boolean, default: false },
    detectedBy: String,
    detectedAt: Date,
    healthState: { type: String, default: 'CRITICAL' }
  }],
  obstacles: [{
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    type: { type: String, default: 'collapsed_building' }
  }],
  coveragePercent: { type: Number, default: 0 },
  searchGridResolution: { type: Number, default: 20 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Mission = mongoose.models.Mission || mongoose.model('Mission', missionSchema);
