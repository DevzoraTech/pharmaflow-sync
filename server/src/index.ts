import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';

// Import routes
import medicineRoutes from './routes/medicines';
import customerRoutes from './routes/customers';
import prescriptionRoutes from './routes/prescriptions';
import saleRoutes from './routes/sales';
import userRoutes from './routes/users';
import alertRoutes from './routes/alerts';
import dashboardRoutes from './routes/dashboard';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make Prisma available to all routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', userRoutes);
app.use('/api/medicines', authMiddleware, medicineRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/prescriptions', authMiddleware, prescriptionRoutes);
app.use('/api/sales', authMiddleware, saleRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient;
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}