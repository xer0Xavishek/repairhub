const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getGuides,
  getGuideById,
  createGuide,
  toggleUpvoteGuide,
} = require('../controllers/guideController');

router.get('/', getGuides);
router.get('/:id', getGuideById);
router.post('/', protect, createGuide);
router.post('/:id/upvote', protect, toggleUpvoteGuide);

module.exports = router;
