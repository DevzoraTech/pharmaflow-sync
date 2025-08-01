import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter, 
  Package,
  AlertTriangle,
  Calendar,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Loader2
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
import { medicinesAPI, type MedicineWithStock } from "@/lib/api";

// TypeScript interfaces

interface MedicineStats {
  totalMedicines: number;
  lowStockItems: number;
  expiringSoon: number;
  totalValue: number;
  outOfStock: number;
  categories: number;
}

interface NewMedicineForm {
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  quantity: string;
  minStockLevel: string;
  price: string;
  expiryDate: string;
  batchNumber: string;
  location: string;
  description: string;
}



export default function Medicines() {
  const [medicines, setMedicines] = useState<MedicineWithStock[]>([]);
  const [stats, setStats] = useState<MedicineStats>({
    totalMedicines: 0,
    lowStockItems: 0,
    expiringSoon: 0,
    totalValue: 0,
    outOfStock: 0,
    categories: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMedicine, setNewMedicine] = useState<NewMedicineForm>({
    name: "",
    genericName: "",
    manufacturer: "",
    category: "",
    quantity: "",
    minStockLevel: "",
    price: "",
    expiryDate: "",
    batchNumber: "",
    location: "",
    description: ""
  });

  // Additional state for new functionality
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineWithStock | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [expiringSoonFilter, setExpiringSoonFilter] = useState(false);
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([]);
  const [editForm, setEditForm] = useState<NewMedicineForm>({
    name: "",
    genericName: "",
    manufacturer: "",
    category: "",
    quantity: "",
    minStockLevel: "",
    price: "",
    expiryDate: "",
    batchNumber: "",
    location: "",
    description: ""
  });

  // Fetch medicines from API
  const fetchMedicines = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await medicinesAPI.getAll({
        search: searchTerm || undefined,
        category: selectedCategory && selectedCategory !== "all" ? selectedCategory : undefined,
        lowStock: lowStockFilter,
        expiringSoon: expiringSoonFilter
      });
      
      setMedicines(response.medicines || []);
      setStats(response.stats || { 
        totalMedicines: 0, 
        lowStockItems: 0, 
        expiringSoon: 0,
        totalValue: 0,
        outOfStock: 0,
        categories: 0
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch medicines';
      setError(errorMessage);
      console.error('Error fetching medicines:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory, lowStockFilter, expiringSoonFilter]);

  // Load medicines on component mount and when search/filter changes
  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity <= 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (quantity <= minLevel) return { label: "Low Stock", variant: "warning" as const };
    return { label: "In Stock", variant: "success" as const };
  };

  const getExpiryBadge = (expiryStatus: string) => {
    switch (expiryStatus) {
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'expiring_soon':
        return <Badge variant="warning">Expiring Soon</Badge>;
      default:
        return <Badge variant="success">Valid</Badge>;
    }
  };

  const categories = [
    { value: "Pain Relief", label: "Pain Relief" },
    { value: "Antibiotics", label: "Antibiotics" },
    { value: "Anti-inflammatory", label: "Anti-inflammatory" },
    { value: "Vitamins", label: "Vitamins" },
    { value: "Diabetes", label: "Diabetes" },
    { value: "Gastrointestinal", label: "Gastrointestinal" },
    { value: "Cardiovascular", label: "Cardiovascular" }
  ];

  const handleAddMedicine = async () => {
    try {
      setIsSubmitting(true);
      setError("");

      // Validate required fields
      if (!newMedicine.name || !newMedicine.manufacturer || !newMedicine.category) {
        setError("Please fill in all required fields");
        return;
      }

      // Prepare data for API
      const medicineData = {
        name: newMedicine.name,
        generic_name: newMedicine.genericName || null,
        manufacturer: newMedicine.manufacturer,
        category: newMedicine.category,
        description: newMedicine.description || null,
        price: parseFloat(newMedicine.price) || 0,
        quantity: parseInt(newMedicine.quantity) || 0,
        min_stock_level: parseInt(newMedicine.minStockLevel) || 0,
        expiry_date: newMedicine.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        batch_number: newMedicine.batchNumber,
        location: newMedicine.location || null
      };

      await medicinesAPI.create(medicineData);
      
      // Reset form and close dialog
      setNewMedicine({
        name: "",
        genericName: "",
        manufacturer: "",
        category: "",
        quantity: "",
        minStockLevel: "",
        price: "",
        expiryDate: "",
        batchNumber: "",
        location: "",
        description: ""
      });
      setIsAddDialogOpen(false);
      
      // Refresh medicines list
      await fetchMedicines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewMedicine = (medicine: MedicineWithStock) => {
    setSelectedMedicine(medicine);
    setIsViewDialogOpen(true);
  };

  const handleEditMedicine = (medicine: MedicineWithStock) => {
    setSelectedMedicine(medicine);
    setEditForm({
      name: medicine.name || "",
      genericName: medicine.generic_name || "",
      manufacturer: medicine.manufacturer || "",
      category: medicine.category || "",
      quantity: (medicine.quantity || 0).toString(),
      minStockLevel: (medicine.min_stock_level || 0).toString(),
      price: (medicine.price || 0).toString(),
      expiryDate: medicine.expiry_date || "",
      batchNumber: medicine.batch_number || "",
      location: medicine.location || "",
      description: medicine.description || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateMedicine = async () => {
    if (!selectedMedicine) return;
    
    try {
      setIsSubmitting(true);
      setError("");

      // Validate required fields
      if (!editForm.name || !editForm.manufacturer || !editForm.category) {
        setError("Please fill in all required fields");
        return;
      }

      // Prepare data for API
      const medicineData = {
        name: editForm.name,
        generic_name: editForm.genericName || null,
        manufacturer: editForm.manufacturer,
        category: editForm.category,
        description: editForm.description || null,
        price: parseFloat(editForm.price) || 0,
        quantity: parseInt(editForm.quantity) || 0,
        min_stock_level: parseInt(editForm.minStockLevel) || 0,
        expiry_date: editForm.expiryDate,
        batch_number: editForm.batchNumber,
        location: editForm.location || null
      };

      await medicinesAPI.update(selectedMedicine.id, medicineData);
      
      setIsEditDialogOpen(false);
      setSelectedMedicine(null);
      
      // Refresh medicines list
      await fetchMedicines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMedicine = (medicine: MedicineWithStock) => {
    setSelectedMedicine(medicine);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteMedicine = async () => {
    if (!selectedMedicine) return;
    
    try {
      setIsSubmitting(true);
      setError("");

      console.log('Deleting medicine:', selectedMedicine.id);
      await medicinesAPI.delete(selectedMedicine.id);
      console.log('Medicine deleted successfully');
      
      // Immediately update the UI by removing the medicine from the state
      setMedicines(prevMedicines => {
        const updatedMedicines = prevMedicines.filter(med => med.id !== selectedMedicine.id);
        console.log('Updated medicines count:', updatedMedicines.length);
        return updatedMedicines;
      });
      
      // Update stats immediately
      setStats(prevStats => ({
        ...prevStats,
        totalMedicines: prevStats.totalMedicines - 1,
        lowStockItems: selectedMedicine.quantity <= selectedMedicine.min_stock_level ? 
          Math.max(0, prevStats.lowStockItems - 1) : prevStats.lowStockItems
      }));
      
      setIsDeleteDialogOpen(false);
      setSelectedMedicine(null);
      
      // Also refresh from server to ensure consistency
      console.log('Refreshing medicines list from server...');
      await fetchMedicines();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Medicine Inventory</h1>
          <p className="text-muted-foreground">Manage your pharmacy's medicine stock</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Medicine</DialogTitle>
              <DialogDescription>
                Enter the details for the new medicine to add to your inventory.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Medicine Name</Label>
                  <Input
                    id="name"
                    value={newMedicine.name}
                    onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                    placeholder="e.g., Paracetamol 500mg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genericName">Generic Name</Label>
                  <Input
                    id="genericName"
                    value={newMedicine.genericName}
                    onChange={(e) => setNewMedicine({...newMedicine, genericName: e.target.value})}
                    placeholder="e.g., Acetaminophen"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={newMedicine.manufacturer}
                    onChange={(e) => setNewMedicine({...newMedicine, manufacturer: e.target.value})}
                    placeholder="e.g., PharmaCorp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newMedicine.category} onValueChange={(value) => setNewMedicine({...newMedicine, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.label}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newMedicine.quantity}
                    onChange={(e) => setNewMedicine({...newMedicine, quantity: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStockLevel">Min Stock Level</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    value={newMedicine.minStockLevel}
                    onChange={(e) => setNewMedicine({...newMedicine, minStockLevel: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (UGX)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newMedicine.price}
                    onChange={(e) => setNewMedicine({...newMedicine, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={newMedicine.expiryDate}
                    onChange={(e) => setNewMedicine({...newMedicine, expiryDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchNumber">Batch Number</Label>
                  <Input
                    id="batchNumber"
                    value={newMedicine.batchNumber}
                    onChange={(e) => setNewMedicine({...newMedicine, batchNumber: e.target.value})}
                    placeholder="e.g., PC001"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Storage Location</Label>
                <Input
                  id="location"
                  value={newMedicine.location}
                  onChange={(e) => setNewMedicine({...newMedicine, location: e.target.value})}
                  placeholder="e.g., A1-B2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newMedicine.description}
                  onChange={(e) => setNewMedicine({...newMedicine, description: e.target.value})}
                  placeholder="Brief description of the medicine..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAddMedicine} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Medicine'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Medicines
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold">{stats.totalMedicines}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-warning">{stats.lowStockItems}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Expiring Soon
            </CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-destructive">{stats.expiringSoon}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold">UGX {stats.totalValue.toLocaleString()}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Inventory value</p>
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
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                <SelectItem value="Anti-inflammatory">Anti-inflammatory</SelectItem>
                <SelectItem value="Vitamins">Vitamins</SelectItem>
                <SelectItem value="Diabetes">Diabetes</SelectItem>
                <SelectItem value="Gastrointestinal">Gastrointestinal</SelectItem>
                <SelectItem value="Cardiovascular">Cardiovascular</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              className="gap-2 w-full sm:w-auto"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
          
          {/* Advanced Filters */}
          {isFiltersOpen && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Stock Status</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={lowStockFilter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLowStockFilter(!lowStockFilter)}
                      className="text-xs"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Low Stock
                    </Button>
                    <Button
                      variant={expiringSoonFilter ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExpiringSoonFilter(!expiringSoonFilter)}
                      className="text-xs"
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Expiring Soon
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Price Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      className="text-xs"
                      step="0.01"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      className="text-xs"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Manufacturer</Label>
                  <Input
                    placeholder="Filter by manufacturer"
                    className="text-xs"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Location</Label>
                  <Input
                    placeholder="Filter by location"
                    className="text-xs"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLowStockFilter(false);
                    setExpiringSoonFilter(false);
                    setSelectedCategory("all");
                    setSearchTerm("");
                  }}
                >
                  Clear Filters
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsFiltersOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Medicine Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medicine List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading medicines...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="hidden md:table-cell">Price</TableHead>
                    <TableHead className="hidden lg:table-cell">Expiry</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {error ? 'Failed to load medicines' : 'No medicines found matching your search criteria.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    medicines.map((medicine: MedicineWithStock) => {
                      const stockStatus = getStockStatus(medicine.quantity, medicine.min_stock_level);
                      
                      return (
                        <TableRow key={medicine.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{medicine.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {medicine.generic_name && `${medicine.generic_name} • `}{medicine.manufacturer}
                              </div>
                              <div className="sm:hidden mt-1">
                                <Badge variant="outline" className="text-xs">{medicine.category}</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline">{medicine.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{medicine.quantity} units</div>
                              <Badge variant={stockStatus.variant} className="text-xs">
                                {stockStatus.label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">UGX {medicine.price.toLocaleString()}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="space-y-1">
                              <div className="text-sm">{new Date(medicine.expiry_date).toLocaleDateString()}</div>
                              {getExpiryBadge(medicine.expiry_status)}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="secondary">{medicine.location || 'N/A'}</Badge>
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
                                <DropdownMenuItem onClick={() => handleViewMedicine(medicine)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditMedicine(medicine)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Medicine
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteMedicine(medicine)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Medicine
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Medicine Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medicine Details</DialogTitle>
            <DialogDescription>
              View detailed information about this medicine.
            </DialogDescription>
          </DialogHeader>
          {selectedMedicine && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Medicine Name</Label>
                  <p className="text-sm">{selectedMedicine.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Generic Name</Label>
                  <p className="text-sm">{selectedMedicine.generic_name || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Manufacturer</Label>
                  <p className="text-sm">{selectedMedicine.manufacturer}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Badge variant="outline">{selectedMedicine.category}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quantity</Label>
                  <p className="text-sm">{selectedMedicine.quantity} units</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Min Stock Level</Label>
                  <p className="text-sm">{selectedMedicine.min_stock_level} units</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Price</Label>
                  <p className="text-sm">UGX {selectedMedicine.price.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Expiry Date</Label>
                  <p className="text-sm">{new Date(selectedMedicine.expiry_date).toLocaleDateString()}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Batch Number</Label>
                  <p className="text-sm">{selectedMedicine.batch_number}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Storage Location</Label>
                <p className="text-sm">{selectedMedicine.location || 'N/A'}</p>
              </div>
              {selectedMedicine.description && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm">{selectedMedicine.description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Stock Status</Label>
                  <Badge variant={getStockStatus(selectedMedicine.quantity, selectedMedicine.min_stock_level).variant}>
                    {getStockStatus(selectedMedicine.quantity, selectedMedicine.min_stock_level).label}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Medicine Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
            <DialogDescription>
              Update the details for this medicine.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Medicine Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="e.g., Paracetamol 500mg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-genericName">Generic Name</Label>
                <Input
                  id="edit-genericName"
                  value={editForm.genericName}
                  onChange={(e) => setEditForm({...editForm, genericName: e.target.value})}
                  placeholder="e.g., Acetaminophen"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-manufacturer">Manufacturer</Label>
                <Input
                  id="edit-manufacturer"
                  value={editForm.manufacturer}
                  onChange={(e) => setEditForm({...editForm, manufacturer: e.target.value})}
                  placeholder="e.g., PharmaCorp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editForm.category} onValueChange={(value) => setEditForm({...editForm, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.label}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-minStockLevel">Min Stock Level</Label>
                <Input
                  id="edit-minStockLevel"
                  type="number"
                  value={editForm.minStockLevel}
                  onChange={(e) => setEditForm({...editForm, minStockLevel: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (UGX)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-expiryDate">Expiry Date</Label>
                <Input
                  id="edit-expiryDate"
                  type="date"
                  value={editForm.expiryDate}
                  onChange={(e) => setEditForm({...editForm, expiryDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-batchNumber">Batch Number</Label>
                <Input
                  id="edit-batchNumber"
                  value={editForm.batchNumber}
                  onChange={(e) => setEditForm({...editForm, batchNumber: e.target.value})}
                  placeholder="e.g., PC001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Storage Location</Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                placeholder="e.g., A1-B2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                placeholder="Brief description of the medicine..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMedicine} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Medicine'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Medicine Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medicine</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this medicine? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedMedicine && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium">{selectedMedicine.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedMedicine.generic_name && `${selectedMedicine.generic_name} • `}
                  {selectedMedicine.manufacturer} • {selectedMedicine.category}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Current Stock: {selectedMedicine.quantity} units
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMedicine} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Medicine'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}