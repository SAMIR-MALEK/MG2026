const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'غير مصرح' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, role: decoded.role || 'ADMIN' };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'رمز غير صالح' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'غير مصرح' });
  }
  next();
};

const requireAdminOrBureau = (req, res, next) => {
  if (req.user.role === 'VIEWER') {
    return res.status(403).json({ success: false, message: 'غير مصرح' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireAdminOrBureau };
