const express = require('express');
const router = express.Router();
const {
  getGlobalImpact,
  getUserImpact,
  getImpactCoefficients,
  calculatePotentialImpact,
} = require('../controllers/impactController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/global', getGlobalImpact);
router.get('/user', protect, getUserImpact);
router.get('/coefficients', getImpactCoefficients);
router.post('/calculate', calculatePotentialImpact);

module.exports = router;

