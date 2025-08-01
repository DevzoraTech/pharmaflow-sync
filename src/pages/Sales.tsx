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
import { salesAPI, customersAPI, medicinesAPI, type SaleWithDetails, type Customer, type Medicine } from "@/lib/api";
import { PrintReceiptDialog } from "@/components/receipt/PrintReceiptDialog";

// TypeScript interfaces
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
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
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
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

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
        startDate: dateFilter ? `${dateFilter}T00:00:00` : undefined,
        endDate: dateFilter ? `${dateFilter}T23:59:59` : undefined
      });
      
      setSales(response.sales || []);
      
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
    const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0);
    const tax = subtotal * 0.1; // 10% tax
    const discount = saleForm.discount;
    const total = subtotal + tax - discount;
    return { subtotal, tax, total };
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      setError("Please add items to cart before creating a sale");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax - saleForm.discount;

      const saleData = {
        customerId: saleForm.customerId || null,
        prescriptionId: null, // Could be added later
        subtotal,
        tax,
        discount: saleForm.discount,
        total,
        paymentMethod: saleForm.paymentMethod,
        notes: saleForm.notes || null,
        items: cart.map(item => ({
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice - item.discount,
          discount: item.discount
        }))
      };

      const newSale = await salesAPI.create(saleData);
      
      // Reset form and close dialog
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
      
      // Open print dialog for the new sale
      setSelectedSale(newSale);
      setIsPrintDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSale = (sale: SaleWithDetails) => {
    setSelectedSale(sale);
    setIsViewDialogOpen(true);
  };

  const handlePrintReceipt = (sale: SaleWithDetails) => {
    setSelectedSale(sale);
    setIsPrintDialogOpen(true);
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Badge variant="default">Cash</Badge>;
      case 'CARD':
        return <Badge variant="secondary">Card</Badge>;
      case 'INSURANCE':
        return <Badge variant="outline">Insurance</Badge>;
      case 'CREDIT':
        return <Badge variant="destructive">Credit</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
    (medicine.generic_name && medicine.generic_name.toLowerCase().includes(medicineSearch.toLowerCase()))
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Sales Management</h1>
          <p className="text-muted-foreground">Manage sales transactions and point of sale operations</p>
        </div>
        <Dialog open={isPOSDialogOpen} onOpenChange={setIsPOSDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Point of Sale</DialogTitle>
              <DialogDescription>
                Create a new sale transaction. Add items to cart and process payment.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Product Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Medicines</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search medicines..."
                      value={medicineSearch}
                      onChange={(e) => setMedicineSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <h3 className="font-medium mb-3">Available Medicines</h3>
                  <div className="space-y-2">
                    {medicines
                      .filter(medicine => 
                        medicine.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
                        (medicine.generic_name && medicine.generic_name.toLowerCase().includes(medicineSearch.toLowerCase()))
                      )
                      .map(medicine => (
                        <div
                          key={medicine.id}
                          className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer"
                          onClick={() => addToCart(medicine)}
                        >
                          <div>
                            <div className="font-medium">{medicine.name}</div>
                            {medicine.generic_name && (
                              <div className="text-sm text-muted-foreground">{medicine.generic_name}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">UGX {medicine.price.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Stock: {medicine.quantity}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Right Side - Cart and Payment */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={saleForm.customerId} onValueChange={(value) => setSaleForm({...saleForm, customerId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Walk-in Customer</SelectItem>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={saleForm.paymentMethod} onValueChange={(value: 'CASH' | 'CARD' | 'INSURANCE' | 'CREDIT') => setSaleForm({...saleForm, paymentMethod: value})}>
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

                <div className="space-y-2">
                  <Label>Discount (UGX)</Label>
                  <Input
                    type="number"
                    value={saleForm.discount}
                    onChange={(e) => setSaleForm({...saleForm, discount: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})}
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Cart */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Cart Items</h3>
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No items in cart</p>
                  ) : (
                    <div className="space-y-2">
                      {cart.map(item => (
                        <div key={item.medicineId} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <div className="font-medium">{item.medicine.name}</div>
                            <div className="text-sm text-muted-foreground">
                              UGX {item.unitPrice.toLocaleString()} x {item.quantity}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.medicineId, 'quantity', Math.max(1, item.quantity - 1))}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.medicineId, 'quantity', item.quantity + 1)}
                              disabled={item.quantity >= item.medicine.quantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
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

                {/* Totals */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>UGX {cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>UGX {(cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice - item.discount), 0) * 0.1).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-UGX {saleForm.discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>UGX {calculateCartTotal().toLocaleString()}</span>
                  </div>
                </div>

                <Button 
                  onClick={handleCreateSale} 
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Complete Sale
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Today's Sales
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-foreground mb-2">UGX {stats.todaysSales.toLocaleString()}</div>
            <p className="text-xs md:text-sm text-muted-foreground">{stats.transactions} transactions</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Average Sale
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-foreground mb-2">UGX {stats.averageSale.toLocaleString()}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-foreground mb-2">{sales.length}</div>
            <p className="text-xs md:text-sm text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
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
              <SelectTrigger className="w-full sm:w-48">
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
              className="w-full sm:w-48"
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
          <CardTitle>Sales History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading sales...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="hidden md:table-cell">Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {error ? 'Failed to load sales' : 'No sales found matching your search criteria.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-sm">
                          {sale.id.substring(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{new Date(sale.sale_date).toLocaleDateString()}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(sale.sale_date).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
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
                            {sale.sale_items.length} item{sale.sale_items.length !== 1 ? 's' : ''}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {getPaymentMethodBadge(sale.payment_method)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">UGX {sale.total.toLocaleString()}</div>
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
                              <DropdownMenuItem onClick={() => handlePrintReceipt(sale)}>
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
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sale ID</Label>
                  <p className="text-sm font-mono">{selectedSale.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <p className="text-sm">
                    {new Date(selectedSale.sale_date).toLocaleDateString()} at{' '}
                    {new Date(selectedSale.sale_date).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Prescription #{selectedSale.prescription.prescription_number}
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
                      {selectedSale.sale_items.map((item, index) => (
                        <TableRow key={`${item.medicine_id}-${index}`}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.medicine.name}</div>
                              {item.medicine.generic_name && (
                                <div className="text-xs text-muted-foreground">
                                  {item.medicine.generic_name}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>UGX {item.unit_price.toLocaleString()}</TableCell>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Method</Label>
                  {getPaymentMethodBadge(selectedSale.payment_method)}
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
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              setIsPrintDialogOpen(true);
            }}>
              <Receipt className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Receipt Dialog */}
      <PrintReceiptDialog
        sale={selectedSale}
        isOpen={isPrintDialogOpen}
        onClose={() => setIsPrintDialogOpen(false)}
      />
    </div>
  );
}