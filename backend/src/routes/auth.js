const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(4, 'كلمة المرور يجب أن تكون 4 أحرف على الأقل')
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
console.log('=== LOGIN ATTEMPT ===');
  console.log('email:', req.body.email);
  console.log('password:', req.body.password);
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email },
      include: { office: { select: { id: true, name: true, type: true } } }
    });
    if (!user || (user.password !== password && !(await bcrypt.compare(password,user.password)))) {
      return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
    res.json({
      success: true,
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, phone: user.phone, office: user.office
      }
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors[0].message });
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id, name: req.user.name, email: req.user.email,
      role: req.user.role, phone: req.user.phone, office: req.user.office
    }
  });
});

// PUT /api/auth/password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال كلمة المرور الحالية والجديدة' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم' });
  }
});

module.exports = router;
