const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    repairerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedDate: {
      type: Date,
      required: true,
    },
    preferredSlot: {
      type: String,
      enum: ['Morning (10:00 AM)', 'Afternoon (02:00 PM)', 'Evening (05:00 PM)', 'Any'],
      default: 'Any',
    },
    queuePosition: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['Waiting', 'Promoted', 'Cancelled'],
      default: 'Waiting',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Waitlist', waitlistSchema);
