import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

// TypeScript interfaces
interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  department: string;
  role: 'ADMIN' | 'PHARMACIST' | 'TECHNICIAN' | 'CASHIER' | 'MANAGER';
  salary: number;
  hourlyRate: number;
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  qualifications: string[];
  notes?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
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
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEmployees(mockEmployees);
      
      // Calculate stats
      const activeEmployees = mockEmployees.filter(emp => emp.status === 'ACTIVE');
      const totalSalaries = activeEmployees.reduce((sum, emp) => sum + emp.salary, 0);
      
      setStats({
        totalStaff: mockEmployees.length,
        presentToday: activeEmployees.length - 1, // Mock: one person absent
        avgHoursPerDay: 8.2,
        monthlyPayroll: totalSalaries,
        activeEmployees: activeEmployees.length,
        onLeave: mockEmployees.filter(emp => emp.status === 'INACTIVE').length
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff data';
      setError(errorMessage);
      console.error('Error fetching staff:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

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

  // Submit form
  const handleSubmit = async (isEdit: boolean) => {
    try {
      setIsSubmitting(true);
      setError("");

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isEdit && selectedEmployee) {
        // Update employee
        setEmployees(prev => prev.map(emp => 
          emp.id === selectedEmployee.id ? { ...emp, ...formData } : emp
        ));
        setIsEditDialogOpen(false);
      } else {
        // Add new employee
        const newEmployee: Employee = {
          ...formData as Employee,
          id: Date.now().toString(),
          employeeId: `EMP${String(employees.length + 1).padStart(3, '0')}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setEmployees(prev => [...prev, newEmployee]);
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
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Attendance Tracking</h3>
              <p className="text-muted-foreground mb-4">
                Track employee attendance, clock in/out times, and generate attendance reports.
              </p>
              <Button>
                <Clock className="h-4 w-4 mr-2" />
                Set Up Attendance System
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Payroll Management</h3>
              <p className="text-muted-foreground mb-4">
                Manage employee salaries, generate payslips, and track payroll expenses.
              </p>
              <div className="flex gap-2 justify-center">
                <Button>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Generate Payroll
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Payroll Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}