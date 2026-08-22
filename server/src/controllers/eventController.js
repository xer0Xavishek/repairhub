const RepairCafeEvent = require('../models/RepairCafeEvent');

// @desc    Create a Repair Cafe Event (Module 3 - F11)
// @route   POST /api/events
// @access  Private (Organizer / Admin)
const createEvent = async (req, res) => {
  try {
    // RBAC: Bug 10 - Customer and freelancer cannot host a repair cafe; only workshops can
    const isCustomer = req.user.role === 'requester';
    const isFreelance = req.user.technicianType === 'freelance';
    if (isCustomer || isFreelance) {
      return res.status(403).json({
        success: false,
        message: 'Only verified repair workshops can host community repair cafes. Customers and freelance fixers are not eligible.',
      });
    }

    const { title, description, date, startTime, endTime, venueName, address, coordinates, capacity, categoriesHandled } =
      req.body;

    if (!title || !description || !date || !capacity) {
      return res.status(400).json({ success: false, message: 'Please provide all required event details' });
    }

    const event = await RepairCafeEvent.create({
      organizerId: req.user._id,
      title,
      description,
      date: new Date(date),
      startTime: startTime || '10:00 AM',
      endTime: endTime || '04:00 PM',
      capacity: Number(capacity) || 30,
      categoriesHandled: categoriesHandled || ['Electronics', 'Home Appliances', 'Clothing/Textiles', 'Bicycles'],
      location: {
        type: 'Point',
        coordinates: coordinates || [90.4125, 23.8103],
        venueName: venueName || 'Local Community Center',
        address: address || 'Dhaka',
      },
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all events (Module 3 - F11)
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const events = await RepairCafeEvent.find()
      .populate('organizerId', 'name email')
      .sort({ date: 1 });

    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    RSVP to an event with capacity & waitlist management (Module 3 - F12)
// @route   POST /api/events/:id/rsvp
// @access  Private (Requester / Volunteer)
const rsvpEvent = async (req, res) => {
  try {
    const event = await RepairCafeEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const userId = req.user._id;

    // Check if user already RSVP'd or on waitlist
    const existingRsvp = event.rsvps.find((r) => r.userId.toString() === userId.toString());
    const existingWaitlist = event.waitlist.find((w) => w.userId.toString() === userId.toString());

    if (existingRsvp || existingWaitlist) {
      return res.status(400).json({ success: false, message: 'You have already registered for this event' });
    }

    const attendingCount = event.rsvps.filter((r) => r.status === 'Attending').length;

    if (attendingCount >= event.capacity) {
      // Event is full -> place on FIFO waitlist
      const position = event.waitlist.length + 1;
      event.waitlist.push({ userId, position, joinedAt: new Date() });
      await event.save();

      return res.status(200).json({
        success: true,
        message: `Event is currently at full capacity. You have been added to the waitlist at position #${position}`,
        isWaitlisted: true,
        position,
        data: event,
      });
    }

    // Capacity available -> confirm RSVP
    event.rsvps.push({ userId, status: 'Attending', respondedAt: new Date() });
    await event.save();

    res.status(200).json({
      success: true,
      message: 'RSVP confirmed! We look forward to seeing you at the Repair Café.',
      isWaitlisted: false,
      data: event,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel RSVP and automatically promote waitlist entry #1 (Module 3 - F12)
// @route   DELETE /api/events/:id/rsvp
// @access  Private
const cancelRsvp = async (req, res) => {
  try {
    const event = await RepairCafeEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const userId = req.user._id;
    const initialRsvpIndex = event.rsvps.findIndex((r) => r.userId.toString() === userId.toString());

    if (initialRsvpIndex !== -1) {
      // Remove from RSVPs
      event.rsvps.splice(initialRsvpIndex, 1);

      // Automated Waitlist Promotion: If waitlist has users, promote #1
      let promotedUser = null;
      if (event.waitlist.length > 0) {
        const nextInLine = event.waitlist.shift(); // Remove position #1
        event.rsvps.push({ userId: nextInLine.userId, status: 'Attending', respondedAt: new Date() });
        promotedUser = nextInLine.userId;

        // Recalculate remaining waitlist positions
        event.waitlist.forEach((w, idx) => {
          w.position = idx + 1;
        });
      }

      await event.save();

      return res.json({
        success: true,
        message: 'RSVP cancelled successfully',
        promotedWaitlistUser: promotedUser,
        data: event,
      });
    }

    // Check if was in waitlist
    const waitlistIndex = event.waitlist.findIndex((w) => w.userId.toString() === userId.toString());
    if (waitlistIndex !== -1) {
      event.waitlist.splice(waitlistIndex, 1);
      // Re-index positions
      event.waitlist.forEach((w, idx) => {
        w.position = idx + 1;
      });
      await event.save();
      return res.json({ success: true, message: 'Removed from waitlist', data: event });
    }

    res.status(400).json({ success: false, message: 'No active RSVP found for this event' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createEvent, getEvents, rsvpEvent, cancelRsvp };
