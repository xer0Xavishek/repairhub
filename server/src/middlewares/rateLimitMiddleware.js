// Simple in-memory rate limiter for authentication endpoints
const rateLimitMap = new Map();

const authLimiter = (options = { windowMs: 15 * 60 * 1000, max: 15 }) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    let record = rateLimitMap.get(ip);

    if (!record) {
      record = { count: 1, resetTime: now + options.windowMs };
      rateLimitMap.set(ip, record);
    } else {
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + options.windowMs;
      } else {
        record.count += 1;
      }
    }

    if (record.count > options.max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        success: false,
        message: `Too many authentication attempts from this IP. Please try again in ${retryAfterSec} seconds.`,
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
};

module.exports = { authLimiter };
