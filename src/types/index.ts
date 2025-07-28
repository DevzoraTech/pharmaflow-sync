export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  manufacturer: string;
  category: string;
  description?: string;
  price: number;
  quantity: number;
  minStockLevel: number;
  expiryDate: string;
  batchNumber: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  customerId: string;
  doctorName: string;
  prescriptionNumber: string;
  issueDate: string;
  status: 'pending' | 'filled' | 'partial' | 'cancelled';
  items: PrescriptionItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Sale {
  id: string;
  customerId?: string;
  prescriptionId?: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'insurance' | 'credit';
  saleDate: string;
  cashierId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  medicineId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'pharmacist' | 'technician' | 'cashier';
  phone?: string;
  address?: string;
  hireDate: string;
  salary?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  type: 'sales' | 'inventory' | 'expiry' | 'attendance';
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
  data: any;
  generatedBy: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'pharmacist' | 'technician' | 'cashier';