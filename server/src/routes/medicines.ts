import { Router } from 'express';
import { z } from 'zod';
import { requireRole } from '../middleware/auth';

const router = Router();

// Validation schemas
const createMedicineSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  genericName: z.string().optional(),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  minStockLevel: z.number().int().min(0, 'Min stock level must be non-negative'),
  expiryDate: z.string().datetime('Invalid expiry date'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  location: z.string().optional()
});

const updateMedicineSchema = createMedicineSchema.partial();

const querySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  lowStock: z.string().optional(),
  expiringSoon: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

// GET /api/medicines - Get all medicines with filtering and pagination
router.get('/', async (req, res, next) => {
  try {
    const query = querySchema.parse(req.query);
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '25');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { genericName: { contains: query.search } },
        { manufacturer: { contains: query.search } }
      ];
    }

    if (query.category) {
      where.category = { equals: query.category };
    }

    if (query.lowStock === 'true') {
      // For low stock, we need to use raw SQL or get all medicines and filter
      // For now, let's use a simple approach - medicines with quantity <= 10
      where.quantity = { lte: 10 };
    }

    if (query.expiringSoon === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expiryDate = { lte: thirtyDaysFromNow };
    }

    // Get medicines with pagination
    const [medicines, total] = await Promise.all([
      req.prisma.medicine.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      req.prisma.medicine.count({ where })
    ]);

    // Calculate stats
    const stats = await req.prisma.medicine.aggregate({
      _count: { id: true },
      _sum: { quantity: true }
    });

    const lowStockCount = await req.prisma.medicine.count({
      where: {
        quantity: { lte: 10 }
      }
    });

    const expiringSoonCount = await req.prisma.medicine.count({
      where: {
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      }
    });

    res.json({
      medicines,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalMedicines: stats._count.id,
        totalQuantity: stats._sum.quantity || 0,
        lowStockItems: lowStockCount,
        expiringSoon: expiringSoonCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/medicines/:id - Get single medicine
router.get('/:id', async (req, res, next) => {
  try {
    const medicine = await req.prisma.medicine.findUnique({
      where: { id: req.params.id }
    });

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    next(error);
  }
});

// POST /api/medicines - Create new medicine
router.post('/', requireRole(['ADMIN', 'PHARMACIST']), async (req, res, next) => {
  try {
    const data = createMedicineSchema.parse(req.body);

    const medicine = await req.prisma.medicine.create({
      data: {
        ...data,
        expiryDate: new Date(data.expiryDate)
      }
    });

    // Create alert if low stock
    if (medicine.quantity <= medicine.minStockLevel) {
      await req.prisma.alert.create({
        data: {
          type: 'STOCK',
          title: 'Low Stock Alert',
          message: `${medicine.name} - Only ${medicine.quantity} units remaining`,
          severity: medicine.quantity === 0 ? 'CRITICAL' : 'HIGH'
        }
      });
    }

    res.status(201).json(medicine);
  } catch (error) {
    next(error);
  }
});

// PUT /api/medicines/:id - Update medicine
router.put('/:id', requireRole(['ADMIN', 'PHARMACIST']), async (req, res, next) => {
  try {
    const data = updateMedicineSchema.parse(req.body);

    const updateData: any = { ...data };
    if (data.expiryDate) {
      updateData.expiryDate = new Date(data.expiryDate);
    }

    const medicine = await req.prisma.medicine.update({
      where: { id: req.params.id },
      data: updateData
    });

    // Check for alerts after update
    if (data.quantity !== undefined && medicine.quantity <= medicine.minStockLevel) {
      await req.prisma.alert.create({
        data: {
          type: 'STOCK',
          title: 'Low Stock Alert',
          message: `${medicine.name} - Only ${medicine.quantity} units remaining`,
          severity: medicine.quantity === 0 ? 'CRITICAL' : 'HIGH'
        }
      });
    }

    res.json(medicine);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/medicines/:id - Delete medicine
router.delete('/:id', requireRole(['ADMIN']), async (req, res, next) => {
  try {
    await req.prisma.medicine.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /api/medicines/categories - Get all categories
router.get('/meta/categories', async (req, res, next) => {
  try {
    const categories = await req.prisma.medicine.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' }
    });

    res.json(categories.map(c => c.category));
  } catch (error) {
    next(error);
  }
});

export default router;