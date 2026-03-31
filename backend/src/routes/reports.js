const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/reports/assets — full asset report
router.get('/assets', authenticate, async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      include: { category: true, office: true, supplier: true },
      orderBy: [{ office: { name: 'asc' } }, { name: 'asc' }]
    });
    const totalValue = assets.reduce((s, a) => s + a.quantity * a.price, 0);
    res.json({ success: true, data: assets, totalValue, total: assets.length });
  } catch { res.status(500).json({ success: false, message: 'خطأ في التقرير' }); }
});

// GET /api/reports/movements — movement history
router.get('/movements', authenticate, requireAdmin, async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from || to) where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
    const data = await prisma.movement.findMany({
      where,
      include: { asset: true, user: { select: { name: true } }, fromOffice: true, toOffice: true },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false, message: 'خطأ في التقرير' }); }
});

// GET /api/reports/inventory/:id — inventory report
router.get('/inventory/:id', authenticate, async (req, res) => {
  try {
    const inv = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      include: { office: true, user: { select: { name: true } }, items: { include: { asset: { include: { category: true } } } } }
    });
    if (!inv) return res.status(404).json({ success: false, message: 'الجرد غير موجود' });
    const summary = {
      total: inv.items.length,
      matched: inv.items.filter(i => i.actualQty === i.expectedQty).length,
      surplus: inv.items.filter(i => i.actualQty > i.expectedQty).length,
      deficit: inv.items.filter(i => i.actualQty < i.expectedQty).length,
    };
    res.json({ success: true, data: inv, summary });
  } catch { res.status(500).json({ success: false, message: 'خطأ في التقرير' }); }
});

module.exports = router;
