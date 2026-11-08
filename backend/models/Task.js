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
  taskStatus: {
    type: String,
    enum: ['PENDING', 'BIDDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  priority: { type: Number, default: 5 },
  biddingHistory: [{
    droneId: String,
    bidScore: Number,
    timestamp: { type: Date, default: Date.now },
    accepted: Boolean
  }]
}, { timestamps: true });

export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
