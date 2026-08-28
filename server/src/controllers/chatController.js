const mongoose = require('mongoose');
const Message = require('../models/Message');
const RepairRequest = require('../models/RepairRequest');

// @desc    Send in-app chat message (Module 4 - F18)
// @route   POST /api/chat/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    let { repairRequestId, receiverId, content, photoUrl } = req.body;

    if (!repairRequestId || !content) {
      return res.status(400).json({ success: false, message: 'Please provide request ID and content' });
    }

    // Resolve repairRequestId and enforce chat closure on completed orders (Bug 5)
    let targetReq = null;
    if (mongoose.Types.ObjectId.isValid(repairRequestId)) {
      targetReq = await RepairRequest.findById(repairRequestId);
    } else {
      targetReq = await RepairRequest.findOne({ ticketNumber: repairRequestId });
    }

    if (targetReq) {
      repairRequestId = targetReq._id;
      if (targetReq.status === 'Completed') {
        return res.status(400).json({
          success: false,
          message: 'This repair order is completed and escrow settled. Live chat is archived and closed.',
        });
      }
      if (!receiverId) {
        receiverId = req.user._id.toString() === targetReq.requesterId.toString()
          ? targetReq.assignedRepairerId
          : targetReq.requesterId;
      }
    }

    if (!receiverId) {
      receiverId = req.user._id;
    }

    const message = await Message.create({
      repairRequestId,
      senderId: req.user._id,
      receiverId,
      content,
      photoUrl: photoUrl || '',
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name role')
      .populate('receiverId', 'name role');

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chat message history for a repair request (Module 4 - F18)
// @route   GET /api/chat/request/:requestId
// @access  Private
const getMessagesByRequest = async (req, res) => {
  try {
    let targetId = req.params.requestId;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      const found = await RepairRequest.findOne({ ticketNumber: targetId });
      if (found) {
        targetId = found._id;
      } else {
        return res.json({ success: true, count: 0, data: [] });
      }
    }

    const messages = await Message.find({ repairRequestId: targetId })
      .populate('senderId', 'name role')
      .populate('receiverId', 'name role')
      .sort({ createdAt: 1 });

    res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendMessage, getMessagesByRequest };
