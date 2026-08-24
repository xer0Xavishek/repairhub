const Guide = require('../models/Guide');

// @desc    Get all community DIY repair guides (Module 3 - F15)
// @route   GET /api/guides
// @access  Public
const getGuides = async (req, res) => {
  try {
    const { category, difficulty, sort } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty;
    }

    let query = Guide.find(filter);

    if (sort === 'popular') {
      query = query.sort({ upvotes: -1, createdAt: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const guides = await query;
    res.json({ success: true, count: guides.length, data: guides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single guide by ID
// @route   GET /api/guides/:id
// @access  Public
const getGuideById = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) {
      return res.status(404).json({ success: false, message: 'Guide not found' });
    }
    res.json({ success: true, data: guide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new community DIY repair guide (Module 3 - F15)
// @route   POST /api/guides
// @access  Private
const createGuide = async (req, res) => {
  try {
    const { title, category, difficulty, estimatedMinutes, summary, steps, toolsRequired, partsNeeded } = req.body;

    if (!title || !category || !summary) {
      return res.status(400).json({ success: false, message: 'Title, category, and summary are required' });
    }

    const guide = await Guide.create({
      title,
      authorId: req.user._id,
      authorName: req.user.name,
      category,
      difficulty: difficulty || 'Moderate',
      estimatedMinutes: estimatedMinutes || 30,
      summary,
      steps: steps || [],
      toolsRequired: toolsRequired || [],
      partsNeeded: partsNeeded || [],
    });

    res.status(201).json({ success: true, message: 'DIY Guide published successfully', data: guide });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote a community DIY guide (Module 3 - F15)
// @route   POST /api/guides/:id/upvote
// @access  Private
const toggleUpvoteGuide = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) {
      return res.status(404).json({ success: false, message: 'Guide not found' });
    }

    const userId = req.user._id;
    const hasUpvoted = guide.upvotedBy.some((id) => id.toString() === userId.toString());

    if (hasUpvoted) {
      // Remove upvote
      guide.upvotedBy = guide.upvotedBy.filter((id) => id.toString() !== userId.toString());
      guide.upvotes = Math.max(0, guide.upvotes - 1);
    } else {
      // Add upvote
      guide.upvotedBy.push(userId);
      guide.upvotes += 1;
    }

    await guide.save();
    res.json({
      success: true,
      message: hasUpvoted ? 'Upvote removed' : 'Guide upvoted',
      upvotes: guide.upvotes,
      hasUpvoted: !hasUpvoted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGuides,
  getGuideById,
  createGuide,
  toggleUpvoteGuide,
};
