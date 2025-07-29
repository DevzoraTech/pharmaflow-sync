import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Search,
  Filter,
  Eye,
  Trash2,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
  User,
  Calendar,
  CreditCard,
  Receipt,
  Minus,
  X
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
import { salesAPI, customersAPI, medicinesAPI } from "@/lib/api";

// TypeScript interfaces
interface SaleItem {
  id: string;
  medicineId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number;
  medicine: {
    id: string;
    name: string;
    genericName?: string;
  };
}

interface Sale {
  id: string;
  customerId?: string;
  prescriptionId?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'INSURANCE' | 'CREDIT';
  saleDate: string;
  notes?: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  prescription?: {
    id: string;
    prescriptionNumber: string;
  };
  cashier: {
    id: string;
    name: string;
  };
  items: SaleItem[];
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Medicine {
  id: string;
  name: string;
  price: number;
  quantity: number;
  genericName?: string;
}

interface CartItem {
  medicineId: string;
  medicine: Medicine;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface SaleForm {
  customerId: string;
  paymentMethod: 'CASH' | 'CARD' | 'INSURANCE' | 'CREDIT';
  discount: number;
  notes: string;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPOSDialogOpen, setIsPOSDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // POS System states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleForm, setSaleForm] = useState<SaleForm>({
    customerId: "",
    paymentMethod: "CASH",
    discount: 0,
    notes: ""
  });
  const [medicineSearch, setMedicineSearch] = useState("");

  // Additional states
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    todaysSales: 0,
    transactions: 0,
    averageSale: 0
  });

  // Fetch sales from API
  const fetchSales = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
      
      const response = await salesAPI.getAll({
        paymentMethod: paymentMethodFilter && paymentMethodFilter !== "all" ? paymentMethodFilter : undefined,
        startDate: dateFilter ? new Date(dateFilter).toISOString() : undefined,
        endDate: dateFilter ? new Date(new Date(dateFilter).setHours(23, 59, 59, 999)).toISOString() : undefined
      });
      
      setSales((response.sales || []).map((sale: any) => ({
        ...sale,
        id: String(sale.id),
        total: Number(sale.total) || 0,
        subtotal: Number(sale.subtotal) || 0,
        tax: Number(sale.tax) || 0,
        discount: Number(sale.discount) || 0,
        items: (sale.items || []).map((item: any) => ({
          ...item,
          id: String(item.id),
          medicineId: String(item.medicineId),
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          subtotal: Number(item.subtotal) || 0,
          discount: Number(item.discount) || 0
        }))
      })));
      
      // Get today's stats
      const statsResponse = await salesAPI.getStats({
        startDate: startOfDay,
        endDate: endOfDay
      });
      
      setStats({
        todaysSales: Number(statsResponse.totalSales) || 0,
        transactions: Number(statsResponse.totalTransactions) || 0,
        averageSale: Number(statsResponse.averageSale) || 0
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sales';
      setError(errorMessage);
      console.error('Error fetching sales:', err);
    } finally {
      setIsLoading(false);
    }
  }, [paymentMethodFilter, dateFilter]);

  // Load initial data
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Load customers and medicines for POS
  useEffect(() => {
    const loadPOSData = async () => {
      try {
        const [customersResponse, medicinesResponse] = await Promise.all([
          customersAPI.getAll(),
          medicinesAPI.getAll()
        ]);
        setCustomers(customersResponse.customers || []);
        setMedicines(medicinesResponse.medicines || []);
      } catch (err) {
        console.error('Error loading POS data:', err);
      }
    };
    loadPOSData();
  }, []);

  const addToCart = (medicine: Medicine) => {
    const existingItem = cart.find(item => item.medicineId === medicine.id);
    
    if (existingItem) {
      if (existingItem.quantity < medicine.quantity) {
        setCart(cart.map(item => 
          item.medicineId === medicine.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setCart([...cart, {
        medicineId: medicine.id,
        medicine,
        quantity: 1,
        unitPrice: medicine.price,
        discount: 0
      }]);
    }
  };

  const updateCartItem = (medicineId: string, field: keyof CartItem, value: number) => {
    setCart(cart.map(item => 
      item.medicineId === medicineId 
        ? { ...item, [field]: value }
        : item
    ));
  };

  const removeFromCart = (medicineId: string) => {
    setCart(cart.filter(item => item.medicineId !== medicineId));
  };

  const calculateCartTotal = () => {
    const subtotal = cart.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice) - item.discount;
    }, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax - saleForm.discount;
    return { subtotal, tax, total };
  };

  const handleCreateSale = async () => {
    try {
      setIsSubmitting(true);
      setError("");

      if (cart.length === 0) {
        setError("Please add items to cart");
        return;
      }

      // Prepare sale data
      const saleData = {
        customerId: saleForm.customerId || undefined,
        items: cart.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount
        })),
        paymentMethod: saleForm.paymentMethod,
        discount: saleForm.discount,
        notes: saleForm.notes || undefined
      };

      await salesAPI.create(saleData);
      
      // Reset form and cart
      setCart([]);
      setSaleForm({
        customerId: "",
        paymentMethod: "CASH",
        discount: 0,
        notes: ""
      });
      setIsPOSDialogOpen(false);
      
      // Refresh sales list
      await fetchSales();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsViewDialogOpen(true);
  };

  const getPaymentMethodBadge = (method: string) => {
    const variants = {
      CASH: "success",
      CARD: "default",
      INSURANCE: "secondary",
      CREDIT: "warning"
    } as const;
    
    return <Badge variant={variants[method as keyof typeof variants] || "outline"}>{method}</Badge>;
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
    (medicine.genericName && medicine.genericName.toLowerCase().includes(medicineSearch.toLowerCase()))
  );

  const { subtotal, tax, total } = calculateCartTotal();

  // Add comprehensive error handling and data validation
  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Error Loading Sales</h2>
        <p className="text-red-500 mt-2">{error}</p>
        <Button onClick={() => {
          setError("");
          fetchSales();
        }} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // Ensure all data is properly loaded before rendering
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading sales data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Management</h1>
          <p className="text-muted-foreground">Track and manage pharmacy sales</p>
        </div>
        <Dialog open={isPOSDialogOpen} onOpenChange={setIsPOSDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Point of Sale System</DialogTitle>
              <DialogDescription>
                Add medicines to cart and process the sale.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 py-4">
              {/* Left Side - Medicine Selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Select Medicines</Label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search medicines..."
                      value={medicineSearch}
                      onChange={(e) => setMedicineSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  {filteredMedicines.map((medicine) => (
                    <div key={medicine.id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50">
                      <div className="flex-1">
                        <div className="font-medium">{medicine.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {medicine.genericName && `${medicine.genericName} • `}
                          UGX {medicine.price.toLocaleString()} • Stock: {medicine.quantity}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToCart(medicine)}
                        disabled={medicine.quantity === 0}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Cart and Checkout */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Shopping Cart</Label>
                  <div className="mt-2 border rounded-lg">
                    {cart.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        Cart is empty. Add medicines to get started.
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.medicineId} className="flex items-center gap-3 p-3 border-b last:border-b-0">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.medicine.name}</div>
                              <div className="text-xs text-muted-foreground">
                                UGX {item.unitPrice.toLocaleString()} each
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartItem(item.medicineId, 'quantity', Math.max(1, item.quantity - 1))}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateCartItem(item.medicineId, 'quantity', Math.min(item.medicine.quantity, item.quantity + 1))}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromCart(item.medicineId)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sale Details */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Customer (Optional)</Label>
                      <Select value={saleForm.customerId} onValueChange={(value) => setSaleForm({...saleForm, customerId: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Walk-in customer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walk-in">Walk-in customer</SelectItem>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} {customer.email && `(${customer.email})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={saleForm.paymentMethod} onValueChange={(value) => setSaleForm({...saleForm, paymentMethod: value as 'CASH' | 'CARD' | 'INSURANCE' | 'CREDIT'})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="CARD">Card</SelectItem>
                          <SelectItem value="INSURANCE">Insurance</SelectItem>
                          <SelectItem value="CREDIT">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Discount (UGX)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={saleForm.discount}
                      onChange={(e) => setSaleForm({...saleForm, discount: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={saleForm.notes}
                      onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})}
                      placeholder="Additional notes..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Total Summary */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>UGX {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (10%):</span>
                    <span>UGX {tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span>-UGX {saleForm.discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>UGX {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPOSDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleCreateSale} disabled={isSubmitting || cart.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Complete Sale'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Sales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">UGX {stats.todaysSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total revenue today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactions}</div>
            <p className="text-xs text-muted-foreground">Sales completed today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Sale
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {stats.averageSale.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="INSURANCE">Insurance</SelectItem>
                <SelectItem value="CREDIT">Credit</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-48"
            />
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

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading sales...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Cashier</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {error ? 'Failed to load sales' : 'No sales found matching your criteria.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale: Sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="font-medium">
                          {sale.id.substring(0, 8)}...
                        </div>
                        {sale.prescription && (
                          <div className="text-xs text-muted-foreground">
                            Rx: {sale.prescription.prescriptionNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {sale.customer ? (
                          <div>
                            <div className="font-medium">{sale.customer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {sale.customer.email || sale.customer.phone || 'No contact'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Walk-in</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(sale.saleDate).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{sale.items.length}</span> items
                      </TableCell>
                      <TableCell>
                        {getPaymentMethodBadge(sale.paymentMethod)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">UGX {sale.total.toLocaleString()}</div>
                        {sale.discount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Discount: UGX {sale.discount.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{sale.cashier.name}</div>
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
                            <DropdownMenuItem onClick={() => handleViewSale(sale)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Receipt className="mr-2 h-4 w-4" />
                              Print Receipt
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

      {/* View Sale Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
            <DialogDescription>
              View detailed information about this sale transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedSale && (
            <div className="grid gap-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sale ID</Label>
                  <p className="text-sm font-mono">{selectedSale.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <p className="text-sm">
                    {new Date(selectedSale.saleDate).toLocaleDateString()} at{' '}
                    {new Date(selectedSale.saleDate).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Customer</Label>
                  {selectedSale.customer ? (
                    <div>
                      <p className="text-sm font-medium">{selectedSale.customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedSale.customer.email || selectedSale.customer.phone || 'No contact info'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Walk-in customer</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cashier</Label>
                  <p className="text-sm">{selectedSale.cashier.name}</p>
                </div>
              </div>

              {selectedSale.prescription && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prescription</Label>
                  <p className="text-sm">
                    Prescription #{selectedSale.prescription.prescriptionNumber}
                  </p>
                </div>
              )}

              {/* Sale Items */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Items Sold</Label>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items.map((item, index) => (
                        <TableRow key={`${item.medicineId}-${index}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.medicine.name}</div>
                              {item.medicine.genericName && (
                                <div className="text-xs text-muted-foreground">
                                  {item.medicine.genericName}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>UGX {item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell>
                            {item.discount > 0 ? `-UGX ${item.discount.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell>UGX {item.subtotal.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Method</Label>
                  {getPaymentMethodBadge(selectedSale.paymentMethod)}
                </div>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>UGX {selectedSale.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>UGX {selectedSale.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span>-UGX {selectedSale.discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>UGX {selectedSale.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedSale.notes && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedSale.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button>
              <Receipt className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}