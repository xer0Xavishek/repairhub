const mongoose = require('mongoose');

const itemHistoryLogSchema = new mongoose.Schema(
  {
    repairRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RepairRequest',
      required: true,
    },
    changeType: {
      type: String,
      required: true,
      enum: [
        'REQUEST_CREATED',
        'STATUS_UPDATED',
        'QUOTE_SUBMITTED',
        'QUOTE_ACCEPTED',
        'PAYMENT_HELD_IN_ESCROW',
        'ITEM_DROPPED_OFF',
        'REPAIR_STARTED',
        'READY_FOR_PICKUP',
        'ITEM_PICKED_UP',
        'ESCROW_RELEASED',
        'REQUEST_CANCELLED',
      ],
    },
    previousStatus: {
      type: String,
      default: '',
    },
    newStatus: {
      type: String,
      default: '',
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ItemHistoryLog', itemHistoryLogSchema);
