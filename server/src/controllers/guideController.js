const Guide = require('../models/Guide');
const User = require('../models/User');

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
// @access  Private / Public (with fallback demo user)
const createGuide = async (req, res) => {
  try {
    const { title, category, difficulty, estimatedMinutes, summary, steps, toolsRequired, partsNeeded } = req.body;

    if (!title || !category || !summary) {
      return res.status(400).json({ success: false, message: 'Title, category, and summary are required' });
    }

    let authorId = req.user?._id;
    let authorName = req.user?.name;

    if (!authorId) {
      const fallbackUser = await User.findOne({ email: 'avishek@bracu.ac.bd' }) || await User.findOne({ role: 'requester' }) || await User.findOne();
      if (fallbackUser) {
        authorId = fallbackUser._id;
        authorName = fallbackUser.name || 'Avishek Biswas';
      }
    }

    const guide = await Guide.create({
      title,
      authorId,
      authorName: authorName || 'Community Fixer',
      category,
      difficulty: difficulty || 'Moderate',
      estimatedMinutes: estimatedMinutes || 30,
      summary,
      steps: steps || [],
      toolsRequired: toolsRequired || [],
      partsNeeded: partsNeeded || [],
    });

    console.log(`[DB] DIY Guide created and saved in Atlas with ID: ${guide._id}`);
    res.status(201).json({ success: true, message: 'DIY Guide published successfully', data: guide });
  } catch (error) {
    console.error('[Create Guide Error]:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upvote a community DIY guide (Module 3 - F15)
// @route   POST /api/guides/:id/upvote
// @access  Private / Public (with fallback demo user)
const toggleUpvoteGuide = async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) {
      return res.status(404).json({ success: false, message: 'Guide not found' });
    }

    let userId = req.user?._id;
    if (!userId) {
      const fallbackUser = await User.findOne({ email: 'avishek@bracu.ac.bd' }) || await User.findOne();
      userId = fallbackUser?._id;
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User identity required to upvote' });
    }

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
    console.log(`[DB] DIY Guide ${guide._id} upvote toggled: ${guide.upvotes}`);
    res.json({
      success: true,
      message: hasUpvoted ? 'Upvote removed' : 'Guide upvoted',
      upvotes: guide.upvotes,
      hasUpvoted: !hasUpvoted,
    });
  } catch (error) {
    console.error('[Upvote Guide Error]:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getGuides,
  getGuideById,
  createGuide,
  toggleUpvoteGuide,
};
