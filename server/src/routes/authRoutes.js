const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser, getMe, updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');

// Apply rate limiting to public login and register endpoints to prevent brute-force attacks
router.post('/register', authLimiter({ windowMs: 15 * 60 * 1000, max: 20 }), registerUser);
router.post('/login', authLimiter({ windowMs: 15 * 60 * 1000, max: 25 }), loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUserProfile);

module.exports = router;
