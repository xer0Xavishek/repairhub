const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    phone: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: 'Dhaka, Bangladesh',
    },
    role: {
      type: String,
      enum: ['requester', 'repairer', 'admin', 'organizer'],
      default: 'requester',
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    // Repairer specific fields
    technicianType: {
      type: String,
      enum: ['workshop', 'freelance'],
      default: 'workshop',
    },
    businessName: {
      type: String,
      default: '',
    },
    categories: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    priceRangeMin: {
      type: Number,
      default: 0,
    },
    priceRangeMax: {
      type: Number,
      default: 0,
    },
    isVerified: {
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
        type: [Number], // [longitude, latitude]
        default: [90.4125, 23.8103], // Default Dhaka coordinates
      },
      address: {
        type: String,
        default: 'Dhaka',
      },
    },
    // Requester specific fields
    favoriteRepairers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

module.exports = mongoose.model('User', userSchema);
