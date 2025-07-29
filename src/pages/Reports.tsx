import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  Loader2,
  AlertTriangle,
  DollarSign,
  Package,
  Users,
  Activity,
  PieChart,
  LineChart,
  RefreshCw
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { salesAPI, medicinesAPI, customersAPI, prescriptionsAPI, dashboardAPI } from "@/lib/api";

// TypeScript interfaces
interface SalesReport {
  totalSales: number;
  totalTransactions: number;
  averageSale: number;
  totalTax: number;
  totalDiscount: number;
  salesByPaymentMethod: {
    paymentMethod: string;
    _sum: { total: number };
    _count: { id: number };
  }[];
  topMedicines: {
    medicineId: string;
    _sum: { quantity: number; subtotal: number };
    medicine: {
      id: string;
      name: string;
      genericName?: string;
    };
  }[];
}

interface InventoryReport {
  totalMedicines: number;
  lowStockItems: number;
  expiringSoon: number;
  totalValue: number;
  topCategories: {
    category: string;
    count: number;
    value: number;
  }[];
}

interface CustomerReport {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  topCustomers: {
    id: string;
    name: string;
    totalPurchases: number;
    totalSpent: number;
  }[];
}

interface PrescriptionReport {
  totalPrescriptions: number;
  pendingPrescriptions: number;
  filledPrescriptions: number;
  averageItemsPerPrescription: number;
}

export default function Reports() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("7"); // days
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportType, setReportType] = useState("overview");

  // Report data
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerReport | null>(null);
  const [prescriptionReport, setPrescriptionReport] = useState<PrescriptionReport | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // Calculate date range
  const getDateRange = useCallback(() => {
    const end = new Date();
    const start = new Date();
    
    if (startDate && endDate) {
      return {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      };
    }
    
    start.setDate(end.getDate() - parseInt(dateRange));
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }, [dateRange, startDate, endDate]);

  // Fetch all reports data
  const fetchReportsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const { startDate: start, endDate: end } = getDateRange();
      
      // Fetch all data in parallel
      const [
        salesData,
        medicinesData,
        customersData,
        prescriptionsData,
        dashboardData
      ] = await Promise.all([
        salesAPI.getStats({ startDate: start, endDate: end }),
        medicinesAPI.getAll(),
        customersAPI.getAll(),
        prescriptionsAPI.getAll(),
        dashboardAPI.getStats()
      ]);

      // Sanitize sales data to prevent object rendering issues
      const sanitizedSalesData = salesData ? {
        ...salesData,
        totalSales: Number(salesData.totalSales) || 0,
        totalTransactions: Number(salesData.totalTransactions) || 0,
        averageSale: Number(salesData.averageSale) || 0,
        totalTax: Number(salesData.totalTax) || 0,
        totalDiscount: Number(salesData.totalDiscount) || 0,
        salesByPaymentMethod: (salesData.salesByPaymentMethod || []).map((method: any) => ({
          ...method,
          paymentMethod: String(method.paymentMethod),
          _sum: {
            total: Number(method._sum?.total) || 0
          },
          _count: {
            id: Number(method._count?.id) || 0
          }
        })),
        topMedicines: (salesData.topMedicines || []).map((item: any) => ({
          ...item,
          medicineId: String(item.medicineId),
          _sum: {
            quantity: Number(item._sum?.quantity) || 0,
            subtotal: Number(item._sum?.subtotal) || 0
          },
          medicine: {
            id: String(item.medicine?.id),
            name: String(item.medicine?.name || 'Unknown'),
            genericName: item.medicine?.genericName ? String(item.medicine.genericName) : undefined
          }
        }))
      } : null;
      
      setSalesReport(sanitizedSalesData);
      setDashboardStats(dashboardData);

      // Process inventory report
      const medicines = medicinesData.medicines || [];
      const totalValue = medicines.reduce((sum: number, med: any) => sum + (med.price * med.quantity), 0);
      const lowStock = medicines.filter((med: any) => med.quantity <= med.minStockLevel).length;
      const expiring = medicines.filter((med: any) => {
        const expiryDate = new Date(med.expiryDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow;
      }).length;

      // Group by category
      const categoryMap = new Map();
      medicines.forEach((med: any) => {
        const category = med.category;
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { count: 0, value: 0 });
        }
        const current = categoryMap.get(category);
        current.count += 1;
        current.value += med.price * med.quantity;
      });

      const topCategories = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setInventoryReport({
        totalMedicines: medicines.length,
        lowStockItems: lowStock,
        expiringSoon: expiring,
        totalValue,
        topCategories
      });

      // Process customer report
      const customers = customersData.customers || [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newCustomers = customers.filter((customer: any) => 
        new Date(customer.createdAt) >= thirtyDaysAgo
      ).length;

      setCustomerReport({
        totalCustomers: customers.length,
        newCustomers,
        activeCustomers: Math.floor(customers.length * 0.3), // Mock: 30% active
        topCustomers: [] // Would need sales data joined with customers
      });

      // Process prescription report
      const prescriptions = prescriptionsData.prescriptions || [];
      const pending = prescriptions.filter((p: any) => p.status === 'PENDING').length;
      const filled = prescriptions.filter((p: any) => p.status === 'FILLED').length;
      const avgItems = prescriptions.length > 0 
        ? prescriptions.reduce((sum: number, p: any) => sum + (Number(p._count?.items) || 0), 0) / prescriptions.length 
        : 0;

      setPrescriptionReport({
        totalPrescriptions: prescriptions.length,
        pendingPrescriptions: pending,
        filledPrescriptions: filled,
        averageItemsPerPrescription: avgItems
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reports data';
      setError(errorMessage);
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange]);

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  const exportReport = (type: string) => {
    // Mock export functionality
    console.log(`Exporting ${type} report...`);
    // In a real implementation, this would generate and download a PDF/Excel file
  };

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive business insights and reporting</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReportsData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => exportReport('comprehensive')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateRange === "custom" && (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            
            <Button onClick={fetchReportsData} disabled={isLoading}>
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading reports data...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reports Tabs */}
      {!isLoading && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {salesReport ? formatCurrency(salesReport.totalSales) : 'UGX 0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {salesReport?.totalTransactions || 0} transactions
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Inventory Value
                  </CardTitle>
                  <Package className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {inventoryReport ? formatCurrency(inventoryReport.totalValue) : 'UGX 0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {inventoryReport?.totalMedicines || 0} medicines
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Customers
                  </CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {customerReport?.totalCustomers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {customerReport?.newCustomers || 0} new this month
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Prescriptions
                  </CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {prescriptionReport?.totalPrescriptions || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {prescriptionReport?.pendingPrescriptions || 0} pending
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Key Performance Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Sale Value</span>
                    <span className="font-medium">
                      {salesReport ? formatCurrency(salesReport.averageSale) : 'UGX 0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Low Stock Items</span>
                    <Badge variant={inventoryReport && inventoryReport.lowStockItems > 0 ? "destructive" : "success"}>
                      {inventoryReport?.lowStockItems || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Expiring Soon</span>
                    <Badge variant={inventoryReport && inventoryReport.expiringSoon > 0 ? "warning" : "success"}>
                      {inventoryReport?.expiringSoon || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Prescription Fill Rate</span>
                    <span className="font-medium">
                      {prescriptionReport ? 
                        formatPercentage(
                          prescriptionReport.filledPrescriptions, 
                          prescriptionReport.totalPrescriptions
                        ) : '0%'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Payment Methods Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {salesReport?.salesByPaymentMethod.length ? (
                    <div className="space-y-3">
                      {salesReport.salesByPaymentMethod.map((method) => (
                        <div key={method.paymentMethod} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{method.paymentMethod}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {Number(method._count.id) || 0} transactions
                            </span>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(Number(method._sum.total) || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No payment data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {salesReport ? (
                    <>
                      <div className="flex justify-between">
                        <span>Total Sales:</span>
                        <span className="font-medium">{formatCurrency(salesReport.totalSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Transactions:</span>
                        <span className="font-medium">{salesReport.totalTransactions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Sale:</span>
                        <span className="font-medium">{formatCurrency(salesReport.averageSale)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Tax Collected:</span>
                        <span className="font-medium">{formatCurrency(salesReport.totalTax)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Discounts:</span>
                        <span className="font-medium">{formatCurrency(salesReport.totalDiscount)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No sales data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Medicines</CardTitle>
                </CardHeader>
                <CardContent>
                  {salesReport?.topMedicines.length ? (
                    <div className="space-y-3">
                      {salesReport.topMedicines.slice(0, 5).map((item, index) => (
                        <div key={item.medicineId} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">
                              #{index + 1} {item.medicine?.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {Number(item._sum.quantity) || 0} units sold
                            </div>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(Number(item._sum.subtotal) || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No sales data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {inventoryReport ? (
                    <>
                      <div className="flex justify-between">
                        <span>Total Medicines:</span>
                        <span className="font-medium">{inventoryReport.totalMedicines}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Inventory Value:</span>
                        <span className="font-medium">{formatCurrency(inventoryReport.totalValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Low Stock Items:</span>
                        <Badge variant={inventoryReport.lowStockItems > 0 ? "destructive" : "success"}>
                          {inventoryReport.lowStockItems}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Expiring Soon:</span>
                        <Badge variant={inventoryReport.expiringSoon > 0 ? "warning" : "success"}>
                          {inventoryReport.expiringSoon}
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No inventory data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Categories by Value</CardTitle>
                </CardHeader>
                <CardContent>
                  {inventoryReport?.topCategories.length ? (
                    <div className="space-y-3">
                      {inventoryReport.topCategories.map((category, index) => (
                        <div key={category.category} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">
                              #{index + 1} {category.category}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {category.count} medicines
                            </div>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(category.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No category data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customerReport ? (
                    <>
                      <div className="flex justify-between">
                        <span>Total Customers:</span>
                        <span className="font-medium">{customerReport.totalCustomers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>New Customers (30 days):</span>
                        <span className="font-medium">{customerReport.newCustomers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Customers:</span>
                        <span className="font-medium">{customerReport.activeCustomers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer Growth Rate:</span>
                        <span className="font-medium">
                          {formatPercentage(customerReport.newCustomers, customerReport.totalCustomers)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No customer data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Customer purchase analytics</p>
                    <p className="text-sm">Available with customer-sales integration</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Prescription Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {prescriptionReport ? (
                    <>
                      <div className="flex justify-between">
                        <span>Total Prescriptions:</span>
                        <span className="font-medium">{prescriptionReport.totalPrescriptions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending:</span>
                        <Badge variant="warning">{prescriptionReport.pendingPrescriptions}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Filled:</span>
                        <Badge variant="success">{prescriptionReport.filledPrescriptions}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Fill Rate:</span>
                        <span className="font-medium">
                          {formatPercentage(
                            prescriptionReport.filledPrescriptions,
                            prescriptionReport.totalPrescriptions
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Items per Prescription:</span>
                        <span className="font-medium">
                          {prescriptionReport.averageItemsPerPrescription.toFixed(1)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No prescription data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prescription Trends</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Prescription trend analysis</p>
                    <p className="text-sm">Historical data visualization</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}