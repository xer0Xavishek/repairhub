const EnvironmentalImpact = require('../models/EnvironmentalImpact');
const RepairRequest = require('../models/RepairRequest');
const { calculateEnvironmentalImpact, IMPACT_COEFFICIENTS } = require('../utils/impactCalculator');

// @desc    Get global environmental impact metrics (Module 3 - F13)
// @route   GET /api/impact/global
// @access  Public
const getGlobalImpact = async (req, res) => {
  try {
    // Backfill any completed repair request that may be missing an impact document
    const completedRequests = await RepairRequest.find({ status: 'Completed' }).select('_id category');
    if (completedRequests.length > 0) {
      for (const reqItem of completedRequests) {
        const existing = await EnvironmentalImpact.findOne({ repairRequestId: reqItem._id });
        if (!existing) {
          const impact = calculateEnvironmentalImpact(reqItem.category);
          await EnvironmentalImpact.create({
            repairRequestId: reqItem._id,
            category: reqItem.category || 'Other',
            wasteDivertedKg: impact.wasteDivertedKg,
            co2SavedKg: impact.co2SavedKg,
          });
        }
      }
    }

    const records = await EnvironmentalImpact.find();

    const totalWasteDivertedKg = records.reduce((sum, r) => sum + (r.wasteDivertedKg || 0), 0);
    const totalCo2SavedKg = records.reduce((sum, r) => sum + (r.co2SavedKg || 0), 0);
    const totalRepairsCompleted = records.length;

    // Breakdown by category
    const categoryBreakdown = {};
    records.forEach((r) => {
      const cat = r.category || 'Other';
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { wasteKg: 0, co2Kg: 0, count: 0 };
      }
      categoryBreakdown[cat].wasteKg = Number((categoryBreakdown[cat].wasteKg + (r.wasteDivertedKg || 0)).toFixed(2));
      categoryBreakdown[cat].co2Kg = Number((categoryBreakdown[cat].co2Kg + (r.co2SavedKg || 0)).toFixed(2));
      categoryBreakdown[cat].count += 1;
    });

    res.json({
      success: true,
      data: {
        totalRepairsCompleted,
        totalWasteDivertedKg: Number(totalWasteDivertedKg.toFixed(2)),
        totalCo2SavedKg: Number(totalCo2SavedKg.toFixed(2)),
        treesEquivalent: Number((totalCo2SavedKg / 21.77).toFixed(1)), // 1 tree absorbs ~21.77kg CO2/year
        energySavedKwh: Number((totalCo2SavedKg * 5.28).toFixed(1)),
        moneySavedEstimated: Number((totalRepairsCompleted * 3500).toFixed(0)),
        categoryBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get personal environmental impact metrics for a user
// @route   GET /api/impact/user
// @access  Private
const getUserImpact = async (req, res) => {
  try {
    const userCompletedRequests = await RepairRequest.find({
      status: 'Completed',
      $or: [
        { requesterId: req.user._id },
        { assignedRepairerId: req.user._id },
      ],
    });

    const requestIds = userCompletedRequests.map((r) => r._id);

    // Backfill any user request missing an impact record
    for (const reqItem of userCompletedRequests) {
      const existing = await EnvironmentalImpact.findOne({ repairRequestId: reqItem._id });
      if (!existing) {
        const impact = calculateEnvironmentalImpact(reqItem.category);
        await EnvironmentalImpact.create({
          repairRequestId: reqItem._id,
          category: reqItem.category || 'Other',
          wasteDivertedKg: impact.wasteDivertedKg,
          co2SavedKg: impact.co2SavedKg,
        });
      }
    }

    const userRecords = await EnvironmentalImpact.find({ repairRequestId: { $in: requestIds } });

    const totalWasteDivertedKg = userRecords.reduce((sum, r) => sum + (r.wasteDivertedKg || 0), 0);
    const totalCo2SavedKg = userRecords.reduce((sum, r) => sum + (r.co2SavedKg || 0), 0);

    // Green badges
    const badges = [];
    if (userRecords.length >= 1) {
      badges.push({
        title: 'First Fix Pioneer',
        icon: '🌱',
        level: 1,
        description: 'Completed your first sustainable repair order',
      });
    }
    if (totalCo2SavedKg >= 50) {
      badges.push({
        title: 'Carbon Guardian',
        icon: '🌍',
        level: 2,
        description: 'Prevented over 50 kg of CO₂ lifecycle emissions',
      });
    }
    if (totalWasteDivertedKg >= 10) {
      badges.push({
        title: 'Zero Waste Champion',
        icon: '⚡',
        level: 3,
        description: 'Diverted over 10 kg of toxic e-waste from municipal landfills',
      });
    }

    res.json({
      success: true,
      data: {
        completedRepairsCount: userRecords.length,
        totalWasteDivertedKg: Number(totalWasteDivertedKg.toFixed(2)),
        totalCo2SavedKg: Number(totalCo2SavedKg.toFixed(2)),
        treesEquivalent: Number((totalCo2SavedKg / 21.77).toFixed(1)),
        energySavedKwh: Number((totalCo2SavedKg * 5.28).toFixed(1)),
        moneySavedEstimated: Number((userRecords.length * 3500).toFixed(0)),
        badges,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get environmental impact benchmark matrix coefficients
// @route   GET /api/impact/coefficients
// @access  Public
const getImpactCoefficients = (req, res) => {
  res.json({
    success: true,
    data: IMPACT_COEFFICIENTS,
  });
};

// @desc    Calculate potential environmental impact for an appliance category
// @route   POST /api/impact/calculate
// @access  Public
const calculatePotentialImpact = (req, res) => {
  try {
    const { category, quantity = 1 } = req.body;
    const qty = Math.max(1, Number(quantity) || 1);
    const impact = calculateEnvironmentalImpact(category);
    const wasteDivertedKg = Number((impact.wasteDivertedKg * qty).toFixed(2));
    const co2SavedKg = Number((impact.co2SavedKg * qty).toFixed(2));
    const treesEquivalent = Number((co2SavedKg / 21.77).toFixed(1));
    const energySavedKwh = Number((co2SavedKg * 5.28).toFixed(1));
    const moneySavedEstimated = Number((qty * 3500).toFixed(0));

    res.json({
      success: true,
      data: {
        category: category || 'Other',
        quantity: qty,
        wasteDivertedKg,
        co2SavedKg,
        treesEquivalent,
        energySavedKwh,
        moneySavedEstimated,
        coefficients: impact,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGlobalImpact,
  getUserImpact,
  getImpactCoefficients,
  calculatePotentialImpact,
};

