const express = require('express');
const router = express.Router();
const { createReview, getReviewsForRepairer } = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createReview);
router.get('/repairer/:repairerId', getReviewsForRepairer);

module.exports = router;
