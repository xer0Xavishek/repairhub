const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'General DIY',
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    images: {
      type: [String],
      default: [],
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    upvoteCount: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Professional Only'],
      default: 'Beginner',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CommunityPost', communityPostSchema);
