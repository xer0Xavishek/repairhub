const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  verifyRepairer,
  rejectRepairer,
  toggleUserStatus,
  resolveEscrowDispute,
  getPlatformMetrics,
  getEscrowPayments,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/verify-repairer/:id', protect, authorize('admin'), verifyRepairer);
router.put('/reject-repairer/:id', protect, authorize('admin'), rejectRepairer);
router.put('/users/:id/status', protect, authorize('admin'), toggleUserStatus);
router.get('/escrow', protect, authorize('admin'), getEscrowPayments);
router.put('/escrow/:paymentId/resolve', protect, authorize('admin'), resolveEscrowDispute);
router.get('/metrics', protect, authorize('admin'), getPlatformMetrics);

module.exports = router;
