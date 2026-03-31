// ─── MOVEMENTS ────────────────────────────────────────────────────────────────
const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

async function genRef(prefix, model) {
  const year = new Date().getFullYear();
  const count = await prisma[model].count();
  return `#${prefix}-${year}-${String(count + 1).padStart(3, '0')}`;
}

// GET /api/movements
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, assetId, limit = 50 } = req.query;
    const where = {};
    if (type) where.type = type;
    if (assetId) where.assetId = assetId;
    const data = await prisma.movement.findMany({
      where, include: {
        asset: { select: { id: true, name: true, invNumber: true } },
        user: { select: { id: true, name: true } },
        fromOffice: { select: { id: true, name: true } },
        toOffice: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }, take: parseInt(limit)
    });
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false, message: 'خطأ في جلب الحركات' }); }
});

// POST /api/movements
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { type, quantity, assetId, notes, fromOfficeId, toOfficeId, requestId } = req.body;
    if (!type || !quantity || !assetId) return res.status(400).json({ success: false, message: 'البيانات غير مكتملة' });
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return res.status(404).json({ success: false, message: 'الوسيلة غير موجودة' });

    let qChange = 0;
    if (['PURCHASE', 'RETURN'].includes(type)) qChange = Number(quantity);
    if (['DISTRIBUTE', 'DISPOSAL'].includes(type)) qChange = -Number(quantity);

    if (qChange < 0 && asset.quantity + qChange < 0) {
      return res.status(400).json({ success: false, message: `الكمية المطلوبة (${quantity}) أكبر من المتوفر (${asset.quantity})` });
    }

    const reference = await genRef('MV', 'movement');
    const [movement] = await prisma.$transaction([
      prisma.movement.create({
        data: { reference, type, quantity: Number(quantity), assetId, userId: req.user.id, notes, fromOfficeId, toOfficeId, requestId },
        include: {
          asset: { select: { name: true, invNumber: true } },
          user: { select: { name: true } },
          fromOffice: { select: { name: true } },
          toOffice: { select: { name: true } }
        }
      }),
      prisma.asset.update({ where: { id: assetId }, data: { quantity: { increment: qChange } } })
    ]);
    res.status(201).json({ success: true, data: movement, message: 'تمت العملية بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في تسجيل الحركة' });
  }
});

module.exports = router;
