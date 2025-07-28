import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Validation schemas
const prescriptionItemSchema = z.object({
  medicineId: z.string(),
  quantity: z.number().int().positive(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string().optional()
});

const createPrescriptionSchema = z.object({
  customerId: z.string(),
  doctorName: z.string().min(1, 'Doctor name is required'),
  prescriptionNumber: z.string().min(1, 'Prescription number is required'),
  issueDate: z.string().datetime(),
  notes: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one item is required')
});

const updatePrescriptionSchema = z.object({
  status: z.enum(['PENDING', 'FILLED', 'PARTIAL', 'CANCELLED']).optional(),
  notes: z.string().optional()
});

// GET /api/prescriptions - Get all prescriptions
router.get('/', async (req, res, next) => {
  try {
    const { status, search, page = '1', limit = '25' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { prescriptionNumber: { contains: search as string } },
        { doctorName: { contains: search as string } },
        { customer: { name: { contains: search as string } } }
      ];
    }

    const [prescriptions, total] = await Promise.all([
      req.prisma.prescription.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true }
          },
          items: {
            include: {
              medicine: {
                select: { id: true, name: true, price: true }
              }
            }
          },
          _count: {
            select: { items: true }
          }
        }
      }),
      req.prisma.prescription.count({ where })
    ]);

    res.json({
      prescriptions,
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

// GET /api/prescriptions/:id - Get single prescription
router.get('/:id', async (req, res, next) => {
  try {
    const prescription = await req.prisma.prescription.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: {
          include: {
            medicine: true
          }
        }
      }
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(prescription);
  } catch (error) {
    next(error);
  }
});

// POST /api/prescriptions - Create new prescription
router.post('/', async (req, res, next) => {
  try {
    const data = createPrescriptionSchema.parse(req.body);

    const prescription = await req.prisma.prescription.create({
      data: {
        customerId: data.customerId,
        doctorName: data.doctorName,
        prescriptionNumber: data.prescriptionNumber,
        issueDate: new Date(data.issueDate),
        notes: data.notes,
        items: {
          create: data.items
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

    res.status(201).json(prescription);
  } catch (error) {
    next(error);
  }
});

// PUT /api/prescriptions/:id - Update prescription
router.put('/:id', async (req, res, next) => {
  try {
    const data = updatePrescriptionSchema.parse(req.body);

    const prescription = await req.prisma.prescription.update({
      where: { id: req.params.id },
      data,
      include: {
        customer: true,
        items: {
          include: {
            medicine: true
          }
        }
      }
    });

    res.json(prescription);
  } catch (error) {
    next(error);
  }
});

// POST /api/prescriptions/:id/fill - Fill prescription (create sale)
router.post('/:id/fill', async (req, res, next) => {
  try {
    const prescriptionId = req.params.id;
    const { paymentMethod = 'CASH', discount = 0 } = req.body;

    // Get prescription with items
    const prescription = await req.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: {
          include: {
            medicine: true
          }
        }
      }
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (prescription.status !== 'PENDING') {
      return res.status(400).json({ error: 'Prescription is not pending' });
    }

    // Check stock availability
    for (const item of prescription.items) {
      if (item.medicine.quantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.medicine.name}. Available: ${item.medicine.quantity}, Required: ${item.quantity}` 
        });
      }
    }

    // Calculate totals
    let subtotal = 0;
    const saleItems = prescription.items.map(item => {
      const itemSubtotal = item.quantity * item.medicine.price;
      subtotal += itemSubtotal;
      return {
        medicineId: item.medicineId,
        quantity: item.quantity,
        unitPrice: item.medicine.price,
        subtotal: itemSubtotal,
        discount: 0
      };
    });

    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax - discount;

    // Create sale and update stock in transaction
    const result = await req.prisma.$transaction(async (prisma) => {
      // Create sale
      const sale = await prisma.sale.create({
        data: {
          customerId: prescription.customerId,
          prescriptionId: prescriptionId,
          subtotal,
          tax,
          discount,
          total,
          paymentMethod,
          cashierId: req.user!.id,
          items: {
            create: saleItems
          }
        },
        include: {
          items: {
            include: {
              medicine: true
            }
          }
        }
      });

      // Update medicine quantities
      for (const item of prescription.items) {
        await prisma.medicine.update({
          where: { id: item.medicineId },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      // Update prescription status
      await prisma.prescription.update({
        where: { id: prescriptionId },
        data: { status: 'FILLED' }
      });

      return sale;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;