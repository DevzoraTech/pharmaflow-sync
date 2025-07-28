import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  TrendingDown, 
  AlertTriangle, 
  BarChart3,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Calendar,
  Package2
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
import { medicinesAPI } from "@/lib/api";

// TypeScript interfaces
interface InventoryItem {
  id: string;
  name: string;
  genericName?: string;
  manufacturer: string;
  category: string;
  batchNumber: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  price: number;
  costPrice: number;
  expiryDate: string;
  manufactureDate: string;
  location: string;
  supplier: string;
  barcode?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  expiringSoon: number;
  totalValue: number;
  outOfStock: number;
  categories: number;
}

interface StockMovement {
  id: string;
  medicineId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  reference?: string;
  createdAt: string;
  createdBy: string;
}

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    lowStockItems: 0,
    expiringSoon: 0,
    totalValue: 0,
    outOfStock: 0,
    categories: 0
  });
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  const [stockAdjustment, setStockAdjustment] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: 0,
    reason: '',
    reference: ''
  });

  // Fetch inventory data
  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await medicinesAPI.getAll({
        search: searchTerm || undefined,
        category: categoryFilter && categoryFilter !== "all" ? categoryFilter : undefined,
        lowStock: stockFilter === 'low' ? true : undefined,
        expiringSoon: stockFilter === 'expiring' ? true : undefined
      });
      
      const medicines = response.medicines || [];
      
      // Transform medicines data to inventory format
      const inventoryData: InventoryItem[] = medicines.map((med: any) => ({
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        manufacturer: med.manufacturer || 'Unknown',
        category: med.category || 'General',
        batchNumber: med.batchNumber || 'N/A',
        quantity: Number(med.quantity) || 0,
        minStockLevel: Number(med.minStockLevel) || 10,
        maxStockLevel: Number(med.maxStockLevel) || 100,
        price: Number(med.price) || 0,
        costPrice: Number(med.costPrice) || Number(med.price) * 0.7 || 0,
        expiryDate: med.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        manufactureDate: med.manufactureDate || new Date().toISOString(),
        location: med.location || 'Main Store',
        supplier: med.supplier || 'Unknown',
        barcode: med.barcode,
        description: med.description,
        createdAt: med.createdAt || new Date().toISOString(),
        updatedAt: med.updatedAt || new Date().toISOString()
      }));
      
      setInventory(inventoryData);
      
      // Calculate stats
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const lowStock = inventoryData.filter(item => item.quantity <= item.minStockLevel).length;
      const expiring = inventoryData.filter(item => new Date(item.expiryDate) <= thirtyDaysFromNow).length;
      const outOfStock = inventoryData.filter(item => item.quantity === 0).length;
      const totalValue = inventoryData.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      const categories = new Set(inventoryData.map(item => item.category)).size;
      
      setStats({
        totalItems: inventoryData.length,
        lowStockItems: lowStock,
        expiringSoon: expiring,
        totalValue,
        outOfStock,
        categories
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setError(errorMessage);
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, categoryFilter, stockFilter]);

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handle view item
  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  // Handle edit item
  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData(item);
    setIsEditDialogOpen(true);
  };

  // Handle add new item
  const handleAddItem = () => {
    setFormData({
      name: '',
      genericName: '',
      manufacturer: '',
      category: '',
      batchNumber: '',
      quantity: 0,
      minStockLevel: 10,
      maxStockLevel: 100,
      price: 0,
      costPrice: 0,
      location: 'Main Store',
      supplier: '',
      description: ''
    });
    setIsAddDialogOpen(true);
  };

  // Handle stock adjustment
  const handleStockAdjustment = (item: InventoryItem) => {
    setSelectedItem(item);
    setStockAdjustment({
      type: 'IN',
      quantity: 0,
      reason: '',
      reference: ''
    });
    setIsStockDialogOpen(true);
  };

  // Submit form
  const handleSubmit = async (isEdit: boolean) => {
    try {
      setIsSubmitting(true);
      setError("");

      if (isEdit && selectedItem) {
        await medicinesAPI.update(selectedItem.id, formData);
        setIsEditDialogOpen(false);
      } else {
        await medicinesAPI.create(formData);
        setIsAddDialogOpen(false);
      }
      
      await fetchInventory();
      setFormData({});
      setSelectedItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit stock adjustment
  const handleStockSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError("");

      if (!selectedItem) return;

      let newQuantity = selectedItem.quantity;
      if (stockAdjustment.type === 'IN') {
        newQuantity += stockAdjustment.quantity;
      } else if (stockAdjustment.type === 'OUT') {
        newQuantity -= stockAdjustment.quantity;
      } else {
        newQuantity = stockAdjustment.quantity;
      }

      await medicinesAPI.update(selectedItem.id, { quantity: Math.max(0, newQuantity) });
      
      setIsStockDialogOpen(false);
      await fetchInventory();
      setSelectedItem(null);
      setStockAdjustment({ type: 'IN', quantity: 0, reason: '', reference: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;
    
    try {
      setIsSubmitting(true);
      await medicinesAPI.delete(item.id);
      await fetchInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get stock status
  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (item.quantity <= item.minStockLevel) return { label: 'Low Stock', variant: 'warning' as const };
    if (item.quantity >= item.maxStockLevel) return { label: 'Overstock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'success' as const };
  };

  // Get expiry status
  const getExpiryStatus = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { label: 'Expired', variant: 'destructive' as const };
    if (daysUntilExpiry <= 30) return { label: 'Expiring Soon', variant: 'warning' as const };
    if (daysUntilExpiry <= 90) return { label: 'Expires in 3 months', variant: 'secondary' as const };
    return { label: 'Good', variant: 'success' as const };
  };

  // Filter inventory based on search and filters
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.genericName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || item.category === categoryFilter;
    
    const matchesStock = !stockFilter || stockFilter === 'all' || 
      (stockFilter === 'low' && item.quantity <= item.minStockLevel) ||
      (stockFilter === 'out' && item.quantity === 0) ||
      (stockFilter === 'expiring' && new Date(item.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">Monitor stock levels and manage inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInventory} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Items
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Unique medicines</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expiring Soon
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Out of Stock
            </CardTitle>
            <Package2 className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground">Items unavailable</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">UGX {stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Inventory worth</p>
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
                placeholder="Search by name, batch, manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                <SelectItem value="Vitamins">Vitamins</SelectItem>
                <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
                <SelectItem value="Respiratory">Respiratory</SelectItem>
                <SelectItem value="Digestive">Digestive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items ({filteredInventory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading inventory...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {error ? 'Failed to load inventory' : 'No inventory items found matching your criteria.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => {
                    const stockStatus = getStockStatus(item);
                    const expiryStatus = getExpiryStatus(item.expiryDate);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.genericName && `${item.genericName} • `}{item.manufacturer}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{item.batchNumber}</div>
                            <div className="text-muted-foreground">{item.category}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{item.quantity}</div>
                            <div className="text-muted-foreground">
                              Min: {item.minStockLevel} | Max: {item.maxStockLevel}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">UGX {item.price.toLocaleString()}</div>
                            <div className="text-muted-foreground">
                              Cost: UGX {item.costPrice.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(item.expiryDate).toLocaleDateString()}</div>
                            <Badge variant={expiryStatus.variant} className="text-xs">
                              {expiryStatus.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{item.location}</div>
                            <div className="text-muted-foreground">{item.supplier}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.label}
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
                              <DropdownMenuItem onClick={() => handleViewItem(item)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Item
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStockAdjustment(item)}>
                                <Package className="mr-2 h-4 w-4" />
                                Adjust Stock
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteItem(item)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Item
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
 
     {/* View Item Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
            <DialogDescription>
              View detailed information about this inventory item.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="grid gap-6 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Medicine Name</Label>
                    <p className="text-sm">{selectedItem.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Generic Name</Label>
                    <p className="text-sm">{selectedItem.genericName || 'N/A'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Manufacturer</Label>
                    <p className="text-sm">{selectedItem.manufacturer}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm">{selectedItem.category}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Batch Number</Label>
                    <p className="text-sm">{selectedItem.batchNumber}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Current Stock</Label>
                    <p className="text-sm font-bold text-2xl">{selectedItem.quantity}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Stock Levels</Label>
                    <p className="text-sm">Min: {selectedItem.minStockLevel} | Max: {selectedItem.maxStockLevel}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selling Price</Label>
                    <p className="text-sm">UGX {selectedItem.price.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cost Price</Label>
                    <p className="text-sm">UGX {selectedItem.costPrice.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Stock Status</Label>
                    <Badge variant={getStockStatus(selectedItem).variant}>
                      {getStockStatus(selectedItem).label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Dates and Location */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Expiry Date</Label>
                    <p className="text-sm">{new Date(selectedItem.expiryDate).toLocaleDateString()}</p>
                    <Badge variant={getExpiryStatus(selectedItem.expiryDate).variant} className="text-xs">
                      {getExpiryStatus(selectedItem.expiryDate).label}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Manufacture Date</Label>
                    <p className="text-sm">{new Date(selectedItem.manufactureDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm">{selectedItem.location}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Supplier</Label>
                    <p className="text-sm">{selectedItem.supplier}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {(selectedItem.barcode || selectedItem.description) && (
                <div className="space-y-4">
                  {selectedItem.barcode && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Barcode</Label>
                      <p className="text-sm font-mono">{selectedItem.barcode}</p>
                    </div>
                  )}
                  {selectedItem.description && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm">{selectedItem.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          setFormData({});
          setSelectedItem(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? 'Update the inventory item details.' : 'Add a new item to the inventory.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter medicine name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genericName">Generic Name</Label>
                <Input
                  id="genericName"
                  value={formData.genericName || ''}
                  onChange={(e) => setFormData({...formData, genericName: e.target.value})}
                  placeholder="Enter generic name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer || ''}
                  onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                  placeholder="Enter manufacturer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category || ''} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                    <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                    <SelectItem value="Vitamins">Vitamins</SelectItem>
                    <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
                    <SelectItem value="Respiratory">Respiratory</SelectItem>
                    <SelectItem value="Digestive">Digestive</SelectItem>
                    <SelectItem value="Dermatology">Dermatology</SelectItem>
                    <SelectItem value="Neurology">Neurology</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number *</Label>
                <Input
                  id="batchNumber"
                  value={formData.batchNumber || ''}
                  onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                  placeholder="Enter batch number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode || ''}
                  onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                  placeholder="Enter barcode"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity || 0}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Min Stock Level *</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  min="0"
                  value={formData.minStockLevel || 10}
                  onChange={(e) => setFormData({...formData, minStockLevel: parseInt(e.target.value) || 10})}
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStockLevel">Max Stock Level *</Label>
                <Input
                  id="maxStockLevel"
                  type="number"
                  min="0"
                  value={formData.maxStockLevel || 100}
                  onChange={(e) => setFormData({...formData, maxStockLevel: parseInt(e.target.value) || 100})}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Selling Price (UGX) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || 0}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (UGX) *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice || 0}
                  onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value ? new Date(e.target.value).toISOString() : ''})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufactureDate">Manufacture Date</Label>
                <Input
                  id="manufactureDate"
                  type="date"
                  value={formData.manufactureDate ? new Date(formData.manufactureDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({...formData, manufactureDate: e.target.value ? new Date(e.target.value).toISOString() : ''})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Storage Location *</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Main Store, Refrigerator"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier || ''}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  placeholder="Enter supplier name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Additional notes or description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
              setFormData({});
              setSelectedItem(null);
            }} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(isEditDialogOpen)} disabled={isSubmitting || !formData.name}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isEditDialogOpen ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                isEditDialogOpen ? 'Update Item' : 'Add Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Adjust the stock level for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Stock</Label>
                <p className="text-2xl font-bold">{selectedItem.quantity}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adjustmentType">Adjustment Type</Label>
                <Select value={stockAdjustment.type} onValueChange={(value: 'IN' | 'OUT' | 'ADJUSTMENT') => 
                  setStockAdjustment({...stockAdjustment, type: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">Stock In (+)</SelectItem>
                    <SelectItem value="OUT">Stock Out (-)</SelectItem>
                    <SelectItem value="ADJUSTMENT">Set Exact Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustmentQuantity">
                  {stockAdjustment.type === 'ADJUSTMENT' ? 'New Stock Level' : 'Quantity'}
                </Label>
                <Input
                  id="adjustmentQuantity"
                  type="number"
                  min="0"
                  value={stockAdjustment.quantity}
                  onChange={(e) => setStockAdjustment({...stockAdjustment, quantity: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustmentReason">Reason *</Label>
                <Input
                  id="adjustmentReason"
                  value={stockAdjustment.reason}
                  onChange={(e) => setStockAdjustment({...stockAdjustment, reason: e.target.value})}
                  placeholder="e.g., New delivery, Damaged goods, Inventory count"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adjustmentReference">Reference (Optional)</Label>
                <Input
                  id="adjustmentReference"
                  value={stockAdjustment.reference}
                  onChange={(e) => setStockAdjustment({...stockAdjustment, reference: e.target.value})}
                  placeholder="e.g., Invoice number, PO number"
                />
              </div>

              {stockAdjustment.type !== 'ADJUSTMENT' && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">New stock level will be: </span>
                    {stockAdjustment.type === 'IN' 
                      ? selectedItem.quantity + stockAdjustment.quantity
                      : Math.max(0, selectedItem.quantity - stockAdjustment.quantity)
                    }
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleStockSubmit} 
              disabled={isSubmitting || !stockAdjustment.reason || stockAdjustment.quantity <= 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adjusting...
                </>
              ) : (
                'Adjust Stock'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}