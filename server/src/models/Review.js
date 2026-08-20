const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    repairRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RepairRequest',
      required: true,
      unique: true,
    },
    repairerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    qualityRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    communicationRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    turnaroundRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    averageRating: {
      type: Number,
      default: 5,
    },
    comment: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

reviewSchema.pre('save', function (next) {
  this.averageRating = Number(
    ((this.qualityRating + this.communicationRating + this.turnaroundRating) / 3).toFixed(1)
  );
  next();
});

module.exports = mongoose.model('Review', reviewSchema);
