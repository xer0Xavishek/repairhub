const express = require('express');
const router = express.Router();
const { createEvent, getEvents, rsvpEvent, cancelRsvp } = require('../controllers/eventController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').post(protect, createEvent).get(getEvents);
router.route('/:id/rsvp').post(protect, rsvpEvent).delete(protect, cancelRsvp);

module.exports = router;
