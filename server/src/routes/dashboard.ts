import { Router } from 'express';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

const router = Router();

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const yesterday = subDays(today, 1);
    const startOfYesterday = startOfDay(yesterday);
    const endOfYesterday = endOfDay(yesterday);

    // Sales stats
    const [todaySales, yesterdaySales] = await Promise.all([
      req.prisma.sale.aggregate({
        where: {
          saleDate: {
            gte: startOfToday,
            lte: endOfToday
          }
        },
        _sum: { total: true },
        _count: { id: true }
      }),
      req.prisma.sale.aggregate({
        where: {
          saleDate: {
            gte: startOfYesterday,
            lte: endOfYesterday
          }
        },
        _sum: { total: true },
        _count: { id: true }
      })
    ]);

    // Medicine stats
    const medicineStats = await req.prisma.medicine.aggregate({
      _count: { id: true },
      _sum: { quantity: true }
    });

    // Low stock count
    const lowStockCount = await req.prisma.medicine.count({
      where: {
        OR: [
          { quantity: { lte: req.prisma.medicine.fields.minStockLevel } },
          { quantity: 0 }
        ]
      }
    });

    // Expiring soon count (next 30 days)
    const expiringSoonCount = await req.prisma.medicine.count({
      where: {
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    // Customer stats
    const customerStats = await req.prisma.customer.aggregate({
      _count: { id: true }
    });

    // Customers served today
    const customersServedToday = await req.prisma.sale.findMany({
      where: {
        saleDate: {
          gte: startOfToday,
          lte: endOfToday
        },
        customerId: { not: null }
      },
      select: { customerId: true },
      distinct: ['customerId']
    });

    // Pending prescriptions
    const pendingPrescriptions = await req.prisma.prescription.count({
      where: { status: 'PENDING' }
    });

    // Calculate percentage changes
    const salesChange = yesterdaySales._sum.total 
      ? ((todaySales._sum.total || 0) - (yesterdaySales._sum.total || 0)) / (yesterdaySales._sum.total || 1) * 100
      : 0;

    const transactionChange = yesterdaySales._count
      ? ((todaySales._count || 0) - (yesterdaySales._count || 0)) / (yesterdaySales._count || 1) * 100
      : 0;

    res.json({
      sales: {
        today: todaySales._sum.total || 0,
        change: salesChange,
        transactions: todaySales._count || 0,
        transactionChange: transactionChange
      },
      medicines: {
        total: medicineStats._count.id || 0,
        totalQuantity: medicineStats._sum.quantity || 0,
        lowStock: lowStockCount,
        expiringSoon: expiringSoonCount
      },
      customers: {
        total: customerStats._count.id || 0,
        servedToday: customersServedToday.length
      },
      prescriptions: {
        pending: pendingPrescriptions
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/recent-transactions - Get recent transactions
router.get('/recent-transactions', async (req, res, next) => {
  try {
    const transactions = await req.prisma.sale.findMany({
      take: 10,
      orderBy: { saleDate: 'desc' },
      include: {
        customer: {
          select: { name: true }
        },
        prescription: {
          select: { prescriptionNumber: true }
        }
      }
    });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/sales-chart - Get sales data for chart
router.get('/sales-chart', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const salesData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const startOfDate = startOfDay(date);
      const endOfDate = endOfDay(date);

      const daySales = await req.prisma.sale.aggregate({
        where: {
          saleDate: {
            gte: startOfDate,
            lte: endOfDate
          }
        },
        _sum: { total: true },
        _count: { id: true }
      });

      salesData.push({
        date: format(date, 'yyyy-MM-dd'),
        sales: daySales._sum.total || 0,
        transactions: daySales._count || 0
      });
    }

    res.json(salesData);
  } catch (error) {
    next(error);
  }
});

export default router;