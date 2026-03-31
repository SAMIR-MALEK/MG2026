// dashboard.js
const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const [
      totalAssets, totalOffices, totalCategories,
      totalRequests, pendingRequests,
      recentMovements, lowStockRaw, categoryStats, requestsByStatus
    ] = await Promise.all([
      prisma.asset.aggregate({ _count: true, _sum: { quantity: true, price: true } }),
      prisma.office.count(),
      prisma.category.count(),
      prisma.request.count(),
      prisma.request.count({ where: { status: 'PENDING' } }),
      prisma.movement.findMany({
        take: 8, orderBy: { date: 'desc' },
        include: {
          asset: { select: { name: true, invNumber: true } },
          user: { select: { name: true } },
          toOffice: { select: { name: true } }
        }
      }),
      prisma.asset.findMany({ include: { office: true, category: true }, take: 100 }),
      prisma.category.findMany({
        include: { assets: { select: { quantity: true, price: true } }, _count: { select: { assets: true } } }
      }),
      prisma.request.groupBy({ by: ['status'], _count: { status: true } })
    ]);

    const lowStock = lowStockRaw.filter(a => a.quantity <= a.minQuantity);
    const catStats = categoryStats.map(c => ({
      name: c.name, count: c._count.assets,
      totalQty: c.assets.reduce((s, a) => s + a.quantity, 0),
      totalValue: c.assets.reduce((s, a) => s + (a.quantity * a.price), 0)
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalAssets: totalAssets._count,
          totalQuantity: totalAssets._sum.quantity || 0,
          totalValue: totalAssets._sum.price || 0,
          totalOffices, totalCategories, totalRequests, pendingRequests
        },
        recentMovements,
        lowStock: lowStock.slice(0, 6),
        categoryStats: catStats,
        requestsByStatus
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'خطأ في لوحة التحكم' });
  }
});

module.exports = router;
