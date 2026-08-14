const mongoose = require('mongoose');

const repairRequestSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedRepairerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    repairerResponses: [
      {
        repairerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        decision: {
          type: String,
          enum: ['accepted', 'rejected'],
          required: true,
        },
        respondedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    itemTitle: {
      type: String,
      required: [true, 'Item title is required'],
      trim: true,
    },
    itemDescription: {
      type: String,
      required: [true, 'Item description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Electronics', 'Home Appliances', 'Furniture', 'Textiles & Clothing', 'Bicycles', 'Mechanical', 'Other'],
    },
    subCategory: {
      type: String,
      default: 'General',
    },
    photos: {
      type: [String],
      default: [],
    },
    issueDescription: {
      type: String,
      required: [true, 'Issue description is required'],
    },
    preferredMethod: {
      type: String,
      enum: ['drop-off', 'pickup', 'mail-in'],
      default: 'drop-off',
    },
    status: {
      type: String,
      enum: ['Requested', 'Quoted', 'In Progress', 'Ready for Pickup', 'Completed', 'Cancelled'],
      default: 'Requested',
    },
    qrCode: {
      type: String, // Base64 data URL
      default: '',
    },
    estimatedPrice: {
      type: Number,
      default: 0,
    },
    finalPrice: {
      type: Number,
      default: 0,
    },
    pickupVerified: {
      type: Boolean,
      default: false,
    },
    dropoffVerified: {
      type: Boolean,
      default: false,
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
      address: {
        type: String,
        default: 'Dhaka',
      },
    },
  },
  { timestamps: true }
);

repairRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RepairRequest', repairRequestSchema);
