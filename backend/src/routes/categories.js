// categories.js
const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  const data = await prisma.category.findMany({
    include: { _count: { select: { assets: true } }, assets: { select: { price: true, quantity: true } } },
    orderBy: { name: 'asc' }
  });
  res.json({ success: true, data });
});
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'الاسم مطلوب' });
    const data = await prisma.category.create({ data: { name, icon: icon || '📦', description } });
    res.status(201).json({ success: true, data, message: 'تمت إضافة الفئة' });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ success: false, message: 'الفئة موجودة مسبقاً' });
    res.status(500).json({ success: false, message: 'خطأ' });
  }
});
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false, message: 'خطأ' }); }
});
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'تم الحذف' });
  } catch { res.status(500).json({ success: false, message: 'لا يمكن الحذف — توجد وسائل مرتبطة' }); }
});
module.exports = router;
