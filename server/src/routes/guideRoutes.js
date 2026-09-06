const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middlewares/authMiddleware');
const {
  getGuides,
  getGuideById,
  createGuide,
  toggleUpvoteGuide,
} = require('../controllers/guideController');

router.get('/', getGuides);
router.get('/:id', getGuideById);
router.post('/', optionalAuth, createGuide);
router.post('/:id/upvote', optionalAuth, toggleUpvoteGuide);

module.exports = router;
