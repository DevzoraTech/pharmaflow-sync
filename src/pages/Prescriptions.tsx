import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
  User,
  Calendar,
  Pill,
  DollarSign,
  ShoppingCart
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
import { prescriptionsAPI, customersAPI, medicinesAPI, type PrescriptionWithDetails, type Customer, type Medicine } from "@/lib/api";
import { Prescription } from "@/types";
import { Prescription } from "@/types";
import { Prescription } from "@/types";
import { Prescription } from "@/types";
import { Prescription } from "@/types";

// TypeScript interfaces

interface PrescriptionForm {
  customerId: string;
  doctorName: string;
  prescriptionNumber: string;
  issueDate: string;
  notes: string;
  items: {
    medicineId: string;
    quantity: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
}

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [newPrescription, setNewPrescription] = useState<PrescriptionForm>({
    customerId: "",
    doctorName: "",
    prescriptionNumber: "",
    issueDate: "",
    notes: "",
    items: [{
      medicineId: "",
      quantity: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: ""
    }]
  });

  // Additional states for functionality
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithDetails | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFillDialogOpen, setIsFillDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [fillForm, setFillForm] = useState({
    paymentMethod: "CASH",
    discount: 0
  });

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    filledToday: 0,
    totalRevenue: 0
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "FILLED":
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Filled</Badge>;
      case "PARTIAL":
        return <Badge variant="secondary"><Pill className="w-3 h-3 mr-1" />Partial</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Fetch prescriptions from API
  const fetchPrescriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await prescriptionsAPI.getAll({
        search: searchTerm || undefined,
        status: statusFilter && statusFilter !== "all" ? statusFilter : undefined
      });
      
      setPrescriptions(response.prescriptions || []);
      
      // Calculate stats
      const pending = response.prescriptions?.filter((p: Prescription) => p.status === 'PENDING').length || 0;
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      
      console.log('Calculating prescription stats:', {
        totalPrescriptions: response.prescriptions?.length,
        today,
        prescriptions: response.prescriptions?.map(p => ({
          id: p.id,
          status: p.status,
          updated_at: p.updated_at,
          created_at: p.created_at,
          total: p.total
        }))
      });
      
      const filledToday = response.prescriptions?.filter((p: Prescription) => {
        if (p.status !== 'FILLED') return false;
        
        // Try both updated_at and created_at fields, and handle different date formats
        const updateDate = p.updated_at || p.created_at;
        if (!updateDate) return false;
        
        const prescriptionDate = new Date(updateDate).toISOString().split('T')[0];
        return prescriptionDate === today;
      }).length || 0;
      
      // Calculate actual revenue from filled prescriptions today
      const todayRevenue = response.prescriptions?.filter((p: Prescription) => {
        if (p.status !== 'FILLED') return false;
        const updateDate = p.updated_at || p.created_at;
        if (!updateDate) return false;
        const prescriptionDate = new Date(updateDate).toISOString().split('T')[0];
        return prescriptionDate === today;
      }).reduce((sum, p) => {
        // Get the total from the associated sale
        const sale = p.sales && p.sales.length > 0 ? p.sales[0] : null;
        return sum + (sale?.total || 0);
      }, 0) || 0;
      
      console.log('Prescription stats calculated:', {
        pending,
        filledToday,
        todayRevenue
      });
      
      setStats({
        pending,
        filledToday,
        totalRevenue: todayRevenue
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prescriptions';
      setError(errorMessage);
      console.error('Error fetching prescriptions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  // Load initial data
  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  // Load customers and medicines for forms
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [customersResponse, medicinesResponse] = await Promise.all([
          customersAPI.getAll(),
          medicinesAPI.getAll()
        ]);
        setCustomers(customersResponse.customers || []);
        setMedicines(medicinesResponse.medicines || []);
      } catch (err) {
        console.error('Error loading form data:', err);
      }
    };
    loadFormData();
  }, []);

  const handleAddPrescription = async () => {
    try {
      setIsSubmitting(true);
      setError("");

      // Validate required fields
      if (!newPrescription.customerId || !newPrescription.doctorName || !newPrescription.prescriptionNumber) {
        setError("Please fill in all required fields");
        return;
      }

      if (newPrescription.items.some(item => !item.medicineId || !item.quantity || !item.dosage)) {
        setError("Please complete all prescription items");
        return;
      }

      // Prepare data for API
      const prescriptionData = {
        customerId: newPrescription.customerId,
        doctorName: newPrescription.doctorName,
        prescriptionNumber: newPrescription.prescriptionNumber,
        issueDate: newPrescription.issueDate || new Date().toISOString().split('T')[0],
        notes: newPrescription.notes || null,
        items: newPrescription.items.map(item => ({
          medicineId: item.medicineId,
          quantity: parseInt(item.quantity),
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions || null
        }))
      };

      await prescriptionsAPI.create(prescriptionData);
      
      // Reset form and close dialog
      setNewPrescription({
        customerId: "",
        doctorName: "",
        prescriptionNumber: "",
        issueDate: "",
        notes: "",
        items: [{
          medicineId: "",
          quantity: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: ""
        }]
      });
      setIsAddDialogOpen(false);
      
      // Refresh prescriptions list
      await fetchPrescriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsViewDialogOpen(true);
  };

  const handleFillPrescription = (prescription: PrescriptionWithDetails) => {
    setSelectedPrescription(prescription);
    setIsFillDialogOpen(true);
  };

  const confirmFillPrescription = async () => {
    if (!selectedPrescription) return;
    
    try {
      setIsSubmitting(true);
      setError("");

      await prescriptionsAPI.fill(selectedPrescription.id, {
        paymentMethod: fillForm.paymentMethod,
        discount: fillForm.discount
      });
      
      setIsFillDialogOpen(false);
      setSelectedPrescription(null);
      
      // Refresh prescriptions list
      await fetchPrescriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fill prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPrescription = (prescription: PrescriptionWithDetails) => {
    setSelectedPrescription(prescription);
    setIsCancelDialogOpen(true);
  };

  const confirmCancelPrescription = async () => {
    if (!selectedPrescription) return;
    
    try {
      setIsSubmitting(true);
      setError("");

      await prescriptionsAPI.update(selectedPrescription.id, {
        status: 'CANCELLED'
      });
      
      setIsCancelDialogOpen(false);
      setSelectedPrescription(null);
      
      // Refresh prescriptions list
      await fetchPrescriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPrescriptionItem = () => {
    setNewPrescription({
      ...newPrescription,
      items: [...newPrescription.items, {
        medicineId: "",
        quantity: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: ""
      }]
    });
  };

  const removePrescriptionItem = (index: number) => {
    if (newPrescription.items.length > 1) {
      setNewPrescription({
        ...newPrescription,
        items: newPrescription.items.filter((_, i) => i !== index)
      });
    }
  };

  const updatePrescriptionItem = (index: number, field: string, value: string) => {
    const updatedItems = [...newPrescription.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewPrescription({ ...newPrescription, items: updatedItems });
  };

  const calculatePrescriptionTotal = (prescription: PrescriptionWithDetails) => {
    return prescription.prescription_items.reduce((total, item) => {
      return total + (item.quantity * item.medicine.price);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-muted-foreground">Manage customer prescriptions and orders</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
              <DialogDescription>
                Enter the prescription details and add medicines.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-sm font-medium">
                    Customer <span className="text-destructive">*</span>
                  </Label>
                  <Select value={newPrescription.customerId} onValueChange={(value) => setNewPrescription({...newPrescription, customerId: value})}>
                    <SelectTrigger className={!newPrescription.customerId ? "border-destructive/50" : ""}>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} {customer.email && `(${customer.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctorName" className="text-sm font-medium">
                    Doctor Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="doctorName"
                    value={newPrescription.doctorName}
                    onChange={(e) => setNewPrescription({...newPrescription, doctorName: e.target.value})}
                    placeholder="e.g., Dr. Smith"
                    className={!newPrescription.doctorName ? "border-destructive/50" : ""}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prescriptionNumber" className="text-sm font-medium">
                    Prescription Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="prescriptionNumber"
                    value={newPrescription.prescriptionNumber}
                    onChange={(e) => setNewPrescription({...newPrescription, prescriptionNumber: e.target.value})}
                    placeholder="e.g., RX001"
                    className={!newPrescription.prescriptionNumber ? "border-destructive/50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={newPrescription.issueDate}
                    onChange={(e) => setNewPrescription({...newPrescription, issueDate: e.target.value})}
                  />
                </div>
              </div>
              
              {/* Prescription Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Prescription Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPrescriptionItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                {newPrescription.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {newPrescription.items.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removePrescriptionItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Medicine *</Label>
                        <Select 
                          value={item.medicineId} 
                          onValueChange={(value) => updatePrescriptionItem(index, 'medicineId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select medicine" />
                          </SelectTrigger>
                          <SelectContent>
                            {medicines.map((medicine) => (
                              <SelectItem key={medicine.id} value={medicine.id}>
                                {medicine.name} - UGX {medicine.price} (Stock: {medicine.quantity})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updatePrescriptionItem(index, 'quantity', e.target.value)}
                          placeholder="e.g., 30"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Dosage *</Label>
                        <Input
                          value={item.dosage}
                          onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)}
                          placeholder="e.g., 500mg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Input
                          value={item.frequency}
                          onChange={(e) => updatePrescriptionItem(index, 'frequency', e.target.value)}
                          placeholder="e.g., Twice daily"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input
                          value={item.duration}
                          onChange={(e) => updatePrescriptionItem(index, 'duration', e.target.value)}
                          placeholder="e.g., 7 days"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Instructions</Label>
                      <Textarea
                        value={item.instructions}
                        onChange={(e) => updatePrescriptionItem(index, 'instructions', e.target.value)}
                        placeholder="Special instructions..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newPrescription.notes}
                  onChange={(e) => setNewPrescription({...newPrescription, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAddPrescription} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Prescription'
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
              Pending Prescriptions
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Filled Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.filledToday}</div>
            <p className="text-xs text-muted-foreground">Completed prescriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">UGX {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From prescriptions today</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search prescriptions by number, customer, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FILLED">Filled</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
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

      {/* Prescriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading prescriptions...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prescription</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {error ? 'Failed to load prescriptions' : 'No prescriptions found matching your search criteria.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  prescriptions.map((prescription: Prescription) => (
                    <TableRow key={prescription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{prescription.prescription_number}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {prescription.id.substring(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{prescription.customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {prescription.customer.email || prescription.customer.phone || 'No contact'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{prescription.doctorName}</TableCell>
                      <TableCell>{prescription.doctor_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(prescription.issue_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{prescription._count.items}</span> items
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          UGX {calculatePrescriptionTotal(prescription).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(prescription.status)}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleViewPrescription(prescription)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {prescription.status === 'PENDING' && (
                              <DropdownMenuItem onClick={() => handleFillPrescription(prescription)}>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Fill Prescription
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {(prescription.status === 'PENDING' || prescription.status === 'PARTIAL') && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleCancelPrescription(prescription)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Cancel Prescription
                              </DropdownMenuItem>
                            )}
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

      {/* View Prescription Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              View detailed information about this prescription.
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="grid gap-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prescription Number</Label>
                  <p className="text-sm">{selectedPrescription.prescription_number}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  {getStatusBadge(selectedPrescription.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Customer</Label>
                  <div>
                    <p className="text-sm font-medium">{selectedPrescription.customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPrescription.customer.email || selectedPrescription.customer.phone || 'No contact info'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Doctor</Label>
                  <p className="text-sm">{selectedPrescription.doctor_name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Issue Date</Label>
                  <p className="text-sm">{new Date(selectedPrescription.issue_date).toLocaleDateString()}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-sm font-medium">UGX {calculatePrescriptionTotal(selectedPrescription).toLocaleString()}</p>
                </div>
              </div>

              {/* Prescription Items */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Prescription Items</Label>
                <div className="space-y-3">
                  {selectedPrescription.prescription_items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <Label className="text-sm font-medium">Medicine</Label>
                          <p className="text-sm">{item.medicine.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Quantity</Label>
                          <p className="text-sm">{item.quantity} units</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <Label className="text-sm font-medium">Dosage</Label>
                          <p className="text-sm">{item.dosage}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Frequency</Label>
                          <p className="text-sm">{item.frequency}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Duration</Label>
                          <p className="text-sm">{item.duration}</p>
                        </div>
                      </div>
                      {item.instructions && (
                        <div>
                          <Label className="text-sm font-medium">Instructions</Label>
                          <p className="text-sm text-muted-foreground">{item.instructions}</p>
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm">
                          <span className="font-medium">Subtotal:</span> UGX {(item.quantity * item.medicine.price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedPrescription.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fill Prescription Dialog */}
      <Dialog open={isFillDialogOpen} onOpenChange={setIsFillDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fill Prescription</DialogTitle>
            <DialogDescription>
              Process this prescription and create a sale transaction.
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="grid gap-4 py-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Prescription Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Number:</span> {selectedPrescription.prescription_number}</p>
                  <p><span className="font-medium">Customer:</span> {selectedPrescription.customer.name}</p>
                  <p><span className="font-medium">Doctor:</span> {selectedPrescription.doctor_name}</p>
                  <p><span className="font-medium">Items:</span> {selectedPrescription._count.items}</p>
                  <p><span className="font-medium">Total:</span> UGX {calculatePrescriptionTotal(selectedPrescription).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select 
                    value={fillForm.paymentMethod} 
                    onValueChange={(value) => setFillForm({...fillForm, paymentMethod: value})}
                  >
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
                  <Label htmlFor="discount">Discount ($)</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={fillForm.discount}
                    onChange={(e) => setFillForm({...fillForm, discount: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Transaction Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>UGX {calculatePrescriptionTotal(selectedPrescription).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%):</span>
                    <span>UGX {(calculatePrescriptionTotal(selectedPrescription) * 0.1).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-UGX {fillForm.discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total:</span>
                    <span>UGX {(calculatePrescriptionTotal(selectedPrescription) * 1.1 - fillForm.discount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFillDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={confirmFillPrescription} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Fill Prescription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Prescription Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Prescription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this prescription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Prescription Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Number:</span> {selectedPrescription.prescription_number}</p>
                  <p><span className="font-medium">Customer:</span> {selectedPrescription.customer.name}</p>
                  <p><span className="font-medium">Doctor:</span> {selectedPrescription.doctor_name}</p>
                  <p><span className="font-medium">Status:</span> {selectedPrescription.status}</p>
                  <p><span className="font-medium">Items:</span> {selectedPrescription._count.items}</p>
                  <p><span className="font-medium">Total Value:</span> UGX {calculatePrescriptionTotal(selectedPrescription).toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Warning</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  Cancelling this prescription will prevent it from being filled and cannot be reversed.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} disabled={isSubmitting}>
              Keep Prescription
            </Button>
            <Button variant="destructive" onClick={confirmCancelPrescription} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                'Cancel Prescription'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}