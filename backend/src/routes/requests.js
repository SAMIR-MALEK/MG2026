const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, requireAdmin, requireAdminOrBureau } = require('../middleware/auth');

async function genRef() {
  const y = new Date().getFullYear();
  const c = await prisma.request.count();
  return `#RQ-${y}-${String(c + 1).padStart(3, '0')}`;
}

// GET /api/requests — admin sees all, bureau sees own
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (req.user.role === 'BUREAU') where.requesterId = req.user.id;

    const data = await prisma.request.findMany({
      where,
      include: {
        toOffice: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true } },
        items: true,
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false, message: 'خطأ في جلب الطلبات' }); }
});

// GET /api/requests/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const req_ = await prisma.request.findUnique({
      where: { id: req.params.id },
      include: {
        toOffice: true, requester: { select: { name: true, email: true, phone: true } },
        approver: { select: { name: true } }, items: { include: { asset: true } }
      }
    });
    if (!req_) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    res.json({ success: true, data: req_ });
  } catch { res.status(500).json({ success: false, message: 'خطأ في جلب الطلب' }); }
});

// POST /api/requests — bureau sends request
router.post('/', authenticate, requireAdminOrBureau, async (req, res) => {
  try {
    const { toOfficeId, priority, reason, items } = req.body;
    if (!toOfficeId || !items?.length) {
      return res.status(400).json({ success: false, message: 'يرجى تحديد الموقع والوسائل المطلوبة' });
    }
    const reference = await genRef();
    const request = await prisma.request.create({
      data: {
        reference,
        toOfficeId: toOfficeId || req.user.officeId,
        requesterId: req.user.id,
        priority: priority || 'NORMAL',
        reason,
        status: 'PENDING',
        items: { create: items.map(i => ({ itemName: i.name, quantity: Number(i.qty), notes: i.notes || '' })) }
      },
      include: { toOffice: true, items: true }
    });
    res.status(201).json({ success: true, data: request, message: `تم إرسال الطلب ${reference} بنجاح` });
  } catch { res.status(500).json({ success: false, message: 'خطأ في إرسال الطلب' }); }
});

// PUT /api/requests/:id/approve — admin approves with pickup date
router.put('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { pickupDate, pickupTime, pickupPlace, notes } = req.body;
    if (!pickupDate) return res.status(400).json({ success: false, message: 'يرجى تحديد موعد الاستلام' });
    const request = await prisma.request.update({
      where: { id: req.params.id },
      data: {
        status: 'APPROVED',
        approverId: req.user.id,
        pickupDate: new Date(pickupDate),
        pickupTime: pickupTime || '09:00',
        pickupPlace: pickupPlace || 'المخزن الرئيسي',
        notes
      },
      include: { toOffice: true, requester: { select: { name: true, email: true } }, items: true }
    });
    res.json({
      success: true, data: request,
      message: `✅ تمت الموافقة — موعد الاستلام: ${new Date(pickupDate).toLocaleDateString('ar-DZ')} الساعة ${pickupTime || '09:00'}`
    });
  } catch { res.status(500).json({ success: false, message: 'خطأ في الموافقة' }); }
});

// PUT /api/requests/:id/reject
router.put('/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { notes } = req.body;
    await prisma.request.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', approverId: req.user.id, notes }
    });
    res.json({ success: true, message: 'تم رفض الطلب وإشعار المسؤول' });
  } catch { res.status(500).json({ success: false, message: 'خطأ في الرفض' }); }
});

// PUT /api/requests/:id/reviewing
router.put('/:id/reviewing', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.request.update({ where: { id: req.params.id }, data: { status: 'REVIEWING' } });
    res.json({ success: true, message: 'تم وضع الطلب قيد الدراسة' });
  } catch { res.status(500).json({ success: false, message: 'خطأ' }); }
});

// PUT /api/requests/:id/deliver
router.put('/:id/deliver', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.request.update({ where: { id: req.params.id }, data: { status: 'DELIVERED' } });
    res.json({ success: true, message: 'تم تأكيد التسليم' });
  } catch { res.status(500).json({ success: false, message: 'خطأ' }); }
});

module.exports = router;
