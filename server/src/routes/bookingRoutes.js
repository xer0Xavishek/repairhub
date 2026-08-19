const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  createBooking,
  getBookings,
  rescheduleBooking,
  cancelBooking,
  joinWaitlist,
  getWaitlist,
  searchRepairers,
  getWorkshopSlotAvailability,
} = require('../controllers/bookingController');

router.get('/repairers', searchRepairers);
router.get('/availability', getWorkshopSlotAvailability);
router.post('/', protect, createBooking);
router.get('/', protect, getBookings);
router.put('/:id/reschedule', protect, rescheduleBooking);
router.put('/:id/cancel', protect, cancelBooking);
router.post('/waitlist', protect, joinWaitlist);
router.get('/waitlist/:repairerId', protect, getWaitlist);

module.exports = router;
