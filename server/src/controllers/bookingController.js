const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Waitlist = require('../models/Waitlist');
const User = require('../models/User');
const Review = require('../models/Review');

// @desc    Create appointment booking (Module 2 - F08)
// @route   POST /api/bookings
// @access  Private (Requester)
const createBooking = async (req, res) => {
  try {
    // Item 17: Workshops or freelancers should not be able to book any appointment slot
    const userRole = (req.user?.role || '').toLowerCase();
    if (userRole === 'repairer') {
      return res.status(403).json({
        success: false,
        message: 'Technicians, workshops, and freelancers cannot book diagnostic appointment slots. Appointment booking is reserved for customers.',
      });
    }

    let { repairerId, repairRequestId, scheduledTime, durationMinutes, type, notes } = req.body;

    if (!repairerId || !scheduledTime) {
      return res.status(400).json({ success: false, message: 'Please specify repairer and scheduled time' });
    }

    // Flexible repairer resolution: accept valid ObjectId, or resolve by name, businessName, email or fallback
    let targetRepairerId = repairerId;
    if (mongoose.Types.ObjectId.isValid(repairerId)) {
      const rep = await User.findById(repairerId);
      if (rep) targetRepairerId = rep._id;
    } else {
      const rep = await User.findOne({
        $or: [
          { businessName: new RegExp(String(repairerId).replace(/[^a-zA-Z0-9 ]/g, ''), 'i') },
          { name: new RegExp(String(repairerId).replace(/[^a-zA-Z0-9 ]/g, ''), 'i') },
          { email: 'rafiq@repairhub.com' },
          { role: 'repairer' },
        ],
      });
      if (rep) {
        targetRepairerId = rep._id;
      }
    }

    const scheduledDate = new Date(scheduledTime);

    // Validation: Cannot book time slots that have already passed (Bug 8)
    if (scheduledDate.getTime() < (Date.now() - 2 * 60 * 1000)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book an appointment for a time slot that has already passed.',
      });
    }

    // 1. Prevent double booking for the customer at the same time (same shop or different shop - Bug 1 & 3)
    const customerConflict = await Booking.findOne({
      requesterId: req.user._id,
      status: { $in: ['Pending', 'Confirmed', 'Rescheduled'] },
      scheduledTime: {
        $gte: new Date(scheduledDate.getTime() - 45 * 60000),
        $lte: new Date(scheduledDate.getTime() + 45 * 60000),
      },
    });

    if (customerConflict) {
      return res.status(409).json({
        success: false,
        conflictType: 'CUSTOMER_TIME_CONFLICT',
        message: 'You already have an appointment scheduled at this time. You cannot book two repairs at the same time on the same day.',
        canJoinWaitlist: true,
      });
    }

    // 2. Prevent double booking for the same technician at the same time slot (within duration)
    const existingBooking = await Booking.findOne({
      repairerId: targetRepairerId,
      status: { $in: ['Pending', 'Confirmed', 'Rescheduled'] },
      scheduledTime: {
        $gte: new Date(scheduledDate.getTime() - 45 * 60000),
        $lte: new Date(scheduledDate.getTime() + 45 * 60000),
      },
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        conflictType: 'SHOP_SLOT_FULL',
        message: 'This time slot is already booked for this technician. You may join the waitlist.',
        canJoinWaitlist: true,
      });
    }

    const booking = await Booking.create({
      requesterId: req.user._id,
      repairerId: targetRepairerId,
      repairRequestId: repairRequestId || null,
      scheduledTime: scheduledDate,
      durationMinutes: durationMinutes || 60,
      type: type || 'In-Shop Diagnostic',
      notes: notes || '',
      status: 'Confirmed',
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings for current user (Requester or Repairer)
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'repairer') {
      filter.repairerId = req.user._id;
    } else {
      filter.requesterId = req.user._id;
    }

    const bookings = await Booking.find(filter)
      .populate('requesterId', 'name email phone')
      .populate('repairerId', 'name businessName phone address location startingRate priceRangeMin')
      .populate('repairRequestId', 'itemTitle ticketNumber status')
      .sort({ scheduledTime: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reschedule booking to a new time slot (Module 2 - F08)
// @route   PUT /api/bookings/:id/reschedule
// @access  Private
const rescheduleBooking = async (req, res) => {
  try {
    const { newScheduledTime } = req.body;
    if (!newScheduledTime) {
      return res.status(400).json({ success: false, message: 'Please provide newScheduledTime' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify ownership
    if (
      booking.requesterId.toString() !== req.user._id.toString() &&
      booking.repairerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to reschedule this booking' });
    }

    const newDate = new Date(newScheduledTime);

    // Check conflict for the customer on the new slot (Bug 1 & 3)
    const customerConflict = await Booking.findOne({
      _id: { $ne: booking._id },
      requesterId: booking.requesterId,
      status: { $in: ['Pending', 'Confirmed', 'Rescheduled'] },
      scheduledTime: {
        $gte: new Date(newDate.getTime() - 45 * 60000),
        $lte: new Date(newDate.getTime() + 45 * 60000),
      },
    });

    if (customerConflict) {
      return res.status(409).json({
        success: false,
        conflictType: 'CUSTOMER_TIME_CONFLICT',
        message: 'You already have another appointment scheduled at this time. You cannot book two repairs at the same time on the same day.',
      });
    }

    // Check conflict on the new slot for the workshop
    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      repairerId: booking.repairerId,
      status: { $in: ['Pending', 'Confirmed', 'Rescheduled'] },
      scheduledTime: {
        $gte: new Date(newDate.getTime() - 45 * 60000),
        $lte: new Date(newDate.getTime() + 45 * 60000),
      },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        conflictType: 'SHOP_SLOT_FULL',
        message: 'The requested new time slot is unavailable for this workshop. Please select another slot.',
      });
    }

    booking.scheduledTime = newDate;
    booking.status = 'Rescheduled';
    await booking.save();

    res.json({ success: true, message: 'Booking successfully rescheduled', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel booking & promote waitlist candidate (Module 2 - F08, F09)
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify ownership
    if (
      booking.requesterId.toString() !== req.user._id.toString() &&
      booking.repairerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Check if there is any candidate in the waitlist for this technician
    const nextInWaitlist = await Waitlist.findOne({
      repairerId: booking.repairerId,
      status: 'Waiting',
    }).sort({ queuePosition: 1, createdAt: 1 });

    let promotedCandidate = null;
    if (nextInWaitlist) {
      nextInWaitlist.status = 'Promoted';
      await nextInWaitlist.save();
      promotedCandidate = nextInWaitlist;
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully and slot released',
      data: booking,
      promotedWaitlistCandidate: promotedCandidate,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Join technician appointment waitlist (Module 2 - F09)
// @route   POST /api/bookings/waitlist
// @access  Private
const joinWaitlist = async (req, res) => {
  try {
    const { repairerId, requestedDate, preferredSlot, notes } = req.body;
    if (!repairerId || !requestedDate) {
      return res.status(400).json({ success: false, message: 'Please specify repairerId and requestedDate' });
    }

    // Count existing active queue
    const currentQueueCount = await Waitlist.countDocuments({
      repairerId,
      status: 'Waiting',
    });

    const waitlistEntry = await Waitlist.create({
      userId: req.user._id,
      repairerId,
      requestedDate: new Date(requestedDate),
      preferredSlot: preferredSlot || 'Any',
      queuePosition: currentQueueCount + 1,
      notes: notes || '',
      status: 'Waiting',
    });

    res.status(201).json({
      success: true,
      message: `Successfully joined waitlist at queue position #${waitlistEntry.queuePosition}`,
      data: waitlistEntry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get waitlist for technician
// @route   GET /api/bookings/waitlist/:repairerId
// @access  Private
const getWaitlist = async (req, res) => {
  try {
    const entries = await Waitlist.find({
      repairerId: req.params.repairerId,
      status: 'Waiting',
    })
      .populate('userId', 'name email phone')
      .sort({ queuePosition: 1 });

    res.json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search and filter repairers with geolocation (Module 2 - F06, F07)
// @route   GET /api/bookings/repairers
// @access  Public
const searchRepairers = async (req, res) => {
  try {
    const { lat, lng, radiusKm, category, minRating, maxPrice } = req.query;
    const query = { role: 'repairer' };

    if (category && category !== 'All') {
      query.categories = { $in: [category] };
    }
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }
    if (maxPrice) {
      query.priceRangeMin = { $lte: Number(maxPrice) };
    }

    if (lat && lng) {
      const radiusInMeters = (Number(radiusKm) || 10) * 1000;
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: radiusInMeters,
        },
      };
    }

    const repairers = await User.find(query).select('-passwordHash').limit(50);
    const enriched = await Promise.all(
      repairers.map(async (u) => {
        const reviews = await Review.find({ repairerId: u._id });
        const realCount = reviews.length;
        const realRating = realCount > 0
          ? Number((reviews.reduce((sum, r) => sum + (Number(r.averageRating || r.rating) || 0), 0) / realCount).toFixed(1))
          : 0;
        const uObj = u.toObject();
        uObj.rating = realRating;
        uObj.ratingCount = realCount;
        return uObj;
      })
    );
    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dynamic time slot availability for a workshop on a given date (Bug 2)
// @route   GET /api/bookings/availability
// @access  Public / Private
const getWorkshopSlotAvailability = async (req, res) => {
  try {
    const { repairerId, date } = req.query;
    if (!repairerId || !date) {
      return res.status(400).json({ success: false, message: 'Please specify repairerId and date' });
    }

    let targetRepairerId = repairerId;
    if (mongoose.Types.ObjectId.isValid(repairerId)) {
      const rep = await User.findById(repairerId);
      if (rep) targetRepairerId = rep._id;
    } else {
      const rep = await User.findOne({
        $or: [
          { businessName: new RegExp(String(repairerId).replace(/[^a-zA-Z0-9 ]/g, ''), 'i') },
          { name: new RegExp(String(repairerId).replace(/[^a-zA-Z0-9 ]/g, ''), 'i') },
          { role: 'repairer' },
        ],
      });
      if (rep) targetRepairerId = rep._id;
    }

    // Parse date (YYYY-MM-DD)
    const [year, month, day] = date.split('-').map(Number);
    const dayStart = new Date(year, month - 1, day, 0, 0, 0);
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

    const existingBookings = await Booking.find({
      repairerId: targetRepairerId,
      status: { $in: ['Pending', 'Confirmed', 'Rescheduled'] },
      scheduledTime: { $gte: dayStart, $lte: dayEnd },
    });

    // 3 standard diagnostic slots
    const standardSlots = [
      { id: 'morning', label: '10:00 AM – 11:30 AM', period: 'Morning Diagnostic', startHour: 10, startMin: 0 },
      { id: 'afternoon', label: '02:00 PM – 03:30 PM', period: 'Afternoon Diagnostic', startHour: 14, startMin: 0 },
      { id: 'evening', label: '05:00 PM – 06:30 PM', period: 'Evening Diagnostic', startHour: 17, startMin: 0 },
    ];

    const slots = standardSlots.map((slot) => {
      const slotTime = new Date(year, month - 1, day, slot.startHour, slot.startMin, 0);
      const isBooked = existingBookings.some((b) => {
        const bt = new Date(b.scheduledTime).getTime();
        return Math.abs(bt - slotTime.getTime()) <= 45 * 60000;
      });

      return {
        id: slot.id,
        label: slot.label,
        period: slot.period,
        isBooked,
      };
    });

    // Also fetch alternative workshops open at that date if a slot is full (Bug 9)
    const otherRepairers = await User.find({
      role: 'repairer',
      _id: { $ne: targetRepairerId },
    }).select('name businessName address rating startingRate priceRangeMin').limit(5);

    res.json({
      success: true,
      repairerId: targetRepairerId,
      date,
      slots,
      alternativeRepairers: otherRepairers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  rescheduleBooking,
  cancelBooking,
  joinWaitlist,
  getWaitlist,
  searchRepairers,
  getWorkshopSlotAvailability,
};
