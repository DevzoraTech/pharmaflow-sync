import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@pharmacare.com' },
    update: {},
    create: {
      email: 'admin@pharmacare.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  // Create pharmacist user
  const pharmacistUser = await prisma.user.upsert({
    where: { email: 'pharmacist@pharmacare.com' },
    update: {},
    create: {
      email: 'pharmacist@pharmacare.com',
      name: 'John Pharmacist',
      password: await bcrypt.hash('pharmacist123', 12),
      role: 'PHARMACIST'
    }
  });

  console.log('✅ Users created');

  // Create medicines
  const medicines = [
    {
      name: 'Paracetamol 500mg',
      genericName: 'Acetaminophen',
      manufacturer: 'PharmaCorp',
      category: 'Pain Relief',
      description: 'Pain reliever and fever reducer',
      price: 8.99,
      quantity: 150,
      minStockLevel: 50,
      expiryDate: new Date('2024-12-15'),
      batchNumber: 'PC001',
      location: 'A1-B2'
    },
    {
      name: 'Amoxicillin 250mg',
      genericName: 'Amoxicillin',
      manufacturer: 'MediLab',
      category: 'Antibiotics',
      description: 'Broad-spectrum antibiotic',
      price: 15.50,
      quantity: 5,
      minStockLevel: 20,
      expiryDate: new Date('2024-08-10'),
      batchNumber: 'ML205',
      location: 'C3-D1'
    },
    {
      name: 'Ibuprofen 400mg',
      genericName: 'Ibuprofen',
      manufacturer: 'HealthMax',
      category: 'Anti-inflammatory',
      description: 'Anti-inflammatory pain reliever',
      price: 12.25,
      quantity: 75,
      minStockLevel: 30,
      expiryDate: new Date('2025-03-20'),
      batchNumber: 'HM302',
      location: 'A2-C3'
    },
    {
      name: 'Vitamin D3 1000IU',
      genericName: 'Cholecalciferol',
      manufacturer: 'VitaMax',
      category: 'Vitamins',
      description: 'Vitamin D supplement',
      price: 18.99,
      quantity: 200,
      minStockLevel: 100,
      expiryDate: new Date('2025-06-30'),
      batchNumber: 'VM401',
      location: 'B1-A3'
    },
    {
      name: 'Aspirin 325mg',
      genericName: 'Acetylsalicylic Acid',
      manufacturer: 'PharmaCorp',
      category: 'Pain Relief',
      description: 'Pain reliever and blood thinner',
      price: 6.50,
      quantity: 0,
      minStockLevel: 25,
      expiryDate: new Date('2024-11-20'),
      batchNumber: 'PC205',
      location: 'A1-C1'
    },
    {
      name: 'Metformin 500mg',
      genericName: 'Metformin HCl',
      manufacturer: 'DiabetCare',
      category: 'Diabetes',
      description: 'Type 2 diabetes medication',
      price: 22.75,
      quantity: 120,
      minStockLevel: 50,
      expiryDate: new Date('2025-01-15'),
      batchNumber: 'DC301',
      location: 'D2-B1'
    },
    {
      name: 'Omeprazole 20mg',
      genericName: 'Omeprazole',
      manufacturer: 'GastroMed',
      category: 'Gastrointestinal',
      description: 'Proton pump inhibitor',
      price: 28.50,
      quantity: 15,
      minStockLevel: 30,
      expiryDate: new Date('2024-09-05'),
      batchNumber: 'GM102',
      location: 'C1-D2'
    },
    {
      name: 'Lisinopril 10mg',
      genericName: 'Lisinopril',
      manufacturer: 'CardioPharm',
      category: 'Cardiovascular',
      description: 'ACE inhibitor for blood pressure',
      price: 19.25,
      quantity: 85,
      minStockLevel: 40,
      expiryDate: new Date('2025-04-12'),
      batchNumber: 'CP501',
      location: 'B2-A1'
    }
  ];

  for (const medicine of medicines) {
    // Check if medicine already exists by name and batch number
    const existing = await prisma.medicine.findFirst({
      where: { 
        name: medicine.name,
        batchNumber: medicine.batchNumber 
      }
    });

    if (!existing) {
      await prisma.medicine.create({
        data: medicine
      });
    }
  }

  console.log('✅ Medicines created');

  // Create customers
  const customers = [
    {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1-555-0101',
      address: '123 Main St, Anytown, ST 12345',
      dateOfBirth: new Date('1980-05-15'),
      allergies: JSON.stringify(['Penicillin', 'Sulfa'])
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+1-555-0102',
      address: '456 Oak Ave, Somewhere, ST 12346',
      dateOfBirth: new Date('1975-09-22'),
      allergies: JSON.stringify(['Aspirin'])
    },
    {
      name: 'Michael Brown',
      email: 'michael.brown@email.com',
      phone: '+1-555-0103',
      address: '789 Pine Rd, Elsewhere, ST 12347',
      dateOfBirth: new Date('1990-12-03'),
      allergies: null
    }
  ];

  for (const customer of customers) {
    // Check if customer already exists by email
    const existing = await prisma.customer.findFirst({
      where: { email: customer.email }
    });

    if (!existing) {
      await prisma.customer.create({
        data: customer
      });
    }
  }

  console.log('✅ Customers created');

  // Create some alerts
  const alerts = [
    {
      type: 'STOCK' as const,
      title: 'Low Stock Alert',
      message: 'Amoxicillin 250mg - Only 5 units remaining',
      severity: 'HIGH' as const
    },
    {
      type: 'STOCK' as const,
      title: 'Out of Stock',
      message: 'Aspirin 325mg is completely out of stock',
      severity: 'CRITICAL' as const
    },
    {
      type: 'EXPIRY' as const,
      title: 'Expiring Soon',
      message: 'Amoxicillin 250mg expires in 3 days',
      severity: 'HIGH' as const
    },
    {
      type: 'SYSTEM' as const,
      title: 'System Update',
      message: 'Pharmacy management system updated successfully',
      severity: 'LOW' as const
    }
  ];

  for (const alert of alerts) {
    await prisma.alert.create({
      data: alert
    });
  }

  console.log('✅ Alerts created');

  console.log('🎉 Database seeded successfully!');
  console.log('👤 Admin login: admin@pharmacare.com / admin123');
  console.log('👤 Pharmacist login: pharmacist@pharmacare.com / pharmacist123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });