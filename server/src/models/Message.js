const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    repairRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RepairRequest',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
