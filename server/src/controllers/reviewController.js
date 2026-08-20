const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');
const RepairRequest = require('../models/RepairRequest');

// @desc    Submit 5-star multi-criteria review (Module 5 - F20)
// @route   POST /api/reviews
// @access  Private (Requester)
const createReview = async (req, res) => {
  try {
    const { repairRequestId, qualityRating, communicationRating, turnaroundRating, comment, repairerId } = req.body;

    const request = await RepairRequest.findById(repairRequestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Repair request not found' });
    }

    if (request.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Can only submit reviews for completed repair jobs' });
    }

    // Item 14: Customer should not be able to publish reviews several times or modify an existing review
    const existingReview = await Review.findOne({ repairRequestId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'A review has already been published for this repair order and cannot be modified.',
      });
    }

    let targetRepairerId = request.assignedRepairerId;
    if (!targetRepairerId && repairerId && mongoose.Types.ObjectId.isValid(repairerId)) {
      targetRepairerId = repairerId;
      request.assignedRepairerId = targetRepairerId;
      await request.save();
    }
    if (!targetRepairerId && (request.assignedRepairer || req.body.repairer)) {
      const repName = (request.assignedRepairer || req.body.repairer || '').trim();
      const rep = await User.findOne({
        $or: [
          { businessName: new RegExp(`^${repName}$`, 'i') },
          { name: new RegExp(`^${repName}$`, 'i') },
          { businessName: new RegExp(repName, 'i') },
          { name: new RegExp(repName, 'i') },
        ],
      });
      if (rep) {
        targetRepairerId = rep._id;
        request.assignedRepairerId = rep._id;
        await request.save();
      }
    }

    if (!targetRepairerId) {
      return res.status(400).json({ success: false, message: 'Could not resolve technician for this review' });
    }

    // Item 15: Properly calculate ratings so 1-star (or any score) is not overridden by default 5s
    const parsedQ = Number(qualityRating);
    const qRating = Number.isFinite(parsedQ) && parsedQ >= 1 && parsedQ <= 5 ? parsedQ : 5;
    const parsedC = Number(communicationRating);
    const cRating = Number.isFinite(parsedC) && parsedC >= 1 && parsedC <= 5 ? parsedC : qRating;
    const parsedT = Number(turnaroundRating);
    const tRating = Number.isFinite(parsedT) && parsedT >= 1 && parsedT <= 5 ? parsedT : qRating;
    const avgScore = Number(((qRating + cRating + tRating) / 3).toFixed(1));

    const review = await Review.create({
      repairRequestId,
      repairerId: targetRepairerId,
      requesterId: req.user._id,
      qualityRating: qRating,
      communicationRating: cRating,
      turnaroundRating: tRating,
      averageRating: avgScore,
      comment: comment || '',
    });

    // Recalculate repairer average rating
    const allReviews = await Review.find({ repairerId: targetRepairerId });
    const avg = allReviews.reduce((sum, r) => sum + (r.averageRating ?? r.qualityRating ?? 5), 0) / allReviews.length;

    await User.findByIdAndUpdate(targetRepairerId, {
      rating: Number(avg.toFixed(1)),
      ratingCount: allReviews.length,
    });

    const populatedReview = await Review.findById(review._id)
      .populate('requesterId', 'name')
      .populate('repairRequestId', 'itemTitle category');

    res.status(201).json({ success: true, data: populatedReview });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A review has already been published for this repair order and cannot be modified.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get reviews for a repairer
// @route   GET /api/reviews/repairer/:repairerId
// @access  Public
const getReviewsForRepairer = async (req, res) => {
  try {
    const repParam = req.params.repairerId;
    let filter = {};

    if (mongoose.Types.ObjectId.isValid(repParam)) {
      filter = { repairerId: repParam };
    } else {
      const repUser = await User.findOne({
        $or: [
          { email: repParam },
          { businessName: new RegExp(repParam, 'i') },
          { name: new RegExp(repParam, 'i') },
        ],
      });
      if (repUser) {
        filter = { repairerId: repUser._id };
      } else {
        return res.json({ success: true, count: 0, data: [] });
      }
    }

    const reviews = await Review.find(filter)
      .populate('requesterId', 'name')
      .populate('repairRequestId', 'itemTitle category')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createReview, getReviewsForRepairer };
