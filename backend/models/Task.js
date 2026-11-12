import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: '' },
  taskType: {
    type: String,
    enum: ['SEARCH', 'VICTIM_DETECTION', 'MAPPING', 'COMMUNICATION_RELAY', 'ASSIST_EVACUATION'],
    required: true
  },
  location: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  requiredCapabilities: {
    min_RGB: { type: Number, default: 0 },
    min_Thermal: { type: Number, default: 0 },
    min_LiDAR: { type: Number, default: 0 },
    min_Mobility: { type: Number, default: 0.3 },
    min_Comm: { type: Number, default: 0.2 },
    min_Battery: { type: Number, default: 15 }
  },
  assignedDrone: { type: String, default: null },
  previousDrone: { type: String, default: null },
  acquiredFrom: { type: String, default: null },
  handoverReason: { type: String, default: null },
  handoverConfidence: { type: Number, default: null },
  handoverTimestamp: { type: Number, default: null },
  assignedBasedOnHealth: {
    healthStatus: { type: String, default: 'HEALTHY' },
    confidence: { type: Number, default: 0.98 },
    winningBidScore: { type: Number, default: null },
    reason: { type: String, default: '' }
  },
  taskStatus: {
    type: String,
    enum: ['PENDING', 'BIDDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  priority: { type: Number, default: 5 },
  handoverHistory: [{
    fromDrone: String,
    toDrone: String,
    reason: String,
    initiatorHealth: String,
    winnerHealth: String,
    bidScore: Number,
    timestamp: Number
  }],
  biddingHistory: [{
    droneId: String,
    bidScore: Number,
    timestamp: { type: Date, default: Date.now },
    accepted: Boolean
  }]
}, { timestamps: true });

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
