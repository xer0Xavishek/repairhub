const express = require('express');
const router = express.Router();
const {
  createRepairRequest,
  getRepairRequests,
  getRepairRequestById,
  getAvailableRepairRequests,
  respondToRepairRequest,
  updateRepairStatus,
  verifyQRHandover,
  getItemHistoryLog,
} = require('../controllers/repairController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').post(protect, createRepairRequest).get(getRepairRequests);
router.route('/available').get(protect, getAvailableRepairRequests);
router.route('/:id/decision').put(protect, respondToRepairRequest);
router.route('/:id').get(getRepairRequestById);
router.route('/:id/status').put(protect, updateRepairStatus);
router.route('/:id/verify-qr').post(protect, verifyQRHandover);
router.route('/:id/history').get(protect, getItemHistoryLog);

module.exports = router;
