import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockPrescriptions = [
  {
    id: "RX001",
    customerName: "John Doe",
    doctorName: "Dr. Smith",
    issueDate: "2024-07-27",
    status: "pending",
    items: 3,
    total: 45.50
  },
  {
    id: "RX002", 
    customerName: "Sarah Johnson",
    doctorName: "Dr. Wilson",
    issueDate: "2024-07-26",
    status: "filled",
    items: 2,
    total: 32.99
  }
];

export default function Prescriptions() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "filled":
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Filled</Badge>;
      case "cancelled":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-muted-foreground">Manage customer prescriptions and orders</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Prescription
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Prescriptions
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">8</div>
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
            <div className="text-2xl font-bold text-success">24</div>
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
            <div className="text-2xl font-bold">$1,248</div>
            <p className="text-xs text-muted-foreground">From prescriptions today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search prescriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prescription ID</TableHead>
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
              {mockPrescriptions.map((prescription) => (
                <TableRow key={prescription.id}>
                  <TableCell className="font-medium">{prescription.id}</TableCell>
                  <TableCell>{prescription.customerName}</TableCell>
                  <TableCell>{prescription.doctorName}</TableCell>
                  <TableCell>{prescription.issueDate}</TableCell>
                  <TableCell>{prescription.items} items</TableCell>
                  <TableCell>${prescription.total}</TableCell>
                  <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}