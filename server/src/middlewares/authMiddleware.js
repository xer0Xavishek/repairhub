const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Support demo session tokens seamlessly by linking to real MongoDB seeded users
      if (token && token.startsWith('demo_')) {
        const demoKey = token.replace('demo_', '').toLowerCase();
        const emailMap = {
          customer: 'avishek@bracu.ac.bd',
          technician: 'rafiq@repairhub.com',
          workshop: 'rafiq@repairhub.com',
          freelance: 'bikedoctor@repairhub.com',
          freelancer: 'bikedoctor@repairhub.com',
          admin: 'admin@repairhub.com',
        };
        const targetEmail = emailMap[demoKey] || 'avishek@bracu.ac.bd';
        req.user = await User.findOne({ email: targetEmail }).select('-passwordHash');
        if (!req.user) {
          const roleFallback = (demoKey === 'technician' || demoKey === 'workshop' || demoKey === 'freelancer' || demoKey === 'freelance') ? 'repairer' : (demoKey === 'admin' ? 'admin' : 'requester');
          req.user = await User.findOne({ role: roleFallback }).select('-passwordHash');
        }
        if (req.user) {
          return next();
        }
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'repairhub_super_secret_jwt_key_2026');
      req.user = await User.findById(decoded.id).select('-passwordHash');
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found with this token' });
      }

      if (req.user.isSuspended) {
        return res.status(403).json({ success: false, message: 'Your account has been suspended by platform administration' });
      }

      return next();
    } catch (error) {
      console.error('[Auth Error]:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, invalid or expired token' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
