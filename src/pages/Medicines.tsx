import { useState } from "react";
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
  Trash2
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

// Mock data for demonstration
const mockMedicines = [
  {
    id: "1",
    name: "Paracetamol 500mg",
    genericName: "Acetaminophen",
    manufacturer: "PharmaCorp",
    category: "Pain Relief",
    quantity: 150,
    minStockLevel: 50,
    price: 8.99,
    expiryDate: "2024-12-15",
    batchNumber: "PC001",
    location: "A1-B2"
  },
  {
    id: "2",
    name: "Amoxicillin 250mg",
    genericName: "Amoxicillin",
    manufacturer: "MediLab",
    category: "Antibiotics",
    quantity: 5,
    minStockLevel: 20,
    price: 15.50,
    expiryDate: "2024-08-10",
    batchNumber: "ML205",
    location: "C3-D1"
  },
  {
    id: "3",
    name: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    manufacturer: "HealthMax",
    category: "Anti-inflammatory",
    quantity: 75,
    minStockLevel: 30,
    price: 12.25,
    expiryDate: "2025-03-20",
    batchNumber: "HM302",
    location: "A2-C3"
  }
];

export default function Medicines() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const getStockStatus = (quantity: number, minLevel: number) => {
    if (quantity <= 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (quantity <= minLevel) return { label: "Low Stock", variant: "warning" as const };
    return { label: "In Stock", variant: "success" as const };
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Medicine Inventory</h1>
          <p className="text-muted-foreground">Manage your pharmacy's medicine stock</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Medicine
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Medicines
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">5</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Expiring Soon
            </CardTitle>
            <Calendar className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">12</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
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
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="pain-relief">Pain Relief</SelectItem>
                <SelectItem value="antibiotics">Antibiotics</SelectItem>
                <SelectItem value="anti-inflammatory">Anti-inflammatory</SelectItem>
                <SelectItem value="vitamins">Vitamins</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Medicine Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medicine List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMedicines.map((medicine) => {
                const stockStatus = getStockStatus(medicine.quantity, medicine.minStockLevel);
                const expiringSoon = isExpiringSoon(medicine.expiryDate);
                
                return (
                  <TableRow key={medicine.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{medicine.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {medicine.genericName} • {medicine.manufacturer}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    <TableCell>${medicine.price}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{medicine.expiryDate}</div>
                        {expiringSoon && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{medicine.location}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}