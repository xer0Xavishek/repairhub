const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    repairerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    repairRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RepairRequest',
      default: null,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Rescheduled', 'Completed', 'Cancelled'],
      default: 'Confirmed',
    },
    type: {
      type: String,
      enum: ['In-Shop Diagnostic', 'Home Visit', 'Repair Cafe Slot'],
      default: 'In-Shop Diagnostic',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
