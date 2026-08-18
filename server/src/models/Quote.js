const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema(
  {
    repairRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RepairRequest',
      required: true,
    },
    repairerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Quote price is required'],
      min: 0,
    },
    estimatedDays: {
      type: Number,
      required: true,
      default: 2,
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Revised'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quote', quoteSchema);
