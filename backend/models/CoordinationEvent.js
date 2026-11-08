import mongoose from 'mongoose';

const coordinationEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: [
      'TASK_REASSIGNMENT_REQUESTED',
      'BID_SUBMITTED',
      'TASK_AWARDED',
      'ROLE_SWITCHED',
      'COMMUNICATION_LINK_LOST',
      'COMMUNICATION_LINK_RESTORED',
      'SAFETY_FALLBACK_TRIGGERED',
      'CONSENSUS_REACHED'
    ],
    required: true
  },
  senderDrone: { type: String, required: true },
  receiverDrone: { type: String, default: 'BROADCAST' },
  taskId: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
  eventDetails: { type: Object, default: {} }
}, { timestamps: true });

export const CoordinationEvent = mongoose.models.CoordinationEvent || mongoose.model('CoordinationEvent', coordinationEventSchema);
