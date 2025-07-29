import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { 
  Plus, 
  Users, 
  UserCheck, 
  Clock, 
  DollarSign,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  Download,
  Eye,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// TypeScript interfaces based on Supabase schema
type User = Tables<'users'>;
type AttendanceDB = Tables<'attendance'>;

interface Employee extends User {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  position?: string;
  department?: string;
  salary?: number;
  hourlyRate?: number;
  hireDate?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  qualifications?: string[];
  notes?: string;
  avatar?: string;
}

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  breakTime: number;
  totalHours: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';
  notes?: string;
}

interface StaffStats {
  totalStaff: number;
  presentToday: number;
  avgHoursPerDay: number;
  monthlyPayroll: number;
  activeEmployees: number;
  onLeave: number;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE';
  hoursWorked?: number;
  notes?: string;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
    position: string;
    salary: number;
  };
  month: string;
  year: number;
  baseSalary: number;
  overtime: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
  payDate?: string;
}

interface SalaryRecord {
  id: string;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
    position: string;
  };
  month: string;
  year: number;
  baseSalary: number;
  overtime: number;
  bonuses: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
  amountPaid: number;
  balance: number;
  paymentDate?: string;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY';
  paymentReference?: string;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'FULLY_PAID';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SalaryPayment {
  id: string;
  salaryRecordId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY';
  paymentReference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export default function Staff() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<StaffStats>({
    totalStaff: 0,
    presentToday: 0,
    avgHoursPerDay: 0,
    monthlyPayroll: 0,
    activeEmployees: 0,
    onLeave: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("employees");

  // Form states
  const [formData, setFormData] = useState<Partial<Employee>>({});

  // Attendance states
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceFilter, setAttendanceFilter] = useState("all");

  // Payroll states
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [payrollFilter, setPayrollFilter] = useState("all");

  // Salary Records states
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [selectedSalaryRecord, setSelectedSalaryRecord] = useState<SalaryRecord | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    paymentMethod: 'CASH' as 'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY',
    paymentReference: '',
    notes: ''
  });

  // Salary management system
  const salaryRanges = {
    ADMIN: { min: 2500000, max: 5000000, default: 3500000 },
    MANAGER: { min: 2000000, max: 4000000, default: 3000000 },
    PHARMACIST: { min: 1800000, max: 3500000, default: 2500000 },
    TECHNICIAN: { min: 1200000, max: 2500000, default: 1800000 },
    CASHIER: { min: 1000000, max: 2000000, default: 1500000 },
    STAFF: { min: 800000, max: 1800000, default: 1200000 }
  };

  const positionSalaryRanges = {
    'Administrator': salaryRanges.ADMIN,
    'Manager': salaryRanges.MANAGER,
    'Pharmacist': salaryRanges.PHARMACIST,
    'Senior Pharmacist': { min: 2200000, max: 4000000, default: 3000000 },
    'Pharmacy Technician': salaryRanges.TECHNICIAN,
    'Cashier': salaryRanges.CASHIER,
    'Sales Associate': { min: 900000, max: 1600000, default: 1300000 },
    'Inventory Manager': { min: 1500000, max: 2800000, default: 2000000 },
    'Customer Service': { min: 800000, max: 1500000, default: 1100000 },
    'Security Guard': { min: 600000, max: 1200000, default: 900000 },
    'Cleaner': { min: 500000, max: 900000, default: 700000 }
  };

  // Get salary range for a position
  const getSalaryRange = (position: string, role: string) => {
    return positionSalaryRanges[position as keyof typeof positionSalaryRanges] || 
           salaryRanges[role?.toUpperCase() as keyof typeof salaryRanges] || 
           salaryRanges.STAFF;
  };

  // Validate salary against position/role
  const validateSalary = (salary: number, position: string, role: string) => {
    const range = getSalaryRange(position, role);
    return {
      isValid: salary >= range.min && salary <= range.max,
      min: range.min,
      max: range.max,
      suggested: range.default
    };
  };

  // Auto-suggest salary based on position/role
  const suggestSalary = (position: string, role: string) => {
    const range = getSalaryRange(position, role);
    return range.default;
  };

  // Mark payroll as paid
  const markPayrollAsPaid = async (payrollId: string) => {
    try {
      setIsSubmitting(true);
      
      // Update the payroll record status
      setPayrollRecords(prev => prev.map(record => 
        record.id === payrollId 
          ? { ...record, status: 'PAID', payDate: new Date().toISOString() }
          : record
      ));
      
      // In a real app, this would update the database
      // await supabase.from('payroll').update({ status: 'PAID', pay_date: new Date().toISOString() }).eq('id', payrollId);
      
    } catch (err) {
      setError('Failed to mark payroll as paid');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Process payroll (change status from PENDING to PROCESSED)
  const processPayroll = async (payrollId: string) => {
    try {
      setIsSubmitting(true);
      
      setPayrollRecords(prev => prev.map(record => 
        record.id === payrollId 
          ? { ...record, status: 'PROCESSED' }
          : record
      ));
      
    } catch (err) {
      setError('Failed to process payroll');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate payslip (mock function)
  const generatePayslip = (payrollRecord: PayrollRecord) => {
    // In a real app, this would generate a PDF payslip
    const payslipData = {
      employee: payrollRecord.employee,
      period: `${payrollRecord.month} ${payrollRecord.year}`,
      baseSalary: payrollRecord.baseSalary,
      overtime: payrollRecord.overtime,
      bonuses: payrollRecord.bonuses,
      deductions: payrollRecord.deductions,
      netSalary: payrollRecord.netSalary,
      payDate: payrollRecord.payDate
    };
    
    console.log('Generating payslip for:', payslipData);
    alert(`Payslip generated for ${payrollRecord.employee.firstName} ${payrollRecord.employee.lastName}`);
  };

  // Generate real payroll based on employee data and attendance
  const generatePayroll = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Get the date range for the selected month
      const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

      // Fetch attendance data for the selected month
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          users!attendance_employee_id_fkey (
            id,
            name,
            email,
            role,
            is_active
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate);

      if (attendanceError) throw attendanceError;

      // Group attendance by employee
      const attendanceByEmployee = new Map();
      (attendanceData || []).forEach(record => {
        const employeeId = record.employee_id;
        if (!attendanceByEmployee.has(employeeId)) {
          attendanceByEmployee.set(employeeId, []);
        }
        attendanceByEmployee.get(employeeId).push(record);
      });

      // Generate payroll for active employees
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      
      const payrollData: PayrollRecord[] = employees
        .filter(emp => emp.status === 'ACTIVE')
        .map(emp => {
          const employeeAttendance = attendanceByEmployee.get(emp.id) || [];
          
          // Calculate total hours worked
          const totalHours = employeeAttendance.reduce((sum: number, record: any) => {
            return sum + (record.total_hours || 0);
          }, 0);

          // Calculate working days in month
          const workingDaysInMonth = 22; // Standard working days
          const standardHours = workingDaysInMonth * 8; // 8 hours per day
          
          // Base salary calculation
          const baseSalary = emp.salary || 0;
          
          // Overtime calculation (hours beyond standard)
          const overtimeHours = Math.max(0, totalHours - standardHours);
          const hourlyRate = emp.hourlyRate || (baseSalary / (workingDaysInMonth * 8));
          const overtime = overtimeHours * hourlyRate * 1.5; // 1.5x rate for overtime

          // Performance bonus (based on attendance)
          const attendanceRate = employeeAttendance.length / workingDaysInMonth;
          const bonuses = attendanceRate >= 0.95 ? baseSalary * 0.1 : // 10% bonus for 95%+ attendance
                         attendanceRate >= 0.90 ? baseSalary * 0.05 : 0; // 5% bonus for 90%+ attendance

          // Deductions (tax, insurance, etc.)
          const taxRate = 0.10; // 10% income tax
          const insuranceRate = 0.05; // 5% health insurance
          const deductions = (baseSalary + overtime + bonuses) * (taxRate + insuranceRate);

          // Net salary calculation
          const netSalary = baseSalary + overtime + bonuses - deductions;

          // Determine payment status based on current date
          const currentDate = new Date();
          const payrollMonth = new Date(selectedYear, selectedMonth - 1);
          let status: 'PENDING' | 'PROCESSED' | 'PAID' = 'PENDING';
          let payDate: string | undefined;

          if (payrollMonth < currentDate) {
            status = 'PAID';
            payDate = new Date(selectedYear, selectedMonth - 1, 28).toISOString();
          } else if (payrollMonth.getMonth() === currentDate.getMonth() && currentDate.getDate() > 25) {
            status = 'PROCESSED';
          }

          return {
            id: `payroll-${emp.id}-${selectedMonth}-${selectedYear}`,
            employeeId: emp.id,
            employee: {
              firstName: emp.firstName || '',
              lastName: emp.lastName || '',
              employeeId: emp.employeeId || '',
              position: emp.position || '',
              salary: baseSalary
            },
            month: monthNames[selectedMonth - 1],
            year: selectedYear,
            baseSalary,
            overtime,
            bonuses,
            deductions,
            netSalary,
            status,
            payDate,
            // Additional payroll details
            totalHours,
            workingDays: employeeAttendance.length,
            attendanceRate: Math.round(attendanceRate * 100)
          };
        });

      setPayrollRecords(payrollData);
      
      // Generate corresponding salary records
      generateSalaryRecords(payrollData);
    } catch (err) {
      console.error('Error generating payroll:', err);
      setError('Failed to generate payroll data');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate salary records from payroll data
  const generateSalaryRecords = (payrollData: PayrollRecord[]) => {
    const salaryRecordsData: SalaryRecord[] = payrollData.map(payroll => {
      const grossSalary = payroll.baseSalary + payroll.overtime + payroll.bonuses;
      
      return {
        id: `salary-${payroll.employeeId}-${payroll.month}-${payroll.year}`,
        employeeId: payroll.employeeId,
        employee: {
          firstName: payroll.employee.firstName,
          lastName: payroll.employee.lastName,
          employeeId: payroll.employee.employeeId,
          position: payroll.employee.position
        },
        month: payroll.month,
        year: payroll.year,
        baseSalary: payroll.baseSalary,
        overtime: payroll.overtime,
        bonuses: payroll.bonuses,
        deductions: payroll.deductions,
        grossSalary,
        netSalary: payroll.netSalary,
        amountPaid: payroll.status === 'PAID' ? payroll.netSalary : 0,
        balance: payroll.status === 'PAID' ? 0 : payroll.netSalary,
        paymentDate: payroll.payDate,
        paymentMethod: payroll.status === 'PAID' ? 'BANK_TRANSFER' : undefined,
        status: payroll.status === 'PAID' ? 'FULLY_PAID' : 'UNPAID',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    setSalaryRecords(salaryRecordsData);
  };

  // Record salary payment
  const recordSalaryPayment = async (salaryRecordId: string, paymentData: typeof paymentFormData) => {
    try {
      setIsSubmitting(true);
      
      const salaryRecord = salaryRecords.find(r => r.id === salaryRecordId);
      if (!salaryRecord) throw new Error('Salary record not found');

      // Create payment record
      const payment: SalaryPayment = {
        id: `payment-${Date.now()}`,
        salaryRecordId,
        amount: paymentData.amount,
        paymentDate: new Date().toISOString(),
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference,
        notes: paymentData.notes,
        createdBy: 'current-user', // In real app, get from auth
        createdAt: new Date().toISOString()
      };

      // Add payment to payments list
      setSalaryPayments(prev => [...prev, payment]);

      // Update salary record
      const newAmountPaid = salaryRecord.amountPaid + paymentData.amount;
      const newBalance = salaryRecord.netSalary - newAmountPaid;
      const newStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'FULLY_PAID' = 
        newBalance <= 0 ? 'FULLY_PAID' : 
        newAmountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID';

      setSalaryRecords(prev => prev.map(record => 
        record.id === salaryRecordId 
          ? {
              ...record,
              amountPaid: newAmountPaid,
              balance: newBalance,
              status: newStatus,
              paymentDate: newStatus === 'FULLY_PAID' ? new Date().toISOString() : record.paymentDate,
              updatedAt: new Date().toISOString()
            }
          : record
      ));

      // Reset form and close dialog
      setPaymentFormData({
        amount: 0,
        paymentMethod: 'CASH',
        paymentReference: '',
        notes: ''
      });
      setIsPaymentDialogOpen(false);
      setSelectedSalaryRecord(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get payment history for a salary record
  const getPaymentHistory = (salaryRecordId: string) => {
    return salaryPayments.filter(payment => payment.salaryRecordId === salaryRecordId);
  };

  // Handle payment dialog
  const handlePaymentDialog = (salaryRecord: SalaryRecord) => {
    setSelectedSalaryRecord(salaryRecord);
    setPaymentFormData({
      amount: salaryRecord.balance,
      paymentMethod: 'CASH',
      paymentReference: '',
      notes: ''
    });
    setIsPaymentDialogOpen(true);
  };

  // Mock data - In a real app, this would come from an API
  const mockEmployees: Employee[] = [
    {
      id: "1",
      employeeId: "EMP001",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@pharmaflow.com",
      phone: "+256 700 123 456",
      address: "123 Main St, Kampala",
      position: "Senior Pharmacist",
      department: "Pharmacy",
      role: "PHARMACIST",
      salary: 2500000,
      hourlyRate: 15000,
      hireDate: "2023-01-15",
      status: "ACTIVE",
      emergencyContact: {
        name: "Jane Doe",
        phone: "+256 700 654 321",
        relationship: "Spouse"
      },
      qualifications: ["PharmD", "Licensed Pharmacist"],
      notes: "Excellent performance, team leader",
      createdAt: "2023-01-15T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z"
    },
    {
      id: "2",
      employeeId: "EMP002",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@pharmaflow.com",
      phone: "+256 700 234 567",
      address: "456 Oak Ave, Kampala",
      position: "Pharmacy Technician",
      department: "Pharmacy",
      role: "TECHNICIAN",
      salary: 1800000,
      hourlyRate: 12000,
      hireDate: "2023-03-20",
      status: "ACTIVE",
      emergencyContact: {
        name: "Mike Johnson",
        phone: "+256 700 765 432",
        relationship: "Brother"
      },
      qualifications: ["Pharmacy Technician Certificate"],
      createdAt: "2023-03-20T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z"
    },
    {
      id: "3",
      employeeId: "EMP003",
      firstName: "David",
      lastName: "Wilson",
      email: "david.wilson@pharmaflow.com",
      phone: "+256 700 345 678",
      address: "789 Pine St, Kampala",
      position: "Store Manager",
      department: "Management",
      role: "MANAGER",
      salary: 3000000,
      hourlyRate: 18000,
      hireDate: "2022-11-10",
      status: "ACTIVE",
      emergencyContact: {
        name: "Lisa Wilson",
        phone: "+256 700 876 543",
        relationship: "Wife"
      },
      qualifications: ["MBA", "Retail Management Certificate"],
      createdAt: "2022-11-10T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z"
    },
    {
      id: "4",
      employeeId: "EMP004",
      firstName: "Emily",
      lastName: "Brown",
      email: "emily.brown@pharmaflow.com",
      phone: "+256 700 456 789",
      address: "321 Elm St, Kampala",
      position: "Cashier",
      department: "Sales",
      role: "CASHIER",
      salary: 1200000,
      hourlyRate: 8000,
      hireDate: "2023-06-01",
      status: "ACTIVE",
      emergencyContact: {
        name: "Tom Brown",
        phone: "+256 700 987 654",
        relationship: "Father"
      },
      qualifications: ["High School Diploma", "Customer Service Training"],
      createdAt: "2023-06-01T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z"
    },
    {
      id: "5",
      employeeId: "EMP005",
      firstName: "Michael",
      lastName: "Davis",
      email: "michael.davis@pharmaflow.com",
      phone: "+256 700 567 890",
      address: "654 Maple Ave, Kampala",
      position: "Junior Pharmacist",
      department: "Pharmacy",
      role: "PHARMACIST",
      salary: 2000000,
      hourlyRate: 13000,
      hireDate: "2023-08-15",
      status: "INACTIVE",
      emergencyContact: {
        name: "Anna Davis",
        phone: "+256 700 098 765",
        relationship: "Sister"
      },
      qualifications: ["PharmD", "Internship Certificate"],
      notes: "On medical leave",
      createdAt: "2023-08-15T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z"
    }
  ];

  // Fetch staff data
  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      // Fetch users from Supabase
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Transform users to employees format
      const employeesData: Employee[] = (users || []).map(user => ({
        ...user,
        employeeId: `EMP${String(user.id).slice(-3).padStart(3, '0')}`,
        firstName: user.name.split(' ')[0] || user.name,
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        phone: '+256 700 000 000', // Default phone
        address: 'Kampala, Uganda', // Default address
        position: user.role === 'admin' ? 'Administrator' : 
                 user.role === 'pharmacist' ? 'Pharmacist' : 
                 user.role === 'cashier' ? 'Cashier' : 'Staff',
        department: user.role === 'admin' ? 'Administration' : 
                   user.role === 'pharmacist' ? 'Pharmacy' : 'Sales',
        salary: user.role === 'admin' ? 3000000 : 
               user.role === 'pharmacist' ? 2500000 : 1500000,
        hourlyRate: user.role === 'admin' ? 18000 : 
                   user.role === 'pharmacist' ? 15000 : 10000,
        hireDate: user.created_at,
        status: user.is_active ? 'ACTIVE' : 'INACTIVE',
        emergencyContact: {
          name: 'Emergency Contact',
          phone: '+256 700 000 000',
          relationship: 'Family'
        },
        qualifications: user.role === 'pharmacist' ? ['PharmD', 'Licensed Pharmacist'] : 
                       user.role === 'admin' ? ['Management Certificate'] : ['Training Certificate'],
        notes: user.is_active ? 'Active employee' : 'Inactive employee'
      }));

      setEmployees(employeesData);
      
      // Calculate stats
      const activeEmployees = employeesData.filter(emp => emp.status === 'ACTIVE');
      const totalSalaries = activeEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
      
      setStats({
        totalStaff: employeesData.length,
        presentToday: activeEmployees.length,
        avgHoursPerDay: 8.0,
        monthlyPayroll: totalSalaries,
        activeEmployees: activeEmployees.length,
        onLeave: employeesData.filter(emp => emp.status === 'INACTIVE').length
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff data';
      setError(errorMessage);
      console.error('Error fetching staff:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on component mount only once
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]); // Remove fetchStaff dependency to prevent re-renders

  // Handle view employee
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  // Handle edit employee
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(employee);
    setIsEditDialogOpen(true);
  };

  // Handle add new employee
  const handleAddEmployee = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      position: '',
      department: '',
      role: 'CASHIER',
      salary: 0,
      hourlyRate: 0,
      status: 'ACTIVE',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      qualifications: [],
      notes: ''
    });
    setIsAddDialogOpen(true);
  };

  // Submit form with Supabase integration
  const handleSubmit = async (isEdit: boolean) => {
    try {
      setIsSubmitting(true);
      setError("");

      if (isEdit && selectedEmployee) {
        // Update employee in Supabase (only if user has permission)
        try {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email || selectedEmployee.email,
              role: formData.role?.toLowerCase() || selectedEmployee.role,
              is_active: formData.status === 'ACTIVE',
              updated_at: new Date().toISOString()
            })
            .eq('id', selectedEmployee.id);

          if (updateError) {
            // If update fails due to permissions, update local state only
            console.warn('Database update failed, updating local state:', updateError);
            setEmployees(prev => prev.map(emp => 
              emp.id === selectedEmployee.id 
                ? { 
                    ...emp, 
                    name: `${formData.firstName} ${formData.lastName}`,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email || emp.email,
                    role: formData.role || emp.role,
                    status: formData.status || emp.status,
                    position: formData.position || emp.position,
                    department: formData.department || emp.department,
                    salary: formData.salary || emp.salary
                  }
                : emp
            ));
          } else {
            await fetchStaff(); // Refresh from database if update succeeded
          }
        } catch (err) {
          // Fallback to local state update
          setEmployees(prev => prev.map(emp => 
            emp.id === selectedEmployee.id 
              ? { 
                  ...emp, 
                  name: `${formData.firstName} ${formData.lastName}`,
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  email: formData.email || emp.email,
                  role: formData.role || emp.role,
                  status: formData.status || emp.status,
                  position: formData.position || emp.position,
                  department: formData.department || emp.department,
                  salary: formData.salary || emp.salary
                }
              : emp
          ));
        }

        setIsEditDialogOpen(false);
      } else {
        // Add new employee - create locally if database insert fails
        try {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email!,
              role: formData.role?.toLowerCase() || 'staff',
              is_active: formData.status === 'ACTIVE'
            });

          if (insertError) {
            // If insert fails due to permissions, create local employee
            console.warn('Database insert failed, creating local employee:', insertError);
            const newEmployee: Employee = {
              id: `local-${Date.now()}`,
              auth_id: null,
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email!,
              role: formData.role?.toLowerCase() || 'staff',
              is_active: formData.status === 'ACTIVE',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              employeeId: `EMP${String(employees.length + 1).padStart(3, '0')}`,
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone || '+256 700 000 000',
              address: formData.address || 'Kampala, Uganda',
              position: formData.position || 'Staff',
              department: formData.department || 'General',
              salary: formData.salary || 1500000,
              hourlyRate: (formData.salary || 1500000) / (22 * 8),
              hireDate: formData.hireDate || new Date().toISOString(),
              status: formData.status || 'ACTIVE',
              emergencyContact: {
                name: 'Emergency Contact',
                phone: '+256 700 000 000',
                relationship: 'Family'
              },
              qualifications: ['Training Certificate'],
              notes: 'Local employee record'
            };
            setEmployees(prev => [...prev, newEmployee]);
          } else {
            await fetchStaff(); // Refresh from database if insert succeeded
          }
        } catch (err) {
          // Fallback to local employee creation
          const newEmployee: Employee = {
            id: `local-${Date.now()}`,
            auth_id: null,
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email!,
            role: formData.role?.toLowerCase() || 'staff',
            is_active: formData.status === 'ACTIVE',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            employeeId: `EMP${String(employees.length + 1).padStart(3, '0')}`,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone || '+256 700 000 000',
            address: formData.address || 'Kampala, Uganda',
            position: formData.position || 'Staff',
            department: formData.department || 'General',
            salary: formData.salary || 1500000,
            hourlyRate: (formData.salary || 1500000) / (22 * 8),
            hireDate: formData.hireDate || new Date().toISOString(),
            status: formData.status || 'ACTIVE',
            emergencyContact: {
              name: 'Emergency Contact',
              phone: '+256 700 000 000',
              relationship: 'Family'
            },
            qualifications: ['Training Certificate'],
            notes: 'Local employee record'
          };
          setEmployees(prev => [...prev, newEmployee]);
        }

        setIsAddDialogOpen(false);
      }
      
      setFormData({});
      setSelectedEmployee(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete employee
  const handleDeleteEmployee = async (employee: Employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`)) return;
    
    try {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setEmployees(prev => prev.filter(emp => emp.id !== employee.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'MANAGER': return 'default';
      case 'PHARMACIST': return 'success';
      case 'TECHNICIAN': return 'secondary';
      case 'CASHIER': return 'outline';
      default: return 'outline';
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'secondary';
      case 'SUSPENDED': return 'destructive';
      default: return 'outline';
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = !searchTerm || 
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = !departmentFilter || departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = !statusFilter || statusFilter === 'all' || employee.status === statusFilter;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Manage employees, attendance, and payroll</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchStaff} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddEmployee}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Staff
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStaff}</div>
            <p className="text-xs text-muted-foreground">All employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.activeEmployees}</div>
            <p className="text-xs text-muted-foreground">Currently employed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Present Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              On Leave
            </CardTitle>
            <XCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.onLeave}</div>
            <p className="text-xs text-muted-foreground">Inactive status</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Hours/Day
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgHoursPerDay}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Payroll
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">UGX {stats.monthlyPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total salaries</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, ID, or position..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
                <SelectItem value="Administration">Administration</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Employees Table */}
          <Card>
            <CardHeader>
              <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading employees...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {error ? 'Failed to load employees' : 'No employees found matching your criteria.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {employee.employeeId} • {employee.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{employee.position}</div>
                              <div className="text-sm text-muted-foreground">
                                Since {new Date(employee.hireDate).toLocaleDateString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(employee.role)}>
                              {employee.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">UGX {employee.salary.toLocaleString()}</div>
                              <div className="text-sm text-muted-foreground">
                                UGX {employee.hourlyRate.toLocaleString()}/hr
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(employee.status)}>
                              {employee.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewEmployee(employee)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Employee
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  View Attendance
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteEmployee(employee)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Employee
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          {/* Attendance Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-48"
                  />
                </div>
                <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                    <SelectItem value="LEAVE">On Leave</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={async () => {
                  // Fetch real attendance data from Supabase
                  try {
                    setIsLoading(true);
                    const { data: attendanceData, error } = await supabase
                      .from('attendance')
                      .select(`
                        *,
                        users!attendance_employee_id_fkey (
                          id,
                          name,
                          email
                        )
                      `)
                      .eq('date', selectedDate)
                      .order('created_at', { ascending: false });

                    if (error) throw error;

                    // Transform attendance data
                    const transformedAttendance: AttendanceRecord[] = (attendanceData || []).map(record => {
                      const user = record.users as any;
                      const clockIn = record.clock_in ? new Date(record.clock_in).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      const clockOut = record.clock_out ? new Date(record.clock_out).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      
                      let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' = 'PRESENT';
                      if (!record.clock_in) status = 'ABSENT';
                      else if (record.clock_in && new Date(record.clock_in).getHours() > 8) status = 'LATE';
                      else if (record.total_hours < 4) status = 'HALF_DAY';

                      return {
                        id: record.id,
                        employeeId: record.employee_id,
                        employee: {
                          firstName: user?.name?.split(' ')[0] || 'Unknown',
                          lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                          employeeId: `EMP${String(user?.id).slice(-3).padStart(3, '0')}`
                        },
                        date: record.date,
                        clockIn,
                        clockOut,
                        status,
                        hoursWorked: record.total_hours,
                        notes: record.notes || undefined
                      };
                    });

                    setAttendanceRecords(transformedAttendance);
                  } catch (err) {
                    console.error('Error fetching attendance:', err);
                    setError('Failed to fetch attendance data');
                  } finally {
                    setIsLoading(false);
                  }ase
                  try {
                    setIsLoading(true);
                    const { data: attendanceData, error } = await supabase
                      .from('attendance')
                      .select(`
                        *,
                        users!attendance_employee_id_fkey (
                          id,
                          name,
                          email
                        )
                      `)
                      .eq('date', selectedDate)
                      .order('created_at', { ascending: false });

                    if (error) throw error;

                    // Transform attendance data
                    const transformedAttendance: AttendanceRecord[] = (attendanceData || []).map(record => {
                      const user = record.users as any;
                      const clockIn = record.clock_in ? new Date(record.clock_in).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      const clockOut = record.clock_out ? new Date(record.clock_out).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      
                      let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' = 'PRESENT';
                      if (!record.clock_in) status = 'ABSENT';
                      else if (record.clock_in && new Date(record.clock_in).getHours() > 8) status = 'LATE';
                      else if (record.total_hours < 4) status = 'HALF_DAY';

                      return {
                        id: record.id,
                        employeeId: record.employee_id,
                        employee: {
                          firstName: user?.name?.split(' ')[0] || 'Unknown',
                          lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                          employeeId: `EMP${String(user?.id).slice(-3).padStart(3, '0')}`
                        },
                        date: record.date,
                        clockIn,
                        clockOut,
                        status,
                        hoursWorked: record.total_hours,
                        notes: record.notes || undefined
                      };
                    });

                    setAttendanceRecords(transformedAttendance);
                  } catch (err) {
                    console.error('Error fetching attendance:', err);
                    setError('Failed to fetch attendance data');
                  } finally {
                    setIsLoading(false);
                  }ase
                  try {
                    setIsLoading(true);
                    const { data: attendanceData, error } = await supabase
                      .from('attendance')
                      .select(`
                        *,
                        users!attendance_employee_id_fkey (
                          id,
                          name,
                          email
                        )
                      `)
                      .eq('date', selectedDate)
                      .order('created_at', { ascending: false });

                    if (error) throw error;

                    // Transform attendance data
                    const transformedAttendance: AttendanceRecord[] = (attendanceData || []).map(record => {
                      const user = record.users as any;
                      const clockIn = record.clock_in ? new Date(record.clock_in).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      const clockOut = record.clock_out ? new Date(record.clock_out).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      
                      let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' = 'PRESENT';
                      if (!record.clock_in) status = 'ABSENT';
                      else if (record.clock_in && new Date(record.clock_in).getHours() > 8) status = 'LATE';
                      else if (record.total_hours < 4) status = 'HALF_DAY';

                      return {
                        id: record.id,
                        employeeId: record.employee_id,
                        employee: {
                          firstName: user?.name?.split(' ')[0] || 'Unknown',
                          lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                          employeeId: `EMP${String(user?.id).slice(-3).padStart(3, '0')}`
                        },
                        date: record.date,
                        clockIn,
                        clockOut,
                        status,
                        hoursWorked: record.total_hours,
                        notes: record.notes || undefined
                      };
                    });

                    setAttendanceRecords(transformedAttendance);
                  } catch (err) {
                    console.error('Error fetching attendance:', err);
                    setError('Failed to fetch attendance data');
                  } finally {
                    setIsLoading(false);
                  }ase
                  try {
                    setIsLoading(true);
                    const { data: attendanceData, error } = await supabase
                      .from('attendance')
                      .select(`
                        *,
                        users!attendance_employee_id_fkey (
                          id,
                          name,
                          email
                        )
                      `)
                      .eq('date', selectedDate)
                      .order('created_at', { ascending: false });

                    if (error) throw error;

                    // Transform attendance data
                    const transformedAttendance: AttendanceRecord[] = (attendanceData || []).map(record => {
                      const user = record.users as any;
                      const clockIn = record.clock_in ? new Date(record.clock_in).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      const clockOut = record.clock_out ? new Date(record.clock_out).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      
                      let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' = 'PRESENT';
                      if (!record.clock_in) status = 'ABSENT';
                      else if (record.clock_in && new Date(record.clock_in).getHours() > 8) status = 'LATE';
                      else if (record.total_hours < 4) status = 'HALF_DAY';

                      return {
                        id: record.id,
                        employeeId: record.employee_id,
                        employee: {
                          firstName: user?.name?.split(' ')[0] || 'Unknown',
                          lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                          employeeId: `EMP${String(user?.id).slice(-3).padStart(3, '0')}`
                        },
                        date: record.date,
                        clockIn,
                        clockOut,
                        status,
                        hoursWorked: record.total_hours,
                        notes: record.notes || undefined
                      };
                    });

                    setAttendanceRecords(transformedAttendance);
                  } catch (err) {
                    console.error('Error fetching attendance:', err);
                    setError('Failed to fetch attendance data');
                  } finally {
                    setIsLoading(false);
                  }ase
                  try {
                    setIsLoading(true);
                    const { data: attendanceData, error } = await supabase
                      .from('attendance')
                      .select(`
                        *,
                        users!attendance_employee_id_fkey (
                          id,
                          name,
                          email
                        )
                      `)
                      .eq('date', selectedDate)
                      .order('created_at', { ascending: false });

                    if (error) throw error;

                    // Transform attendance data
                    const transformedAttendance: AttendanceRecord[] = (attendanceData || []).map(record => {
                      const user = record.users as any;
                      const clockIn = record.clock_in ? new Date(record.clock_in).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      const clockOut = record.clock_out ? new Date(record.clock_out).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      
                      let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' = 'PRESENT';
                      if (!record.clock_in) status = 'ABSENT';
                      else if (record.clock_in && new Date(record.clock_in).getHours() > 8) status = 'LATE';
                      else if (record.total_hours < 4) status = 'HALF_DAY';

                      return {
                        id: record.id,
                        employeeId: record.employee_id,
                        employee: {
                          firstName: user?.name?.split(' ')[0] || 'Unknown',
                          lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                          employeeId: `EMP${String(user?.id).slice(-3).padStart(3, '0')}`
                        },
                        date: record.date,
                        clockIn,
                        clockOut,
                        status,
                        hoursWorked: record.total_hours,
                        notes: record.notes || undefined
                      };
                    });

                    setAttendanceRecords(transformedAttendance);
                  } catch (err) {
                    console.error('Error fetching attendance:', err);
                    setError('Failed to fetch attendance data');
                  } finally {
                    setIsLoading(false);
                  }ase
                  try {
                    setIsLoading(true);
                    const { data: attendanceData, error } = await supabase
                      .from('attendance')
                      .select(`
                        *,
                        users!attendance_employee_id_fkey (
                          id,
                          name,
                          email
                        )
                      `)
                      .eq('date', selectedDate)
                      .order('created_at', { ascending: false });

                    if (error) throw error;

                    // Transform attendance data
                    const transformedAttendance: AttendanceRecord[] = (attendanceData || []).map(record => {
                      const user = record.users as any;
                      const clockIn = record.clock_in ? new Date(record.clock_in).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      const clockOut = record.clock_out ? new Date(record.clock_out).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      
                      let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' = 'PRESENT';
                      if (!record.clock_in) status = 'ABSENT';
                      else if (record.clock_in && new Date(record.clock_in).getHours() > 8) status = 'LATE';
                      else if (record.total_hours < 4) status = 'HALF_DAY';

                      return {
                        id: record.id,
                        employeeId: record.employee_id,
                        employee: {
                          firstName: user?.name?.split(' ')[0] || 'Unknown',
                          lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                          employeeId: `EMP${String(user?.id).slice(-3).padStart(3, '0')}`
                        },
                        date: record.date,
                        clockIn,
                        clockOut,
                        status,
                        hoursWorked: record.total_hours,
                        notes: record.notes || undefined
                      };
                    });

                    setAttendanceRecords(transformedAttendance);
                  } catch (err) {
                    console.error('Error fetching attendance:', err);
                    setError('Failed to fetch attendance data');
                  } finally {
                    setIsLoading(false);
                  }ase
                  try {
                    setIsLoading(true);
                    const { data: attendanceData, error } = await supabase
                      .from('attendance')
                      .select(`
                        *,
                        users!attendance_employee_id_fkey (
                          id,
                          name,
                          email
                        )
                      `)
                      .eq('date', selectedDate)
                      .order('created_at', { ascending: false });

                    if (error) throw error;

                    // Transform attendance data
                    const transformedAttendance: AttendanceRecord[] = (attendanceData || []).map(record => {
                      const user = record.users as unknown;
                      const clockIn = record.clock_in ? new Date(record.clock_in).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      const clockOut = record.clock_out ? new Date(record.clock_out).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined;
                      
                      let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE' = 'PRESENT';
                      if (!record.clock_in) status = 'ABSENT';
                      else if (record.clock_in && new Date(record.clock_in).getHours() > 8) status = 'LATE';
                      else if (record.total_hours < 4) status = 'HALF_DAY';

                      return {
                        id: record.id,
                        employeeId: record.employee_id,
                        employee: {
                          firstName: user?.name?.split(' ')[0] || 'Unknown',
                          lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                          employeeId: `EMP${String(user?.id).slice(-3).padStart(3, '0')}`
                        },
                        date: record.date,
                        clockIn,
                        clockOut,
                        status,
                        hoursWorked: record.total_hours,
                        notes: record.notes || undefined
                      };
                    });

                    setAttendanceRecords(transformedAttendance);
                  } catch (err) {
                    console.error('Error fetching attendance:', err);
                    setError('Failed to fetch attendance data');
                  } finally {
                    setIsLoading(false);
                  }
                  const mockAttendance: AttendanceRecord[] = employees.map(emp => ({
                    id: `att-${emp.id}-${selectedDate}`,
                    employeeId: emp.id,
                    employee: {
                      firstName: emp.firstName,
                      lastName: emp.lastName,
                      employeeId: emp.employeeId
                    },
                    date: selectedDate,
                    clockIn: emp.status === 'ACTIVE' ? '08:00' : undefined,
                    clockOut: emp.status === 'ACTIVE' ? '17:00' : undefined,
                    status: emp.status === 'ACTIVE' ? 
                      (Math.random() > 0.8 ? 'LATE' : 'PRESENT') : 
                      (emp.status === 'INACTIVE' ? 'LEAVE' : 'ABSENT'),
                    hoursWorked: emp.status === 'ACTIVE' ? 8 + Math.random() * 2 : 0,
                    notes: emp.status !== 'ACTIVE' ? 'On medical leave' : undefined
                  }));
                  setAttendanceRecords(mockAttendance);
                }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Load Attendance
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Present
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {attendanceRecords.filter(r => r.status === 'PRESENT').length}
                </div>
                <p className="text-xs text-muted-foreground">On time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Late
                </CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {attendanceRecords.filter(r => r.status === 'LATE').length}
                </div>
                <p className="text-xs text-muted-foreground">Late arrivals</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Absent
                </CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {attendanceRecords.filter(r => r.status === 'ABSENT').length}
                </div>
                <p className="text-xs text-muted-foreground">Not present</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  On Leave
                </CardTitle>
                <Calendar className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">
                  {attendanceRecords.filter(r => r.status === 'LEAVE').length}
                </div>
                <p className="text-xs text-muted-foreground">Approved leave</p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance records found</p>
                  <p className="text-sm">Click "Load Attendance" to view records for the selected date</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords
                      .filter(record => attendanceFilter === 'all' || record.status === attendanceFilter)
                      .map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {record.employee.firstName} {record.employee.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {record.employee.employeeId}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {record.clockIn ? (
                              <div className="text-sm">
                                <div className="font-medium">{record.clockIn}</div>
                                <div className="text-muted-foreground">
                                  {record.status === 'LATE' ? 'Late' : 'On time'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.clockOut ? (
                              <div className="text-sm font-medium">{record.clockOut}</div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {record.hoursWorked ? (
                              <div className="text-sm font-medium">
                                {record.hoursWorked.toFixed(1)}h
                              </div>
                            ) : (
                              <span className="text-muted-foreground">0h</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              record.status === 'PRESENT' ? 'success' :
                              record.status === 'LATE' ? 'warning' :
                              record.status === 'ABSENT' ? 'destructive' :
                              record.status === 'LEAVE' ? 'secondary' : 'outline'
                            }>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {record.notes || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Record
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Clock className="mr-2 h-4 w-4" />
                                  Manual Clock In/Out
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-6">
          {/* Payroll Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="2">February</SelectItem>
                      <SelectItem value="3">March</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">May</SelectItem>
                      <SelectItem value="6">June</SelectItem>
                      <SelectItem value="7">July</SelectItem>
                      <SelectItem value="8">August</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={payrollFilter} onValueChange={setPayrollFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSED">Processed</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={generatePayroll}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Payroll
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Payroll
                </CardTitle>
                <DollarSign className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  UGX {payrollRecords.reduce((sum, record) => sum + record.netSalary, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Paid
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {payrollRecords.filter(r => r.status === 'PAID').length}
                </div>
                <p className="text-xs text-muted-foreground">Employees paid</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending
                </CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {payrollRecords.filter(r => r.status === 'PENDING').length}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Salary
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  UGX {payrollRecords.length > 0 ? 
                    Math.round(payrollRecords.reduce((sum, record) => sum + record.netSalary, 0) / payrollRecords.length).toLocaleString() : 
                    '0'
                  }
                </div>
                <p className="text-xs text-muted-foreground">Per employee</p>
              </CardContent>
            </Card>
          </div>

          {/* Payroll Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Payroll for {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payrollRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payroll records found</p>
                  <p className="text-sm">Click "Generate Payroll" to create payroll for the selected month</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Overtime</TableHead>
                      <TableHead>Bonuses</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRecords
                      .filter(record => payrollFilter === 'all' || record.status === payrollFilter)
                      .map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {record.employee.firstName} {record.employee.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {record.employee.employeeId} • {record.employee.position}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              UGX {record.baseSalary.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {record.overtime > 0 ? (
                                <span className="text-success">+UGX {record.overtime.toLocaleString()}</span>
                              ) : (
                                <span className="text-muted-foreground">UGX 0</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {record.bonuses > 0 ? (
                                <span className="text-success">+UGX {record.bonuses.toLocaleString()}</span>
                              ) : (
                                <span className="text-muted-foreground">UGX 0</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-destructive">
                              -UGX {record.deductions.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-lg">
                              UGX {record.netSalary.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              record.status === 'PAID' ? 'success' :
                              record.status === 'PROCESSED' ? 'default' :
                              'warning'
                            }>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => generatePayslip(record)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Payslip
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => generatePayslip(record)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Payslip
                                </DropdownMenuItem>
                                {record.status === 'PENDING' && (
                                  <>
                                    <DropdownMenuItem onClick={() => processPayroll(record.id)}>
                                      <Clock className="mr-2 h-4 w-4" />
                                      Process Payroll
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => markPayrollAsPaid(record.id)}>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Mark as Paid
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {record.status === 'PROCESSED' && (
                                  <DropdownMenuItem onClick={() => markPayrollAsPaid(record.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  // Edit payroll functionality
                                  alert(`Edit payroll for ${record.employee.firstName} ${record.employee.lastName}`);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Payroll
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the employee's information to add them to your staff.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="e.g., John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="e.g., Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="e.g., john.doe@pharmacy.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="e.g., +256 700 123 456"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  value={formData.position || ''}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  placeholder="e.g., Pharmacist"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department || ''} onValueChange={(value) => setFormData({...formData, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Administration">Administration</SelectItem>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                    <SelectItem value="Customer Service">Customer Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role || ''} onValueChange={(value) => setFormData({...formData, role: value as unknown})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                    <SelectItem value="TECHNICIAN">Technician</SelectItem>
                    <SelectItem value="CASHIER">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary (UGX) - Managed by Position & Role</Label>
                <div className="space-y-2">
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary || ''}
                    onChange={(e) => {
                      const salary = parseFloat(e.target.value) || 0;
                      setFormData({...formData, salary});
                    }}
                    placeholder="Select position & role first for salary suggestions"
                    className={
                      formData.salary && formData.position && formData.role
                        ? validateSalary(formData.salary, formData.position, formData.role).isValid
                          ? "border-green-500"
                          : "border-red-500"
                        : ""
                    }
                  />
                  {/* Always show salary management helper */}
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                    💰 Salary is managed by position and role. Select both to see ranges and suggestions.
                  </div>
                  {formData.position && formData.role && (
                    <div className="text-xs space-y-1">
                      {(() => {
                        const range = getSalaryRange(formData.position, formData.role);
                        const validation = formData.salary 
                          ? validateSalary(formData.salary, formData.position, formData.role)
                          : null;
                        
                        return (
                          <>
                            <div className="text-muted-foreground">
                              Range: UGX {range.min.toLocaleString()} - UGX {range.max.toLocaleString()}
                            </div>
                            <div className="text-muted-foreground">
                              Suggested: UGX {range.default.toLocaleString()}
                            </div>
                            {validation && !validation.isValid && (
                              <div className="text-red-500">
                                Salary must be between UGX {validation.min.toLocaleString()} and UGX {validation.max.toLocaleString()}
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData({...formData, salary: range.default})}
                              className="mt-1"
                            >
                              Use Suggested Salary
                            </Button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate || ''}
                  onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status || 'ACTIVE'} onValueChange={(value) => setFormData({...formData, status: value as unknown})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Full address..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add Employee'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update the employee's information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  placeholder="e.g., John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  placeholder="e.g., Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="e.g., john.doe@pharmacy.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="e.g., +256 700 123 456"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position *</Label>
                <Input
                  id="edit-position"
                  value={formData.position || ''}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  placeholder="e.g., Pharmacist"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select value={formData.department || ''} onValueChange={(value) => setFormData({...formData, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Administration">Administration</SelectItem>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                    <SelectItem value="Customer Service">Customer Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={formData.role || ''} onValueChange={(value) => setFormData({...formData, role: value as unknown})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                    <SelectItem value="TECHNICIAN">Technician</SelectItem>
                    <SelectItem value="CASHIER">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salary">Salary (UGX) - Managed by Position & Role</Label>
                <div className="space-y-2">
                  <Input
                    id="edit-salary"
                    type="number"
                    value={formData.salary || ''}
                    onChange={(e) => {
                      const salary = parseFloat(e.target.value) || 0;
                      setFormData({...formData, salary});
                    }}
                    placeholder="Select position & role first for salary suggestions"
                    className={
                      formData.salary && formData.position && formData.role
                        ? validateSalary(formData.salary, formData.position, formData.role).isValid
                          ? "border-green-500"
                          : "border-red-500"
                        : ""
                    }
                  />
                  {/* Always show salary management helper */}
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                    💰 Salary is managed by position and role. Select both to see ranges and suggestions.
                  </div>
                  {formData.position && formData.role && (
                    <div className="text-xs space-y-1">
                      {(() => {
                        const range = getSalaryRange(formData.position, formData.role);
                        const validation = formData.salary 
                          ? validateSalary(formData.salary, formData.position, formData.role)
                          : null;
                        
                        return (
                          <>
                            <div className="text-muted-foreground">
                              Range: UGX {range.min.toLocaleString()} - UGX {range.max.toLocaleString()}
                            </div>
                            <div className="text-muted-foreground">
                              Suggested: UGX {range.default.toLocaleString()}
                            </div>
                            {validation && !validation.isValid && (
                              <div className="text-red-500">
                                Salary must be between UGX {validation.min.toLocaleString()} and UGX {validation.max.toLocaleString()}
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData({...formData, salary: range.default})}
                              className="mt-1"
                            >
                              Use Suggested Salary
                            </Button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hireDate">Hire Date</Label>
                <Input
                  id="edit-hireDate"
                  type="date"
                  value={formData.hireDate || ''}
                  onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status || ''} onValueChange={(value) => setFormData({...formData, status: value as unknown})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Full address..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Employee'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
            <DialogDescription>
              View detailed information about this employee.
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <p className="text-sm">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Employee ID</Label>
                    <p className="text-sm font-mono">{selectedEmployee.employeeId}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{selectedEmployee.email}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm">{selectedEmployee.phone || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-sm">{selectedEmployee.address || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Position</Label>
                    <p className="text-sm">{selectedEmployee.position}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Department</Label>
                    <p className="text-sm">{selectedEmployee.department}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Role</Label>
                    <Badge variant={getRoleBadgeVariant(selectedEmployee.role)}>
                      {selectedEmployee.role}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant={getStatusBadgeVariant(selectedEmployee.status)}>
                      {selectedEmployee.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Salary</Label>
                    <p className="text-sm font-medium">UGX {selectedEmployee.salary.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Hire Date</Label>
                    <p className="text-sm">{new Date(selectedEmployee.hireDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Years of Service</Label>
                    <p className="text-sm">
                      {Math.floor((new Date().getTime() - new Date(selectedEmployee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm">{new Date(selectedEmployee.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p className="text-sm">{new Date(selectedEmployee.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {selectedEmployee.emergencyContact && (
                <div className="space-y-4">
                  <Label className="text-base font-medium">Emergency Contact</Label>
                  <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm">{selectedEmployee.emergencyContact.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm">{selectedEmployee.emergencyContact.phone}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Relationship</Label>
                      <p className="text-sm">{selectedEmployee.emergencyContact.relationship}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Qualifications */}
              {selectedEmployee.qualifications && selectedEmployee.qualifications.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-base font-medium">Qualifications</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.qualifications.map((qualification, index) => (
                      <Badge key={index} variant="secondary">
                        {qualification}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedEmployee.notes && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedEmployee.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (selectedEmployee) handleEditEmployee(selectedEmployee);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}