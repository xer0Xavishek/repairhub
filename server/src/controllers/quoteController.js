const Quote = require('../models/Quote');
const RepairRequest = require('../models/RepairRequest');
const ItemHistoryLog = require('../models/ItemHistoryLog');

// @desc    Submit a quote for a repair request (Module 4 - F15 / F22)
// @route   POST /api/quotes
// @access  Private (Repairer)
const submitQuote = async (req, res) => {
  try {
    const { repairRequestId, price, estimatedDays, message } = req.body;

    if (!repairRequestId || price === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide repair request ID and price' });
    }

    const request = await RepairRequest.findById(repairRequestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Repair request not found' });
    }

    if (request.requesterId && req.user?._id && request.requesterId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Technicians cannot bid or quote on their own repair requests' });
    }

    if (request.status === 'Completed' || request.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot quote on an order that is already completed or cancelled' });
    }

    if (request.assignedRepairerId) {
      return res.status(400).json({ success: false, message: 'This repair order has already been assigned to another technician' });
    }

    const quote = await Quote.create({
      repairRequestId,
      repairerId: req.user._id,
      price: Number(price),
      estimatedDays: Number(estimatedDays) || 2,
      message: message || '',
      status: 'Pending',
    });

    // Update repair request status to Quoted if it was Requested
    if (request.status === 'Requested') {
      request.status = 'Quoted';
      request.estimatedPrice = price;
      await request.save();
    }

    await ItemHistoryLog.create({
      repairRequestId,
      changeType: 'QUOTE_SUBMITTED',
      previousStatus: request.status,
      newStatus: request.status,
      actorId: req.user._id,
      note: `Quote submitted: ৳${price} (Est: ${estimatedDays || 2} days) by ${req.user.name}`,
    });

    res.status(201).json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get quotes for a repair request
// @route   GET /api/quotes/request/:requestId
// @access  Private
const getQuotesForRequest = async (req, res) => {
  try {
    const quotes = await Quote.find({ repairRequestId: req.params.requestId })
      .populate('repairerId', 'name businessName rating ratingCount isVerified phone address')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: quotes.length, data: quotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept a quote and auto-reject competing quotes (Module 4 - F15)
// @route   PUT /api/quotes/:id/accept
// @access  Private (Requester)
const acceptQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    const request = await RepairRequest.findById(quote.repairRequestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Associated repair request not found' });
    }

    // Verify requester ownership
    if (request.requesterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to accept quotes for this request' });
    }

    quote.status = 'Accepted';
    await quote.save();

    // Assign repairer, set final price, and advance status to In Progress
    const previousStatus = request.status;
    request.assignedRepairerId = quote.repairerId;
    request.finalPrice = quote.price;
    request.status = 'In Progress';
    await request.save();

    // Auto-reject other pending quotes for this request
    await Quote.updateMany(
      { repairRequestId: request._id, _id: { $ne: quote._id }, status: 'Pending' },
      { status: 'Rejected' }
    );

    await ItemHistoryLog.create({
      repairRequestId: request._id,
      changeType: 'QUOTE_ACCEPTED',
      previousStatus,
      newStatus: 'In Progress',
      actorId: req.user._id,
      note: `Quote of ৳${quote.price} accepted. Assigned to repairer. Status advanced to In Progress.`,
    });

    res.json({ success: true, message: 'Quote accepted successfully', data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitQuote, getQuotesForRequest, acceptQuote };
