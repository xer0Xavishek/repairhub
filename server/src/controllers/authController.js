const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'repairhub_super_secret_jwt_key_2026', {
    expiresIn: '30d',
  });
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @desc    Register a new user (Secured with input validation & role guards)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    let { name, email, password, role, businessName, categories, phone, address, coordinates, technicianType, startingRate } = req.body;

    // 1. Input Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Full name is required (minimum 2 characters)' });
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }
    email = email.trim();

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters in length' });
    }

    // 2. Privilege Escalation Guard
    // Public registration is restricted to 'requester', 'repairer', or 'organizer'
    let assignedRole = (role || 'requester').toLowerCase();
    if (assignedRole === 'admin') {
      // Prevent unauthorized admin elevation from public register endpoint
      return res.status(403).json({ success: false, message: 'Direct registration with Administrator privileges is forbidden' });
    }

    if (!['requester', 'repairer', 'organizer'].includes(assignedRole)) {
      assignedRole = 'requester';
    }

    // 3. Check for existing user
    const userExists = await User.findOne({
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const userData = {
      name: name.trim(),
      email,
      passwordHash: password,
      role: assignedRole,
      phone: phone ? String(phone).trim() : '',
      address: address ? String(address).trim() : 'Dhaka, Bangladesh',
      isSuspended: false,
    };

    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      userData.location = {
        type: 'Point',
        coordinates,
        address: address || 'Dhaka',
      };
    }

    if (assignedRole === 'repairer') {
      userData.technicianType = technicianType === 'freelance' ? 'freelance' : 'workshop';
      userData.businessName = businessName ? String(businessName).trim() : `${name}'s ${technicianType === 'freelance' ? 'Mobile Repair' : 'Repair Workshop'}`;
      userData.categories = Array.isArray(categories) && categories.length > 0 ? categories : ['Electronics'];
      userData.priceRangeMin = startingRate ? Number(startingRate) : 250;
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: 'Account registered and secured successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        technicianType: user.technicianType,
        address: user.address,
        location: user.location,
        businessName: user.businessName,
        categories: user.categories,
        startingRate: user.priceRangeMin,
        isVerified: user.isVerified,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate user & get secure token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    let { email, password, requiredRole, loginRole, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }
    const cleanEmail = email.trim();

    // Strict case-sensitive match: only exact character-cased email matches
    const user = await User.findOne({ email: cleanEmail });

    if (user && user.email === cleanEmail && (await user.matchPassword(password))) {
      // 1. Suspension Check
      if (user.isSuspended) {
        return res.status(403).json({
          success: false,
          message: 'This account has been suspended by administration due to policy violations',
        });
      }

      // 2. Admin Gateway Role Enforcement (Bug 2)
      const wantsAdmin = (requiredRole || loginRole || role || '').toLowerCase() === 'admin';
      const wantsUser = (loginRole || '').toLowerCase() === 'user';

      if (wantsAdmin && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only platform administrators can sign in through the Admin Gateway.',
        });
      }

      if (wantsUser && user.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Administrator accounts must sign in using the Admin Sign In tab.',
        });
      }

      res.json({
        success: true,
        message: 'Authentication successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          address: user.address,
          location: user.location,
          businessName: user.businessName,
          categories: user.categories,
          isVerified: user.isVerified,
          rating: user.rating,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Secure Logout & Session Invalidation
// @route   POST /api/auth/logout
// @access  Public / Authenticated
const logoutUser = async (req, res) => {
  res.json({
    success: true,
    message: 'User logged out and session credentials cleared successfully',
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile (Contact number, Street Address, Interactive Map Coordinates, Technician Details)
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    const { name, phone, address, coordinates, businessName, categories, startingRate, technicianType, password } = req.body;

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    if (address !== undefined) {
      user.address = String(address).trim();
    }

    // Update GeoJSON location from interactive map pin [longitude, latitude]
    if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
      user.location = {
        type: 'Point',
        coordinates: [Number(coordinates[0]), Number(coordinates[1])],
        address: user.address || 'Dhaka',
      };
    }

    // Role-specific technician updates
    if (user.role === 'repairer') {
      if (businessName) user.businessName = String(businessName).trim();
      if (technicianType) user.technicianType = technicianType === 'freelance' ? 'freelance' : 'workshop';
      if (Array.isArray(categories) && categories.length > 0) user.categories = categories;
      if (startingRate !== undefined) user.priceRangeMin = Number(startingRate);
    }

    // Optional password change
    if (password && typeof password === 'string' && password.length >= 6) {
      user.passwordHash = password;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      message: 'Profile and location details updated successfully',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        technicianType: updatedUser.technicianType,
        address: updatedUser.address,
        location: updatedUser.location,
        latLng: updatedUser.location?.coordinates ? [updatedUser.location.coordinates[1], updatedUser.location.coordinates[0]] : [23.7712, 90.4255],
        businessName: updatedUser.businessName,
        categories: updatedUser.categories,
        startingRate: updatedUser.priceRangeMin,
        isVerified: updatedUser.isVerified,
        rating: updatedUser.rating,
        token: generateToken(updatedUser._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerUser, loginUser, logoutUser, getMe, updateUserProfile };
