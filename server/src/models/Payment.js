const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    repairRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RepairRequest',
      required: true,
    },
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      default: null,
    },
    payerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    payeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    method: {
      type: String,
      enum: ['Stripe', 'SSLCommerz', 'bKash', 'Nagad', 'Card', 'Cash On Delivery'],
      default: 'Stripe',
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['Initiated', 'Successful', 'Failed', 'Refunded'],
      default: 'Initiated',
    },
    escrowStatus: {
      type: String,
      enum: ['HELD_IN_ESCROW', 'RELEASED_TO_REPAIRER', 'REFUNDED_TO_CUSTOMER', 'NOT_APPLICABLE'],
      default: 'HELD_IN_ESCROW',
    },
    releasedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
