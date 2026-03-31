// users.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireAdmin, async (req, res) => {
  const data = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true, office: { select: { id: true, name: true } } }
  });
  res.json({ success: true, data });
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, phone, officeId } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'البيانات غير مكتملة' });
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'BUREAU', phone, officeId },
      select: { id: true, name: true, email: true, role: true, phone: true, office: { select: { name: true } } }
    });
    res.status(201).json({ success: true, data: user, message: 'تمت إضافة المستخدم بنجاح' });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم مسبقاً' });
    res.status(500).json({ success: false, message: 'خطأ في إضافة المستخدم' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, role, phone, officeId, password } = req.body;
    const data = { name, email, role, phone, officeId };
    if (password) data.password = await bcrypt.hash(password, 12);
    const user = await prisma.user.update({
      where: { id: req.params.id }, data,
      select: { id: true, name: true, email: true, role: true, phone: true }
    });
    res.json({ success: true, data: user, message: 'تم تحديث المستخدم' });
  } catch { res.status(500).json({ success: false, message: 'خطأ في التحديث' }); }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك الخاص' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'تم حذف المستخدم' });
  } catch { res.status(500).json({ success: false, message: 'خطأ في الحذف' }); }
});

module.exports = router;
