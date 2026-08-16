const mongoose = require('mongoose');

const environmentalImpactSchema = new mongoose.Schema(
  {
    repairRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RepairRequest',
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    wasteDivertedKg: {
      type: Number,
      required: true,
      default: 0,
    },
    co2SavedKg: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EnvironmentalImpact', environmentalImpactSchema);
