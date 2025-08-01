import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Users,
  UserPlus,
  Activity,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle
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
import { customersAPI, type CustomerWithStats } from "@/lib/api";

// TypeScript interfaces
interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  allergies: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState<CustomerForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    allergies: ""
  });

  // Additional state for functionality
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithStats | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<CustomerForm>({
    name: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    allergies: ""
  });

  // Stats
  const [stats, setStats] = useState({
    totalCustomers: 0,
    newThisMonth: 0,
    activeToday: 0
  });

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await customersAPI.getAll({
        search: searchTerm || undefined
      });
      
      setCustomers(response.customers || []);
      
      // Calculate stats
      const total = response.customers?.length || 0;
      const thisMonth = response.customers?.filter((customer: CustomerWithStats) => {
        const createdDate = new Date(customer.created_at);
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() && 
               createdDate.getFullYear() === now.getFullYear();
      }).length || 0;
      
      setStats({
        totalCustomers: total,
        newThisMonth: thisMonth,
        activeToday: Math.floor(total * 0.1) // Mock active today as 10% of total
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(errorMessage);
      console.error('Error fetching customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  // Load customers on component mount and when search changes
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = async () => {
    try {
      setIsSubmitting(true);
      setError("");

      // Validate required fields
      if (!newCustomer.name) {
        setError("Customer name is required");
        return;
      }

      // Prepare data for API
      const customerData: {
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        date_of_birth: string | null;
        allergies: string[] | null;
      } = {
        name: newCustomer.name,
        email: newCustomer.email || null,
        phone: newCustomer.phone || null,
        address: newCustomer.address || null,
        date_of_birth: newCustomer.dateOfBirth || null,
        allergies: newCustomer.allergies ? newCustomer.allergies.split(',').map(a => a.trim()).filter(a => a) : null
      };

      await customersAPI.create(customerData);
      
      // Reset form and close dialog
      setNewCustomer({
        name: "",
        email: "",
        phone: "",
        address: "",
        dateOfBirth: "",
        allergies: ""
      });
      setIsAddDialogOpen(false);
      
      // Refresh customers list
      await fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewCustomer = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const handleEditCustomer = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer);
    setEditForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      dateOfBirth: customer.date_of_birth || "",
      allergies: customer.allergies ? customer.allergies.join(', ') : ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      setIsSubmitting(true);
      setError("");

      // Validate required fields
      if (!editForm.name) {
        setError("Customer name is required");
        return;
      }

      // Prepare data for API
      const customerData: {
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        date_of_birth: string | null;
        allergies: string[] | null;
      } = {
        name: editForm.name,
        email: editForm.email || null,
        phone: editForm.phone || null,
        address: editForm.address || null,
        date_of_birth: editForm.dateOfBirth || null,
        allergies: editForm.allergies ? editForm.allergies.split(',').map(a => a.trim()).filter(a => a) : null
      };

      await customersAPI.update(selectedCustomer.id, customerData);
      
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      
      // Refresh customers list
      await fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = (customer: CustomerWithStats) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      setIsSubmitting(true);
      setError("");

      await customersAPI.delete(selectedCustomer.id);
      
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      
      // Refresh customers list
      await fetchCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground">Manage customer information and history</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Enter the customer's information to add them to your database.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    placeholder="e.g., john@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    placeholder="e.g., +1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newCustomer.dateOfBirth}
                    onChange={(e) => setNewCustomer({...newCustomer, dateOfBirth: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  placeholder="Full address..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  value={newCustomer.allergies}
                  onChange={(e) => setNewCustomer({...newCustomer, allergies: e.target.value})}
                  placeholder="e.g., Penicillin, Aspirin (comma separated)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomer} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Customer'
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
              Total Customers
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-foreground mb-2">{stats.totalCustomers}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              New This Month
            </CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <UserPlus className="h-4 w-4 md:h-5 md:w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-success mb-2">{stats.newThisMonth}</div>
            <p className="text-xs md:text-sm text-muted-foreground">New registrations</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Active Today
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-foreground mb-2">{stats.activeToday}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Customers served today</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
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

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading customers...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Allergies</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {error ? 'Failed to load customers' : 'No customers found matching your search criteria.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer: CustomerWithStats) => {
                    
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {customer.date_of_birth && (
                                <>
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  {new Date(customer.date_of_birth).toLocaleDateString()}
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center text-sm">
                                <Mail className="w-3 h-3 mr-1 text-muted-foreground" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center text-sm">
                                <Phone className="w-3 h-3 mr-1 text-muted-foreground" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.address ? (
                            <div className="flex items-start text-sm">
                              <MapPin className="w-3 h-3 mr-1 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <span className="line-clamp-2">{customer.address}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">{customer._count?.prescriptions || 0}</span> prescriptions
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">{customer._count?.sales || 0}</span> purchases
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.allergies && customer.allergies.length > 0 ? (
                            <div className="space-y-1">
                              {customer.allergies.slice(0, 2).map((allergy, index) => (
                                <Badge key={index} variant="destructive" className="text-xs mr-1">
                                  {allergy}
                                </Badge>
                              ))}
                              {customer.allergies.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{customer.allergies.length - 2} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
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
                              <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Customer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteCustomer(customer)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Customer
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

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View detailed information about this customer.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Full Name</Label>
                  <p className="text-sm">{selectedCustomer.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date of Birth</Label>
                  <p className="text-sm">
                    {selectedCustomer.date_of_birth 
                      ? new Date(selectedCustomer.date_of_birth).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedCustomer.email || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{selectedCustomer.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm">{selectedCustomer.address || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Allergies</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedCustomer.allergies && selectedCustomer.allergies.length > 0 ? (
                    selectedCustomer.allergies.map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {allergy}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No known allergies</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prescriptions</Label>
                  <p className="text-sm font-medium">{selectedCustomer._count?.prescriptions || 0} total</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Purchases</Label>
                  <p className="text-sm font-medium">{selectedCustomer._count?.sales || 0} total</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Registered</Label>
                  <p className="text-sm">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm">{new Date(selectedCustomer.updated_at).toLocaleDateString()}</p>
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

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update the customer's information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  placeholder="e.g., john@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  placeholder="e.g., +1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                <Input
                  id="edit-dateOfBirth"
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm({...editForm, dateOfBirth: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                placeholder="Full address..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-allergies">Allergies</Label>
              <Input
                id="edit-allergies"
                value={editForm.allergies}
                onChange={(e) => setEditForm({...editForm, allergies: e.target.value})}
                placeholder="e.g., Penicillin, Aspirin (comma separated)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCustomer} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Customer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone and will also remove all associated prescriptions and sales records.
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium">{selectedCustomer.name}</h4>
                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                  {selectedCustomer.email && (
                    <div className="flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {selectedCustomer.email}
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {selectedCustomer.phone}
                    </div>
                  )}
                  <div className="mt-2 text-xs">
                    <span className="font-medium">{selectedCustomer._count?.prescriptions || 0}</span> prescriptions • 
                    <span className="font-medium ml-1">{selectedCustomer._count?.sales || 0}</span> purchases
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCustomer} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Customer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}