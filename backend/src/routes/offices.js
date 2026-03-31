// offices.js
const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  const data = await prisma.office.findMany({
    include: { _count: { select: { assets: true, users: true } }, users: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { name: 'asc' }
  });
  res.json({ success: true, data });
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, type, floor, room, phone, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'الاسم مطلوب' });
    const data = await prisma.office.create({ data: { name, type: type || 'BUREAU', floor, room, phone, description } });
    res.status(201).json({ success: true, data, message: 'تمت إضافة المكتب بنجاح' });
  } catch { res.status(500).json({ success: false, message: 'خطأ في إضافة المكتب' }); }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = await prisma.office.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data, message: 'تم تحديث المكتب' });
  } catch { res.status(500).json({ success: false, message: 'خطأ في التحديث' }); }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.office.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'تم حذف المكتب' });
  } catch { res.status(500).json({ success: false, message: 'لا يمكن الحذف — توجد وسائل مرتبطة' }); }
});

module.exports = router;
