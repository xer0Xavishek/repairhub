const User = require('../models/User');
const RepairRequest = require('../models/RepairRequest');
const Payment = require('../models/Payment');
const EnvironmentalImpact = require('../models/EnvironmentalImpact');

// @desc    Get all users (Module 5 - F19, F22)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify repairer credentials & grant Certified Trust Badge (Module 5 - F21)
// @route   PUT /api/admin/verify-repairer/:id
// @access  Private (Admin)
const verifyRepairer = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isVerified = true;
    await user.save();

    res.json({ success: true, message: `Repairer ${user.name} has been certified with a Trust Badge`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject repairer verification (Module 5 - F21)
// @route   PUT /api/admin/reject-repairer/:id
// @access  Private (Admin)
const rejectRepairer = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isVerified = false;
    await user.save();

    res.json({ success: true, message: `Verification rejected: ${reason || 'Incomplete documentation'}`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user active / suspended status (Module 5 - F19)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const toggleUserStatus = async (req, res) => {
  try {
    const { isSuspended } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isSuspended = isSuspended !== undefined ? isSuspended : !user.isSuspended;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.name} account ${user.isSuspended ? 'suspended' : 'reactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resolve escrow payment dispute (Module 5 - F20)
// @route   PUT /api/admin/escrow/:paymentId/resolve
// @access  Private (Admin)
const resolveEscrowDispute = async (req, res) => {
  try {
    const { action, resolutionNotes } = req.body; // 'RELEASE_TO_REPAIRER' or 'REFUND_TO_CUSTOMER'
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (action === 'RELEASE_TO_REPAIRER') {
      payment.status = 'Successful';
      payment.escrowStatus = 'RELEASED_TO_REPAIRER';
      payment.releasedAt = new Date();
    } else if (action === 'REFUND_TO_CUSTOMER') {
      payment.status = 'Refunded';
      payment.escrowStatus = 'REFUNDED_TO_CUSTOMER';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid resolution action. Must be RELEASE_TO_REPAIRER or REFUND_TO_CUSTOMER' });
    }

    await payment.save();

    res.json({
      success: true,
      message: `Dispute resolved: ${payment.escrowStatus}`,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get platform analytics & GMV metrics (Module 5 - F19)
// @route   GET /api/admin/metrics
// @access  Private (Admin)
const getPlatformMetrics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRepairs = await RepairRequest.countDocuments();
    const completedRepairs = await RepairRequest.countDocuments({ status: 'Completed' });

    const payments = await Payment.find();
    const gmv = payments.reduce((sum, p) => sum + p.amount, 0);
    const platformEarnings = payments.reduce((sum, p) => sum + (p.platformFee || 0), 0);

    const impacts = await EnvironmentalImpact.find();
    const totalEwasteKg = impacts.reduce((sum, i) => sum + i.wasteDivertedKg, 0);
    const totalCo2Kg = impacts.reduce((sum, i) => sum + i.co2SavedKg, 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRepairs,
        completedRepairs,
        gmv: Number(gmv.toFixed(2)),
        platformEarnings: Number(platformEarnings.toFixed(2)),
        sustainability: {
          totalEwasteKg: Number(totalEwasteKg.toFixed(2)),
          totalCo2Kg: Number(totalCo2Kg.toFixed(2)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all escrow payments & transactions (Module 5 - F20)
// @route   GET /api/admin/escrow
// @access  Private (Admin)
const getEscrowPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('payerId', 'name email')
      .populate('payeeId', 'name businessName email')
      .populate('repairRequestId', 'ticketNumber itemTitle status currentStage')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUsers,
  verifyRepairer,
  rejectRepairer,
  toggleUserStatus,
  resolveEscrowDispute,
  getPlatformMetrics,
  getEscrowPayments,
};

