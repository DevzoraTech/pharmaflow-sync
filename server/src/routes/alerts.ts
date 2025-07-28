import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createAlertSchema = z.object({
  type: z.enum(['STOCK', 'EXPIRY', 'SYSTEM', 'PRESCRIPTION']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
});

// GET /api/alerts - Get all alerts
router.get('/', async (req, res, next) => {
  try {
    const { 
      type, 
      severity, 
      isRead, 
      page = '1', 
      limit = '25' 
    } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (severity) {
      where.severity = severity;
    }
    
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const [alerts, total] = await Promise.all([
      req.prisma.alert.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' }
      }),
      req.prisma.alert.count({ where })
    ]);

    res.json({
      alerts,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/alerts/stats - Get alert statistics
router.get('/stats', async (req, res, next) => {
  try {
    const [totalAlerts, unreadAlerts, alertsByType, alertsBySeverity] = await Promise.all([
      req.prisma.alert.count(),
      req.prisma.alert.count({ where: { isRead: false } }),
      req.prisma.alert.groupBy({
        by: ['type'],
        _count: { id: true },
        where: { isRead: false }
      }),
      req.prisma.alert.groupBy({
        by: ['severity'],
        _count: { id: true },
        where: { isRead: false }
      })
    ]);

    res.json({
      total: totalAlerts,
      unread: unreadAlerts,
      byType: alertsByType,
      bySeverity: alertsBySeverity
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/alerts - Create new alert
router.post('/', async (req, res, next) => {
  try {
    const data = createAlertSchema.parse(req.body);

    const alert = await req.prisma.alert.create({
      data
    });

    res.status(201).json(alert);
  } catch (error) {
    next(error);
  }
});

// PUT /api/alerts/:id/read - Mark alert as read
router.put('/:id/read', async (req, res, next) => {
  try {
    const alert = await req.prisma.alert.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });

    res.json(alert);
  } catch (error) {
    next(error);
  }
});

// PUT /api/alerts/read-all - Mark all alerts as read
router.put('/read-all', async (req, res, next) => {
  try {
    const { type, severity } = req.body;
    
    const where: any = { isRead: false };
    if (type) where.type = type;
    if (severity) where.severity = severity;

    const result = await req.prisma.alert.updateMany({
      where,
      data: { isRead: true }
    });

    res.json({ updated: result.count });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', async (req, res, next) => {
  try {
    await req.prisma.alert.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/alerts/check-stock - Check for low stock and create alerts
router.post('/check-stock', async (req, res, next) => {
  try {
    const lowStockMedicines = await req.prisma.medicine.findMany({
      where: {
        OR: [
          { quantity: { lte: req.prisma.medicine.fields.minStockLevel } },
          { quantity: 0 }
        ]
      }
    });

    const alerts = [];
    for (const medicine of lowStockMedicines) {
      // Check if alert already exists for this medicine
      const existingAlert = await req.prisma.alert.findFirst({
        where: {
          type: 'STOCK',
          message: { contains: medicine.name },
          isRead: false
        }
      });

      if (!existingAlert) {
        const alert = await req.prisma.alert.create({
          data: {
            type: 'STOCK',
            title: 'Low Stock Alert',
            message: `${medicine.name} - Only ${medicine.quantity} units remaining`,
            severity: medicine.quantity === 0 ? 'CRITICAL' : 'HIGH'
          }
        });
        alerts.push(alert);
      }
    }

    res.json({ created: alerts.length, alerts });
  } catch (error) {
    next(error);
  }
});

// POST /api/alerts/check-expiry - Check for expiring medicines and create alerts
router.post('/check-expiry', async (req, res, next) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringMedicines = await req.prisma.medicine.findMany({
      where: {
        expiryDate: { lte: thirtyDaysFromNow }
      }
    });

    const alerts = [];
    for (const medicine of expiringMedicines) {
      // Check if alert already exists for this medicine
      const existingAlert = await req.prisma.alert.findFirst({
        where: {
          type: 'EXPIRY',
          message: { contains: medicine.name },
          isRead: false
        }
      });

      if (!existingAlert) {
        const daysUntilExpiry = Math.ceil(
          (medicine.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        const alert = await req.prisma.alert.create({
          data: {
            type: 'EXPIRY',
            title: 'Medicine Expiring Soon',
            message: `${medicine.name} expires in ${daysUntilExpiry} days`,
            severity: daysUntilExpiry <= 7 ? 'CRITICAL' : daysUntilExpiry <= 14 ? 'HIGH' : 'MEDIUM'
          }
        });
        alerts.push(alert);
      }
    }

    res.json({ created: alerts.length, alerts });
  } catch (error) {
    next(error);
  }
});

export default router;