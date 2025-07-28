import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Validation schemas
const saleItemSchema = z.object({
  medicineId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0)
});

const createSaleSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['CASH', 'CARD', 'INSURANCE', 'CREDIT']),
  discount: z.number().min(0).default(0),
  notes: z.string().optional()
});

// GET /api/sales - Get all sales
router.get('/', async (req, res, next) => {
  try {
    const { 
      startDate, 
      endDate, 
      paymentMethod, 
      customerId,
      page = '1', 
      limit = '25' 
    } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    
    if (startDate && endDate) {
      where.saleDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }
    
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }
    
    if (customerId) {
      where.customerId = customerId;
    }

    const [sales, total] = await Promise.all([
      req.prisma.sale.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { saleDate: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true }
          },
          prescription: {
            select: { id: true, prescriptionNumber: true }
          },
          cashier: {
            select: { id: true, name: true }
          },
          items: {
            include: {
              medicine: {
                select: { id: true, name: true, genericName: true }
              }
            }
          }
        }
      }),
      req.prisma.sale.count({ where })
    ]);

    res.json({
      sales,
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

// GET /api/sales/:id - Get single sale
router.get('/:id', async (req, res, next) => {
  try {
    const sale = await req.prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        prescription: true,
        cashier: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            medicine: true
          }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json(sale);
  } catch (error) {
    next(error);
  }
});

// POST /api/sales - Create new sale
router.post('/', async (req, res, next) => {
  try {
    const data = createSaleSchema.parse(req.body);

    // Validate medicine availability and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of data.items) {
      const medicine = await req.prisma.medicine.findUnique({
        where: { id: item.medicineId }
      });

      if (!medicine) {
        return res.status(400).json({ error: `Medicine not found: ${item.medicineId}` });
      }

      if (medicine.quantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${medicine.name}. Available: ${medicine.quantity}, Required: ${item.quantity}` 
        });
      }

      const itemSubtotal = (item.quantity * item.unitPrice) - item.discount;
      subtotal += itemSubtotal;

      validatedItems.push({
        ...item,
        subtotal: itemSubtotal
      });
    }

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax - data.discount;

    // Create sale and update stock in transaction
    const result = await req.prisma.$transaction(async (prisma) => {
      // Create sale
      const sale = await prisma.sale.create({
        data: {
          customerId: data.customerId,
          subtotal,
          tax,
          discount: data.discount,
          total,
          paymentMethod: data.paymentMethod,
          cashierId: req.user!.id,
          notes: data.notes,
          items: {
            create: validatedItems
          }
        },
        include: {
          customer: true,
          items: {
            include: {
              medicine: true
            }
          }
        }
      });

      // Update medicine quantities
      for (const item of data.items) {
        await prisma.medicine.update({
          where: { id: item.medicineId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });

        // Check if medicine is now low stock and create alert
        const updatedMedicine = await prisma.medicine.findUnique({
          where: { id: item.medicineId }
        });

        if (updatedMedicine && updatedMedicine.quantity <= updatedMedicine.minStockLevel) {
          await prisma.alert.create({
            data: {
              type: 'STOCK',
              title: 'Low Stock Alert',
              message: `${updatedMedicine.name} - Only ${updatedMedicine.quantity} units remaining`,
              severity: updatedMedicine.quantity === 0 ? 'CRITICAL' : 'HIGH'
            }
          });
        }
      }

      return sale;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/sales/stats/summary - Get sales summary statistics
router.get('/stats/summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate && endDate) {
      where.saleDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const [totalSales, salesByPaymentMethod, topMedicines] = await Promise.all([
      req.prisma.sale.aggregate({
        where,
        _sum: { total: true, tax: true, discount: true },
        _count: { id: true },
        _avg: { total: true }
      }),
      req.prisma.sale.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { total: true },
        _count: { id: true }
      }),
      req.prisma.saleItem.groupBy({
        by: ['medicineId'],
        where: {
          sale: where
        },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { subtotal: 'desc' } },
        take: 10
      })
    ]);

    // Get medicine details for top medicines
    const medicineIds = topMedicines.map(item => item.medicineId);
    const medicines = await req.prisma.medicine.findMany({
      where: { id: { in: medicineIds } },
      select: { id: true, name: true, genericName: true }
    });

    const topMedicinesWithDetails = topMedicines.map(item => ({
      ...item,
      medicine: medicines.find(m => m.id === item.medicineId)
    }));

    res.json({
      totalSales: totalSales._sum.total || 0,
      totalTransactions: totalSales._count || 0,
      averageSale: totalSales._avg.total || 0,
      totalTax: totalSales._sum.tax || 0,
      totalDiscount: totalSales._sum.discount || 0,
      salesByPaymentMethod,
      topMedicines: topMedicinesWithDetails
    });
  } catch (error) {
    next(error);
  }
});

export default router;