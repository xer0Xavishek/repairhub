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
      default: null,
      required: false,
    },
    requesterEmail: {
      type: String,
      default: '',
    },
    reportType: {
      type: String,
      enum: ['triage', 'visual'],
      default: 'triage',
    },
    query: {
      type: String,
      default: '',
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
    estimatedPriceRange: {
      min: { type: Number, default: 300 },
      max: { type: Number, default: 1000 },
      currency: { type: String, default: 'BDT (৳)' },
    },
    safetyWarning: {
      type: String,
      default: '',
    },
    safetyWarnings: {
      type: [String],
      default: [],
    },
    triageSteps: {
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
    cloudSource: {
      type: String,
      default: 'Gemini Cloud AI',
    },
    rawAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIDiagnosticReport', aiDiagnosticReportSchema);
