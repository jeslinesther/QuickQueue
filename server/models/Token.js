const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    tokenNumber: {
      type: String,
      required: [true, 'Token number is required'],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
      enum: ['General Consultation', 'Account Services', 'Technical Support', 'Billing & Payments'],
      default: 'General Consultation',
    },
    status: {
      type: String,
      enum: ['WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'MISSED', 'EXPIRED'],
      default: 'WAITING',
    },
    queuePosition: {
      type: Number,
      default: null,
    },
    counter: {
      type: Number,
      default: null,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    arrivedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    missedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    predictedWaitTime: {
      type: Number,
      default: 0, // In minutes
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient FIFO querying
tokenSchema.index({ status: 1, createdAt: 1 });
tokenSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Token', tokenSchema);
