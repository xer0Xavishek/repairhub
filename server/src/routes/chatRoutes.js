const express = require('express');
const router = express.Router();
const { sendMessage, getMessagesByRequest } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/messages', protect, sendMessage);
router.get('/request/:requestId', protect, getMessagesByRequest);

module.exports = router;
