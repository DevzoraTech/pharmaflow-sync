import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  allergies: z.array(z.string()).optional()
});

const updateCustomerSchema = createCustomerSchema.partial();

// GET /api/customers - Get all customers
router.get('/', async (req, res, next) => {
  try {
    const { search, page = '1', limit = '25' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
        { phone: { contains: search as string } }
      ];
    }

    const [customers, total] = await Promise.all([
      req.prisma.customer.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              prescriptions: true,
              sales: true
            }
          }
        }
      }),
      req.prisma.customer.count({ where })
    ]);

    res.json({
      customers,
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

// GET /api/customers/:id - Get single customer
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await req.prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        sales: {
          orderBy: { saleDate: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// POST /api/customers - Create new customer
router.post('/', async (req, res, next) => {
  try {
    const data = createCustomerSchema.parse(req.body);

    const customerData: any = {
      ...data,
      allergies: data.allergies ? JSON.stringify(data.allergies) : null
    };

    if (data.dateOfBirth) {
      customerData.dateOfBirth = new Date(data.dateOfBirth);
    }

    const customer = await req.prisma.customer.create({
      data: customerData
    });

    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', async (req, res, next) => {
  try {
    const data = updateCustomerSchema.parse(req.body);

    const updateData: any = { ...data };
    if (data.allergies) {
      updateData.allergies = JSON.stringify(data.allergies);
    }
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }

    const customer = await req.prisma.customer.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', async (req, res, next) => {
  try {
    await req.prisma.customer.delete({
      where: { id: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;