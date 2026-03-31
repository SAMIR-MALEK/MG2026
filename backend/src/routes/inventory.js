const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

async function genRef() {
  const y = new Date().getFullYear();
  const c = await prisma.inventory.count();
  return `#INV-${y}-${String(c + 1).padStart(3, '0')}`;
}

// GET /api/inventory
router.get('/', authenticate, async (req, res) => {
  try {
    const data = await prisma.inventory.findMany({
      include: {
        office: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        _count: { select: { items: true } }
      },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false, message: 'خطأ في جلب الجرد' }); }
});

// GET /api/inventory/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const inv = await prisma.inventory.findUnique({
      where: { id: req.params.id },
      include: {
        office: true,
        user: { select: { name: true } },
        items: { include: { asset: { include: { category: true } } } }
      }
    });
    if (!inv) return res.status(404).json({ success: false, message: 'الجرد غير موجود' });
    res.json({ success: true, data: inv });
  } catch { res.status(500).json({ success: false, message: 'خطأ في جلب الجرد' }); }
});

// POST /api/inventory — open new inventory sheet
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { officeId, notes, date } = req.body;
    if (!officeId) return res.status(400).json({ success: false, message: 'يرجى تحديد الموقع' });
    const reference = await genRef();
    // Auto-load assets for this office
    const officeAssets = await prisma.asset.findMany({ where: { officeId } });
    const inv = await prisma.inventory.create({
      data: {
        reference,
        officeId,
        userId: req.user.id,
        notes,
        date: date ? new Date(date) : new Date(),
        status: 'OPEN',
        items: {
          create: officeAssets.map(a => ({
            assetId: a.id,
            expectedQty: a.quantity,
            actualQty: a.quantity, // مبدئياً = المسجل
            notes: ''
          }))
        }
      },
      include: { office: true, items: { include: { asset: { include: { category: true } } } } }
    });
    res.status(201).json({ success: true, data: inv, message: `تم فتح ورقة الجرد ${reference}` });
  } catch { res.status(500).json({ success: false, message: 'خطأ في إنشاء الجرد' }); }
});

// PUT /api/inventory/:id/items — update actual quantities (manual fill)
router.put('/:id/items', authenticate, requireAdmin, async (req, res) => {
  try {
    const { items } = req.body; // [{ itemId, actualQty, notes }]
    if (!items?.length) return res.status(400).json({ success: false, message: 'لا توجد بيانات للتحديث' });
    const inv = await prisma.inventory.findUnique({ where: { id: req.params.id } });
    if (!inv) return res.status(404).json({ success: false, message: 'الجرد غير موجود' });
    if (inv.status === 'CLOSED') return res.status(400).json({ success: false, message: 'الجرد مغلق ولا يمكن تعديله' });
    await Promise.all(items.map(item =>
      prisma.inventoryItem.update({
        where: { id: item.itemId },
        data: { actualQty: Number(item.actualQty), notes: item.notes || '' }
      })
    ));
    res.json({ success: true, message: 'تم حفظ بيانات الجرد' });
  } catch { res.status(500).json({ success: false, message: 'خطأ في حفظ الجرد' }); }
});

// PUT /api/inventory/:id/close — close inventory
router.put('/:id/close', authenticate, requireAdmin, async (req, res) => {
  try {
    const inv = await prisma.inventory.update({
      where: { id: req.params.id },
      data: { status: 'CLOSED', closedAt: new Date() }
    });
    res.json({ success: true, data: inv, message: 'تم إغلاق وحفظ الجرد بنجاح' });
  } catch { res.status(500).json({ success: false, message: 'خطأ في إغلاق الجرد' }); }
});

module.exports = router;
