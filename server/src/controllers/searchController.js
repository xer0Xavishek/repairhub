const User = require('../models/User');
const RepairRequest = require('../models/RepairRequest');
const RepairCafeEvent = require('../models/RepairCafeEvent');

// @desc    Global multi-parameter search (Module 2 - F10)
// @route   GET /api/search
// @access  Public
const globalSearch = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, status, type } = req.query;

    const regex = query ? new RegExp(query, 'i') : null;
    const results = {
      repairers: [],
      requests: [],
      events: [],
    };

    // 1. Search Repairers
    if (!type || type === 'all' || type === 'repairers') {
      const repFilter = { role: 'repairer' };
      if (regex) {
        repFilter.$or = [
          { name: regex },
          { businessName: regex },
          { bio: regex },
          { address: regex },
          { categories: regex },
        ];
      }
      if (category && category !== 'All') {
        repFilter.categories = { $in: [category] };
      }
      if (maxPrice) {
        repFilter.priceRangeMin = { $lte: Number(maxPrice) };
      }
      results.repairers = await User.find(repFilter).select('-passwordHash').limit(15);
    }

    // 2. Search Repair Requests
    if (!type || type === 'all' || type === 'requests') {
      const reqFilter = {};
      if (regex) {
        reqFilter.$or = [
          { itemTitle: regex },
          { issueDescription: regex },
          { ticketNumber: regex },
        ];
      }
      if (category && category !== 'All') {
        reqFilter.category = category;
      }
      if (status && status !== 'All') {
        reqFilter.status = status;
      }
      results.requests = await RepairRequest.find(reqFilter)
        .populate('requesterId', 'name email')
        .populate('assignedRepairerId', 'name businessName')
        .limit(15);
    }

    // 3. Search Repair Cafe Events
    if (!type || type === 'all' || type === 'events') {
      const eventFilter = {};
      if (regex) {
        eventFilter.$or = [
          { title: regex },
          { description: regex },
          { venue: regex },
        ];
      }
      if (category && category !== 'All') {
        eventFilter.categories = { $in: [category] };
      }
      results.events = await RepairCafeEvent.find(eventFilter).limit(15);
    }

    const totalCount = results.repairers.length + results.requests.length + results.events.length;

    res.json({
      success: true,
      totalCount,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { globalSearch };
