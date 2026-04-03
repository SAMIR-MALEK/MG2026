const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const [totalAssets, totalOffices, totalCategories, totalRequests, pendingRequests, recentMovements] =
      await Promise.all([
        prisma.asset.aggregate({ _count: true, _sum: { quantity: true } }).catch(() => ({ _count: 0, _sum: { quantity: 0 } })),
        prisma.office.count().catch(() => 0),
        prisma.category.count().catch(() => 0),
        prisma.request.count().catch(() => 0),
        prisma.request.count({ where: { status: 'PENDING' } }).catch(() => 0),
        prisma.movement.findMany({
          take: 8, orderBy: { date: 'desc' },
          include: {
            asset: { select: { name: true, invNumber: true } },
            user: { select: { name: true } },
            toOffice: { select: { name: true } }
          }
        }).catch(() => []),
      ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalAssets: totalAssets._count || 0,
          totalQuantity: totalAssets._sum?.quantity || 0,
          totalOffices,
          totalCategories,
          totalRequests,
          pendingRequests
        },
        recentMovements,
        lowStock: [],
        categoryStats: [],
        requestsByStatus: []
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.json({
      success: true,
      data: {
        stats: { totalAssets: 0, totalQuantity: 0, totalOffices: 0, totalCategories: 0, totalRequests: 0, pendingRequests: 0 },
        recentMovements: [], lowStock: [], categoryStats: [], requestsByStatus: []
      }
    });
  }
});

module.exports = router;
