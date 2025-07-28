# PharmaFlow Sync - Backend API

A comprehensive REST API for the PharmaFlow Sync pharmacy management system built with Node.js, Express, TypeScript, and Prisma.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **Medicine Management** - Full CRUD operations with stock tracking and expiry alerts
- **Customer Management** - Customer profiles with purchase history
- **Prescription Management** - Digital prescription processing and fulfillment
- **Sales Management** - POS system with payment tracking and reporting
- **Alert System** - Automated alerts for low stock, expiring medicines, and system events
- **Dashboard Analytics** - Real-time statistics and reporting
- **Database** - SQLite with Prisma ORM for development (easily switchable to PostgreSQL/MySQL)

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (Prisma ORM)
- **Authentication**: JWT + bcryptjs
- **Validation**: Zod
- **Security**: Helmet, CORS

## 📦 Installation

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional):
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-super-secret-jwt-key"
   FRONTEND_URL="http://localhost:8080"
   PORT=3001
   ```

4. **Initialize database**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Seed database with sample data**:
   ```bash
   npm run db:seed
   ```

6. **Start development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## 🔐 Authentication

### Default Users (after seeding):
- **Admin**: `admin@pharmacare.com` / `admin123`
- **Pharmacist**: `pharmacist@pharmacare.com` / `pharmacist123`

### Login Process:
1. POST `/api/auth/login` with email/password
2. Receive JWT token in response
3. Include token in Authorization header: `Bearer <token>`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify JWT token

### Medicines
- `GET /api/medicines` - Get all medicines (with filtering & pagination)
- `GET /api/medicines/:id` - Get single medicine
- `POST /api/medicines` - Create new medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine
- `GET /api/medicines/meta/categories` - Get all categories

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Prescriptions
- `GET /api/prescriptions` - Get all prescriptions
- `GET /api/prescriptions/:id` - Get single prescription
- `POST /api/prescriptions` - Create new prescription
- `PUT /api/prescriptions/:id` - Update prescription
- `POST /api/prescriptions/:id/fill` - Fill prescription (create sale)

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get single sale
- `POST /api/sales` - Create new sale
- `GET /api/sales/stats/summary` - Get sales statistics

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/stats` - Get alert statistics
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/:id/read` - Mark alert as read
- `PUT /api/alerts/read-all` - Mark all alerts as read
- `DELETE /api/alerts/:id` - Delete alert
- `POST /api/alerts/check-stock` - Check for low stock alerts
- `POST /api/alerts/check-expiry` - Check for expiry alerts

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-transactions` - Get recent transactions
- `GET /api/dashboard/sales-chart` - Get sales chart data

## 🔒 Role-Based Access Control

- **ADMIN**: Full access to all endpoints
- **PHARMACIST**: Can manage medicines, prescriptions, customers, and sales
- **TECHNICIAN**: Can view and update medicines, assist with prescriptions
- **CASHIER**: Can process sales and view customer information

## 📊 Database Schema

The database includes the following main entities:
- **Users** - System users with roles
- **Medicines** - Medicine inventory with stock tracking
- **Customers** - Customer profiles and medical information
- **Prescriptions** - Digital prescriptions with items
- **Sales** - Sales transactions with items
- **Alerts** - System alerts and notifications
- **Attendance** - Employee attendance tracking

## 🧪 Development

### Database Management:
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

### Build for Production:
```bash
npm run build
npm start
```

## 🚀 Deployment

The API is ready for deployment to platforms like:
- Heroku
- Railway
- Vercel
- DigitalOcean App Platform
- AWS/GCP/Azure

For production, consider switching to PostgreSQL or MySQL by updating the `DATABASE_URL` in your environment variables.

## 📝 Sample Data

After running the seed script, you'll have:
- 8 sample medicines with various stock levels and expiry dates
- 3 sample customers
- 2 user accounts (admin and pharmacist)
- 4 sample alerts

## 🔧 Configuration

Key environment variables:
- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS
- `PORT` - Server port (default: 3001)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.