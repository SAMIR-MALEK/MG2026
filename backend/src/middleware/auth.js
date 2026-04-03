const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'غير مصرح — يرجى تسجيل الدخول' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { office: true }
    });
    await prisma.$disconnect();
    
    if (!user) return res.status(401).json({ success: false, message: 'المستخدم غير موجود' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'رمز المصادقة غير صالح' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'هذا الإجراء يتطلب صلاحيات مسؤول الوسائل' });
  }
  next();
};

const requireAdminOrBureau = (req, res, next) => {
  if (req.user.role === 'VIEWER') {
    return res.status(403).json({ success: false, message: 'ليس لديك صلاحية' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireAdminOrBureau };
