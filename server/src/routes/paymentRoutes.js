const express = require('express');
const router = express.Router();
const { 
  initiatePayment, 
  handleStripeWebhook,
  releaseEscrow, 
  getPaymentByRequest 
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

// Stripe Payment Initiation & Checkout
router.post('/initiate', initiatePayment);
router.post('/stripe/create-checkout-session', initiatePayment);
router.post('/stripe/webhook', handleStripeWebhook);

// Escrow & Query
router.post('/:id/release-escrow', protect, releaseEscrow);
router.get('/request/:requestId', protect, getPaymentByRequest);

module.exports = router;
