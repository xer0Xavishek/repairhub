const mongoose = require('mongoose');

const repairCafeEventSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    startTime: {
      type: String,
      default: '10:00 AM',
    },
    endTime: {
      type: String,
      default: '04:00 PM',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [90.4125, 23.8103],
      },
      venueName: {
        type: String,
        required: true,
        default: 'Community Center',
      },
      address: {
        type: String,
        default: 'Dhaka',
      },
    },
    capacity: {
      type: Number,
      required: true,
      default: 30,
    },
    categoriesHandled: {
      type: [String],
      default: ['Electronics', 'Small Appliances', 'Clothing/Textiles', 'Bicycles'],
    },
    rsvps: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['Attending', 'Interested'],
          default: 'Attending',
        },
        respondedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    waitlist: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        position: {
          type: Number,
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

repairCafeEventSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RepairCafeEvent', repairCafeEventSchema);
