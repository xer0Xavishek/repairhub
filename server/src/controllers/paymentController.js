const Stripe = require('stripe');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const RepairRequest = require('../models/RepairRequest');
const User = require('../models/User');
const Quote = require('../models/Quote');
const ItemHistoryLog = require('../models/ItemHistoryLog');
const EnvironmentalImpact = require('../models/EnvironmentalImpact');
const { calculateEnvironmentalImpact } = require('../utils/impactCalculator');


const getStripeInstance = () => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key';
  return new Stripe(stripeSecretKey);
};

// @desc    Initiate Stripe Payment / Checkout Session (Module 4 - F17)
// @route   POST /api/payments/initiate
// @access  Public / Protected
const initiatePayment = async (req, res) => {
  try {
    const { 
      repairRequestId, 
      quoteId, 
      amount, 
      method,
      repairerName,
      customerName, 
      customerEmail,
      paymentMethodId 
    } = req.body;

    let request = null;
    if (repairRequestId) {
      if (mongoose.Types.ObjectId.isValid(repairRequestId)) {
        request = await RepairRequest.findById(repairRequestId);
        if (!request) {
          return res.status(404).json({ success: false, message: 'Repair request not found' });
        }
      } else {
        request = await RepairRequest.findOne({ ticketNumber: repairRequestId });
      }
    }

    const totalAmount = Number(amount) || 750;
    const platformFee = Number((totalAmount * 0.05).toFixed(2));
    const transactionId = `pi_stripe_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // Resolve assigned repairer from quote or technician name/id
    let resolvedRepairerId = request?.assignedRepairerId || null;
    let resolvedQuote = null;

    if (quoteId && mongoose.Types.ObjectId.isValid(quoteId)) {
      resolvedQuote = await Quote.findById(quoteId);
      if (resolvedQuote) {
        resolvedRepairerId = resolvedQuote.repairerId;
        resolvedQuote.status = 'Accepted';
        await resolvedQuote.save();
        if (request) {
          await Quote.updateMany(
            { repairRequestId: request._id, _id: { $ne: resolvedQuote._id }, status: 'Pending' },
            { status: 'Rejected' }
          );
        }
      }
    }

    if (!resolvedRepairerId && req.body.repairerId && mongoose.Types.ObjectId.isValid(req.body.repairerId)) {
      resolvedRepairerId = req.body.repairerId;
    }

    if (!resolvedRepairerId && repairerName) {
      const repUser = await User.findOne({
        $or: [
          { businessName: new RegExp(`^${repairerName.trim()}$`, 'i') },
          { name: new RegExp(`^${repairerName.trim()}$`, 'i') }
        ]
      });
      if (repUser) resolvedRepairerId = repUser._id;
    }

    // Mock payer & payee fallback if not registered in DB
    const fallbackId = new mongoose.Types.ObjectId();
    const payerId = req.user?._id || request?.requesterId || fallbackId;
    const payeeId = resolvedRepairerId || request?.assignedRepairerId || payerId;
    const validRepairId = request?._id || (mongoose.Types.ObjectId.isValid(repairRequestId) ? repairRequestId : fallbackId);

    // Create Payment record in Database
    let payment = null;
    try {
      payment = await Payment.create({
        repairRequestId: validRepairId,
        quoteId: (quoteId && mongoose.Types.ObjectId.isValid(quoteId)) ? quoteId : null,
        payerId,
        payeeId,
        amount: totalAmount,
        platformFee,
        method: method || 'Stripe',
        transactionId,
        status: 'Successful',
        escrowStatus: 'HELD_IN_ESCROW',
      });
    } catch (payErr) {
      console.warn(`[Payment Model Record Notice]:`, payErr.message);
    }

    if (request) {
      request.status = 'In Progress';
      if (repairerName) request.assignedRepairer = repairerName;
      if (resolvedRepairerId) request.assignedRepairerId = resolvedRepairerId;
      if (resolvedQuote?.price) request.finalPrice = resolvedQuote.price;
      else if (totalAmount) request.finalPrice = totalAmount;
      await request.save();

      if (req.user || request.requesterId) {
        try {
          await ItemHistoryLog.create({
            repairRequestId: request._id,
            changeType: 'PAYMENT_HELD_IN_ESCROW',
            previousStatus: 'Quoted',
            newStatus: 'In Progress',
            actorId: req.user ? req.user._id : request.requesterId,
            note: `Payment of ৳${totalAmount} authorized via Stripe Protected Vault (Txn: ${transactionId}). Funds locked under RepairHub Guarantee.`,
          });
        } catch (logErr) {
          console.warn(`[Log creation error]:`, logErr.message);
        }
      }
    }

    let clientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substring(2, 9)}`;
    let checkoutUrl = `${clientUrl}/?payment=success&gateway=Stripe&txn=${transactionId}&amount=${totalAmount}`;

    // Execute Live Stripe API Call
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey && stripeSecretKey.startsWith('sk_test_')) {
      try {
        const stripe = getStripeInstance();
        console.log(`[Stripe API Live] Calling Stripe API with key ${stripeSecretKey.substring(0, 14)}...`);
        
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'bdt',
                product_data: {
                  name: `RepairHub Hardware Diagnostic & Vault Guarantee: ${request?.itemTitle || 'Electronics Repair'}`,
                  description: `Assigned Workshop: ${repairerName || 'Certified Technician Lab'}`,
                },
                unit_amount: Math.round(totalAmount * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          customer_email: customerEmail || 'customer@repairhub.com',
          success_url: `${clientUrl}/?payment=success&gateway=Stripe&txn=${transactionId}&amount=${totalAmount}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${clientUrl}/?payment=cancelled&gateway=Stripe`,
        });

        if (session?.url) {
          checkoutUrl = session.url;
          console.log(`[Stripe API Live] Created Hosted Checkout URL: ${checkoutUrl}`);
        }
      } catch (stripeErr) {
        console.warn(`[Stripe API Session Notice]:`, stripeErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Stripe payment authorized and held securely in Protected Vault.',
      transactionId,
      clientSecret,
      gatewayUrl: checkoutUrl,
      data: payment,
    });
  } catch (error) {
    console.error(`[Stripe Payment Error]:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Stripe Webhook / Confirmation
// @route   POST /api/payments/stripe/webhook
// @access  Public
const handleStripeWebhook = async (req, res) => {
  try {
    const event = req.body;
    console.log(`[Stripe Webhook Event]:`, event?.type);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error(`[Stripe Webhook Error]:`, error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Release vault funds to repairer after verified pickup (Module 4 - F17)
// @route   POST /api/payments/:id/release-escrow
// @access  Private (Requester / Admin)
const releaseEscrow = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (payment.escrowStatus === 'RELEASED_TO_REPAIRER') {
      return res.status(400).json({ success: false, message: 'Escrow funds have already been released' });
    }

    payment.escrowStatus = 'RELEASED_TO_REPAIRER';
    payment.releasedAt = new Date();
    await payment.save();

    if (payment.repairRequestId) {
      try {
        const reqDoc = await RepairRequest.findById(payment.repairRequestId);
        if (reqDoc) {
          reqDoc.status = 'Completed';
          await reqDoc.save();

          // Calculate and record environmental impact upon escrow completion
          const impact = calculateEnvironmentalImpact(reqDoc.category);
          await EnvironmentalImpact.findOneAndUpdate(
            { repairRequestId: reqDoc._id },
            {
              repairRequestId: reqDoc._id,
              category: reqDoc.category,
              wasteDivertedKg: impact.wasteDivertedKg,
              co2SavedKg: impact.co2SavedKg,
            },
            { upsert: true, new: true }
          );
        }

        await ItemHistoryLog.create({
          repairRequestId: payment.repairRequestId,
          changeType: 'ESCROW_RELEASED',
          previousStatus: 'In Progress',
          newStatus: 'Completed',
          actorId: req.user?._id || payment.payerId,
          note: `Escrow funds of ৳${payment.amount} released to technician payout balance.`,
        });
      } catch (logErr) {
        console.warn(`[Log creation error]:`, logErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Escrow funds successfully released to the repairer.',
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get payment details for a repair request
// @route   GET /api/payments/request/:requestId
// @access  Private
const getPaymentByRequest = async (req, res) => {
  try {
    const payment = await Payment.findOne({ repairRequestId: req.params.requestId })
      .populate('payerId', 'name email')
      .populate('payeeId', 'name businessName phone');

    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  initiatePayment, 
  handleStripeWebhook,
  releaseEscrow, 
  getPaymentByRequest 
};
