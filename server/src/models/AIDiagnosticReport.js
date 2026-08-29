const mongoose = require('mongoose');

const aiDiagnosticReportSchema = new mongoose.Schema(
  {
    repairRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RepairRequest',
      default: null,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    detectedItemType: {
      type: String,
      default: 'Unknown Device',
    },
    detectedDefect: {
      type: String,
      default: 'General Hardware Fault',
    },
    severityScore: {
      type: Number,
      default: 5, // 1 to 10
    },
    estimatedCostMin: {
      type: Number,
      default: 300,
    },
    estimatedCostMax: {
      type: Number,
      default: 1000,
    },
    safetyWarnings: {
      type: [String],
      default: [],
    },
    suggestedTriageSteps: {
      type: [String],
      default: [],
    },
    relevantManualsRetrieved: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIDiagnosticReport', aiDiagnosticReportSchema);
