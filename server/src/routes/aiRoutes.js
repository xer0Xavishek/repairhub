const express = require('express');
const router = express.Router();
const { 
  runDiagnosticTriage, 
  runVisualDamageAssessment, 
  getDiagnosticReports 
} = require('../controllers/aiController');
const { optionalAuth } = require('../middlewares/authMiddleware');

// Extract user identity from Authorization header if present
router.use(optionalAuth);

router.route('/diagnose').get(runDiagnosticTriage).post(runDiagnosticTriage);
router.route('/visual-assessment').get(runVisualDamageAssessment).post(runVisualDamageAssessment);
router.get('/reports', getDiagnosticReports);
router.get('/history', getDiagnosticReports);

module.exports = router;
