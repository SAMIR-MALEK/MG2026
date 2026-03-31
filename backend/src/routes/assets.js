const router = require('express').Router();
const { z } = require('zod');
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const assetSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  description: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  quantity: z.number().int().min(0).default(0),
  minQuantity: z.number().int().min(0).default(1),
  unit: z.string().default('قطعة'),
  condition: z.enum(['GOOD','FAIR','POOR','DAMAGED','DISPOSED']).default('GOOD'),
  price: z.number().min(0).default(0),
  categoryId: z.string(),
  officeId: z.string(),
  supplierId: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  warrantyDate: z.string().optional().nullable(),
});

// Generate inv number: UBB-2025-001
async function generateInvNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.asset.count();
  return `UBB-${year}-${String(count + 1).padStart(3, '0')}`;
}

// GET /api/assets
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, categoryId, officeId, condition, hasBarcode, minQty } = req.query;
    const where = {};
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { invNumber: { contains: search, mode: 'insensitive' } },
      { serialNumber: { contains: search, mode: 'insensitive' } }
    ];
    if (categoryId) where.categoryId = categoryId;
    if (officeId) where.officeId = officeId;
    if (condition) where.condition = condition;
    if (hasBarcode === 'true') where.hasBarcode = true;
    if (minQty === 'true') where.quantity = { lte: prisma.asset.fields.minQuantity };

    const assets = await prisma.asset.findMany({
      where,
      include: { category: true, office: true, supplier: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: assets, total: assets.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في جلب الوسائل' });
  }
});

// GET /api/assets/low-stock
router.get('/low-stock', authenticate, async (req, res) => {
  try {
    const assets = await prisma.$queryRaw`
      SELECT a.*, c.name as category_name, o.name as office_name
      FROM assets a
      JOIN categories c ON a."categoryId" = c.id
      JOIN offices o ON a."officeId" = o.id
      WHERE a.quantity <= a."minQuantity"
      ORDER BY a.quantity ASC
      LIMIT 20
    `;
    res.json({ success: true, data: assets });
  } catch (err) {
    // Fallback
    const assets = await prisma.asset.findMany({
      include: { category: true, office: true },
      orderBy: { quantity: 'asc' },
      take: 20
    });
    const low = assets.filter(a => a.quantity <= a.minQuantity);
    res.json({ success: true, data: low });
  }
});

// GET /api/assets/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        category: true, office: true, supplier: true,
        movements: {
          include: { user: { select: { name: true } }, fromOffice: true, toOffice: true },
          orderBy: { date: 'desc' }, take: 15
        }
      }
    });
    if (!asset) return res.status(404).json({ success: false, message: 'الوسيلة غير موجودة' });
    res.json({ success: true, data: asset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في جلب الوسيلة' });
  }
});

// POST /api/assets
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = assetSchema.parse({ ...req.body, price: Number(req.body.price), quantity: Number(req.body.quantity), minQuantity: Number(req.body.minQuantity) });
    const invNumber = await generateInvNumber();
    const hasBarcode = data.price > 500;
    const asset = await prisma.asset.create({
      data: {
        ...data,
        invNumber,
        hasBarcode,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        warrantyDate: data.warrantyDate ? new Date(data.warrantyDate) : null,
      },
      include: { category: true, office: true }
    });
    res.status(201).json({
      success: true, data: asset,
      message: `تمت إضافة الوسيلة بنجاح — رقم الجرد: ${invNumber}${hasBarcode ? ' — تم إنشاء الباركود تلقائياً' : ''}`
    });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors[0].message });
    if (err.code === 'P2002') return res.status(400).json({ success: false, message: 'الرقم التسلسلي مستخدم مسبقاً' });
    res.status(500).json({ success: false, message: 'خطأ في إضافة الوسيلة' });
  }
});

// PUT /api/assets/:id
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const data = assetSchema.partial().parse(req.body);
    if (data.price !== undefined) data.hasBarcode = data.price > 500;
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : undefined,
        warrantyDate: data.warrantyDate ? new Date(data.warrantyDate) : undefined,
      },
      include: { category: true, office: true }
    });
    res.json({ success: true, data: asset, message: 'تم تحديث الوسيلة بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'خطأ في تحديث الوسيلة' });
  }
});

// DELETE /api/assets/:id
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.asset.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'تم حذف الوسيلة بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'لا يمكن حذف هذه الوسيلة — لها حركات مرتبطة' });
  }
});

module.exports = router;
