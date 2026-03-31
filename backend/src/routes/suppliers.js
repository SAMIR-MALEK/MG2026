// suppliers.js
const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');
router.get('/', authenticate, async (_, res) => {
  const data = await prisma.supplier.findMany({ include: { _count: { select: { assets: true } } }, orderBy: { name: 'asc' } });
  res.json({ success: true, data });
});
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = await prisma.supplier.create({ data: req.body });
    res.status(201).json({ success: true, data, message: 'تمت إضافة المورد' });
  } catch { res.status(500).json({ success: false, message: 'خطأ' }); }
});
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false, message: 'خطأ' }); }
});
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'تم الحذف' });
  } catch { res.status(500).json({ success: false, message: 'لا يمكن الحذف' }); }
});
module.exports = router;
