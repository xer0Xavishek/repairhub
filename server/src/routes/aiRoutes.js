const express = require('express');
const router = express.Router();
const { runDiagnosticTriage, runVisualDamageAssessment } = require('../controllers/aiController');

router.route('/diagnose').get(runDiagnosticTriage).post(runDiagnosticTriage);
router.route('/visual-assessment').get(runVisualDamageAssessment).post(runVisualDamageAssessment);

module.exports = router;
