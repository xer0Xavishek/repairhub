const express = require('express');
const router = express.Router();
const { submitQuote, getQuotesForRequest, acceptQuote } = require('../controllers/quoteController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, submitQuote);
router.get('/request/:requestId', protect, getQuotesForRequest);
router.put('/:id/accept', protect, acceptQuote);

module.exports = router;
