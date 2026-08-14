const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RepairRequest = require('../models/RepairRequest');
const Quote = require('../models/Quote');
const ItemHistoryLog = require('../models/ItemHistoryLog');
const EnvironmentalImpact = require('../models/EnvironmentalImpact');
const Review = require('../models/Review');
const { generateTicketNumber, generateQRCodeDataURL } = require('../utils/qrHelper');
const { calculateEnvironmentalImpact } = require('../utils/impactCalculator');

// Valid state machine transitions
const ALLOWED_TRANSITIONS = {
  Requested: ['Quoted', 'Cancelled'],
  Quoted: ['In Progress', 'Cancelled'],
  'In Progress': ['Ready for Pickup', 'Cancelled'],
  'Ready for Pickup': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

// @desc    Create a new repair request (Module 1 - F01, F02, F03, F05)
// @route   POST /api/repairs
// @access  Private (Requester)
const createRepairRequest = async (req, res) => {
  try {
    const { itemTitle, itemDescription, category, subCategory, photos, issueDescription, preferredMethod, location } =
      req.body;

    if (!itemTitle || !itemDescription || !category || !issueDescription) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const ticketNumber = generateTicketNumber();
    const qrPayload = {
      ticketNumber,
      requesterId: req.user._id,
      timestamp: Date.now(),
    };
    const qrCode = await generateQRCodeDataURL(qrPayload);

    const repairRequest = await RepairRequest.create({
      ticketNumber,
      requesterId: req.user._id,
      itemTitle,
      itemDescription,
      category,
      subCategory: subCategory || 'General',
      photos: photos || [],
      issueDescription,
      preferredMethod: preferredMethod || 'drop-off',
      status: 'Requested',
      qrCode,
      location: location || { type: 'Point', coordinates: [90.4125, 23.8103], address: 'Dhaka' },
    });

    // Create immutable history log entry
    await ItemHistoryLog.create({
      repairRequestId: repairRequest._id,
      changeType: 'REQUEST_CREATED',
      previousStatus: '',
      newStatus: 'Requested',
      actorId: req.user._id,
      note: `Repair request submitted for ${itemTitle} (${category}) with Ticket: ${ticketNumber}`,
    });

    res.status(201).json({ success: true, data: repairRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all repair requests (with optional filters)
// @route   GET /api/repairs
// @access  Public / Private
const getRepairRequests = async (req, res) => {
  try {
    let { category, status, requesterId, repairerId, mine } = req.query;
    const filter = {};

    // Support token-based user resolution if requesting 'mine' or 'me'
    let resolvedUser = req.user;
    if (!resolvedUser && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      if (token.startsWith('demo_')) {
        const demoKey = token.replace('demo_', '').toLowerCase();
        const emailMap = {
          customer: 'avishek@bracu.ac.bd',
          technician: 'rafiq@repairhub.com',
          workshop: 'rafiq@repairhub.com',
          freelance: 'bikedoctor@repairhub.com',
          freelancer: 'bikedoctor@repairhub.com',
          admin: 'admin@repairhub.com',
        };
        const targetEmail = emailMap[demoKey] || 'avishek@bracu.ac.bd';
        resolvedUser = await User.findOne({ email: targetEmail });
      } else {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'repairhub_super_secret_jwt_key_2026');
          resolvedUser = await User.findById(decoded.id);
        } catch (e) {}
      }
    }

    // Role-based customer isolation: If authenticated caller is a customer/requester,
    // they can ONLY EVER query and see their own repair requests.
    if (resolvedUser && (resolvedUser.role === 'requester' || resolvedUser.role === 'Customer')) {
      filter.requesterId = resolvedUser._id;
    } else if (requesterId === 'me' || requesterId === 'mine' || mine === 'true') {
      if (resolvedUser) {
        filter.requesterId = resolvedUser._id;
      } else {
        // Unauthenticated request for 'me' must never return all requests
        filter.requesterId = new mongoose.Types.ObjectId();
      }
    } else if (requesterId) {
      if (requesterId === 'user_avishek' || requesterId === 'demo_customer') {
        const demoUser = await User.findOne({ email: 'avishek@bracu.ac.bd' });
        filter.requesterId = demoUser ? demoUser._id : new mongoose.Types.ObjectId();
      } else if (mongoose.Types.ObjectId.isValid(requesterId)) {
        filter.requesterId = requesterId;
      } else {
        // Non-matching or unknown requesterId string returns empty, not all requests
        filter.requesterId = new mongoose.Types.ObjectId();
      }
    }

    if (repairerId) {
      if (repairerId === 'rep_01' || repairerId === 'demo_workshop') {
        const demoRepairer = await User.findOne({ email: 'rafiq@repairhub.com' });
        filter.assignedRepairerId = demoRepairer ? demoRepairer._id : new mongoose.Types.ObjectId();
      } else if (repairerId === 'rep_02' || repairerId === 'demo_freelance') {
        const demoRepairer = await User.findOne({ email: 'bikedoctor@repairhub.com' });
        filter.assignedRepairerId = demoRepairer ? demoRepairer._id : new mongoose.Types.ObjectId();
      } else if (mongoose.Types.ObjectId.isValid(repairerId)) {
        filter.assignedRepairerId = repairerId;
      } else {
        filter.assignedRepairerId = new mongoose.Types.ObjectId();
      }
    } else if (resolvedUser && (resolvedUser.role === 'repairer' || resolvedUser.role === 'Repairer')) {
      // If a technician queries repairs without specifying requesterId or repairerId,
      // scope to requests assigned to them OR open requests awaiting quotes (excluding any requests they explicitly declined)
      if (!requesterId) {
        filter.$or = [
          { assignedRepairerId: resolvedUser._id },
          {
            status: { $in: ['Requested', 'Quoted'] },
            assignedRepairerId: { $in: [null, undefined] },
            repairerResponses: {
              $not: {
                $elemMatch: {
                  repairerId: resolvedUser._id,
                  decision: 'rejected',
                },
              },
            },
          },
        ];
      }
    }

    if (category) filter.category = category;
    if (status) filter.status = status;

    const requests = await RepairRequest.find(filter)
      .populate('requesterId', 'name email phone')
      .populate('assignedRepairerId', 'name businessName rating ratingCount')
      .sort({ createdAt: -1 });

    // Enrich requests with real quotes/bids from Quote collection
    const requestIds = requests.map((r) => r._id);
    const quotes = await Quote.find({ repairRequestId: { $in: requestIds } })
      .populate('repairerId', 'name businessName rating ratingCount isVerified phone address')
      .lean();

    const quotesMap = {};
    quotes.forEach((q) => {
      const idStr = q.repairRequestId.toString();
      if (!quotesMap[idStr]) quotesMap[idStr] = [];
      quotesMap[idStr].push(q);
    });

    const reviews = await Review.find({ repairRequestId: { $in: requestIds } })
      .select('repairRequestId qualityRating averageRating comment')
      .lean();
    const reviewsMap = {};
    reviews.forEach((rev) => {
      reviewsMap[rev.repairRequestId.toString()] = rev;
    });

    const enrichedRequests = requests.map((r) => {
      const rObj = r.toObject ? r.toObject() : { ...r._doc };
      rObj.bids = quotesMap[r._id.toString()] || [];
      rObj.hasReviewed = !!reviewsMap[r._id.toString()];
      rObj.review = reviewsMap[r._id.toString()] || null;
      return rObj;
    });

    res.json({ success: true, count: enrichedRequests.length, data: enrichedRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single repair request by ID
// @route   GET /api/repairs/:id
// @access  Private
const getRepairRequestById = async (req, res) => {
  try {
    const request = await RepairRequest.findById(req.params.id)
      .populate('requesterId', 'name email phone')
      .populate('assignedRepairerId', 'name businessName rating ratingCount phone');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Repair request not found' });
    }

    const quotes = await Quote.find({ repairRequestId: request._id })
      .populate('repairerId', 'name businessName rating ratingCount isVerified phone address')
      .lean();

    const rObj = request.toObject ? request.toObject() : { ...request._doc };
    rObj.bids = quotes;

    res.json({ success: true, data: rObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update status along the 5-Stage Pipeline (Module 1 - F04, F05)
// @route   PUT /api/repairs/:id/status
// @access  Private
const updateRepairStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const request = await RepairRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Repair request not found' });
    }

    const currentStatus = request.status;
    const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition from '${currentStatus}' to '${status}'. Allowed: [${allowedNextStatuses.join(
          ', '
        )}]`,
      });
    }

    request.status = status;
    await request.save();

    // Map change type
    let changeType = 'STATUS_UPDATED';
    if (status === 'In Progress') changeType = 'REPAIR_STARTED';
    if (status === 'Ready for Pickup') changeType = 'READY_FOR_PICKUP';
    if (status === 'Completed') {
      changeType = 'ITEM_PICKED_UP';
      // Automatically calculate and record environmental impact upon completion
      const impact = calculateEnvironmentalImpact(request.category);
      await EnvironmentalImpact.findOneAndUpdate(
        { repairRequestId: request._id },
        {
          repairRequestId: request._id,
          category: request.category,
          wasteDivertedKg: impact.wasteDivertedKg,
          co2SavedKg: impact.co2SavedKg,
        },
        { upsert: true, new: true }
      );
    }
    if (status === 'Cancelled') changeType = 'REQUEST_CANCELLED';

    // Log immutable history
    await ItemHistoryLog.create({
      repairRequestId: request._id,
      changeType,
      previousStatus: currentStatus,
      newStatus: status,
      actorId: req.user._id,
      note: note || `Status transitioned from ${currentStatus} to ${status}`,
    });

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify QR token for physical drop-off or pickup handover (Module 1 - F03)
// @route   POST /api/repairs/:id/verify-qr
// @access  Private (Repairer)
const verifyQRHandover = async (req, res) => {
  try {
    const { ticketNumber, scanType } = req.body; // scanType: 'dropoff' | 'drop-off' | 'pickup'
    const request = await RepairRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Repair request not found' });
    }

    if (request.ticketNumber !== ticketNumber) {
      return res.status(400).json({ success: false, message: 'Invalid ticket number or QR payload' });
    }

    const normalizedScanType = (scanType || '').replace('-', '').toLowerCase();

    if (normalizedScanType === 'dropoff') {
      request.dropoffVerified = true;
      if (request.status === 'Quoted' || request.status === 'Requested') {
        request.status = 'In Progress';
      }
      await request.save();

      await ItemHistoryLog.create({
        repairRequestId: request._id,
        changeType: 'ITEM_DROPPED_OFF',
        previousStatus: request.status,
        newStatus: request.status,
        actorId: req.user._id,
        note: `Physical drop-off verified via QR token: ${ticketNumber}`,
      });
    } else if (normalizedScanType === 'pickup') {
      request.pickupVerified = true;
      request.status = 'Completed';
      await request.save();

      // Compute CO2 and e-waste impact
      const impact = calculateEnvironmentalImpact(request.category);
      await EnvironmentalImpact.findOneAndUpdate(
        { repairRequestId: request._id },
        {
          repairRequestId: request._id,
          category: request.category,
          wasteDivertedKg: impact.wasteDivertedKg,
          co2SavedKg: impact.co2SavedKg,
        },
        { upsert: true, new: true }
      );

      await ItemHistoryLog.create({
        repairRequestId: request._id,
        changeType: 'ITEM_PICKED_UP',
        previousStatus: 'Ready for Pickup',
        newStatus: 'Completed',
        actorId: req.user._id,
        note: `Physical pickup verified via QR token: ${ticketNumber}. Repair completed.`,
      });
    }

    res.json({ success: true, message: `QR ${scanType} verification successful`, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get immutable item history log for a request (Module 1 - F05)
// @route   GET /api/repairs/:id/history
// @access  Private
const getItemHistoryLog = async (req, res) => {
  try {
    let history = await ItemHistoryLog.find({ repairRequestId: req.params.id })
      .populate('actorId', 'name role')
      .sort({ timestamp: 1 });

    // Item 13: For repairer POV, repairer should only see the requester's request, their own bidding,
    // escrow funds secured, status transitions, etc. A repairer should not be able to see what
    // other repairers bid or if they have bid.
    const userRole = (req.user?.role || '').toLowerCase();
    if (userRole === 'repairer') {
      const currentUserIdStr = req.user._id.toString();
      history = history.filter((item) => {
        if (item.changeType === 'QUOTE_SUBMITTED') {
          const actorIdStr = item.actorId?._id?.toString() || item.actorId?.toString();
          return actorIdStr === currentUserIdStr;
        }
        return true;
      });
    }

    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get available repair requests for repairers to bid on (Module 1 / Module 4)
// @route   GET /api/repairs/available
// @access  Private (Repairer)
const getAvailableRepairRequests = async (req, res) => {
  try {
    const filter = {
      status: { $in: ['Requested', 'Quoted'] },
      assignedRepairerId: null,
    };

    // If technician, filter out requests they have explicitly rejected
    if (req.user && req.user._id) {
      filter.repairerResponses = {
        $not: {
          $elemMatch: {
            repairerId: req.user._id,
            decision: 'rejected',
          },
        },
      };
    }

    const requests = await RepairRequest.find(filter)
      .populate('requesterId', 'name email phone address')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept or reject an available repair request (Module 1 / Module 4)
// @route   PUT /api/repairs/:id/decision
// @access  Private (Repairer)
const respondToRepairRequest = async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    if (userRole !== 'repairer' && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only repairers can respond to requests' });
    }

    const { decision } = req.body;
    if (!['accepted', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: "Decision must be 'accepted' or 'rejected'" });
    }

    const request = await RepairRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Repair request not found' });
    }
    if (
      !['Requested', 'Quoted'].includes(request.status) ||
      (request.assignedRepairerId && request.assignedRepairerId.toString() !== req.user._id.toString())
    ) {
      return res.status(409).json({ success: false, message: 'This repair request is no longer available' });
    }

    if (!request.repairerResponses) request.repairerResponses = [];
    const existingResponse = request.repairerResponses.find(
      (response) => response.repairerId.toString() === req.user._id.toString()
    );

    if (existingResponse) {
      existingResponse.decision = decision;
      existingResponse.respondedAt = new Date();
    } else {
      request.repairerResponses.push({ repairerId: req.user._id, decision, respondedAt: new Date() });
    }
    await request.save();

    // Create immutable audit history log (Module 1 - FR-05)
    await ItemHistoryLog.create({
      repairRequestId: request._id,
      changeType: 'STATUS_UPDATED',
      previousStatus: request.status,
      newStatus: request.status,
      actorId: req.user._id,
      note: `Technician ${req.user.name || 'Technician'} ${decision} the repair request.`,
    });

    res.json({ success: true, message: `Repair request ${decision}`, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRepairRequest,
  getRepairRequests,
  getRepairRequestById,
  getAvailableRepairRequests,
  respondToRepairRequest,
  updateRepairStatus,
  verifyQRHandover,
  getItemHistoryLog,
};

