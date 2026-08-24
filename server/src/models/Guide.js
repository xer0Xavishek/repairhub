const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Electronics', 'Home Appliances', 'Bicycles', 'Furniture', 'Textiles & Clothing', 'Smartphones', 'Mechanical', 'General', 'Other'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Moderate', 'Advanced'],
      default: 'Moderate',
    },
    estimatedMinutes: {
      type: Number,
      default: 30,
    },
    summary: {
      type: String,
      required: true,
    },
    steps: [
      {
        stepNumber: Number,
        stepTitle: String,
        instruction: String,
        safetyNote: String,
      },
    ],
    toolsRequired: [String],
    partsNeeded: [String],
    upvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Guide', guideSchema);
