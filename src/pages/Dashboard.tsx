import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Pill, 
  DollarSign, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Package,
  FileText,
  Calendar
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening at your pharmacy.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Sales Today"
          value="UGX 2,845,000"
          change="+12% from yesterday"
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard
          title="Medicines in Stock"
          value="1,247"
          change="5 low stock items"
          changeType="negative"
          icon={Pill}
        />
        <StatsCard
          title="Customers Served"
          value="89"
          change="+3% from yesterday"
          changeType="positive"
          icon={Users}
        />
        <StatsCard
          title="Expiring Soon"
          value="12"
          change="Next 30 days"
          changeType="negative"
          icon={AlertTriangle}
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Sales chart will be implemented with backend data
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Quick Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg">
              <Package className="h-4 w-4 text-warning" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Low Stock Alert</p>
                <p className="text-xs text-muted-foreground">Paracetamol - 5 units left</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
              <Calendar className="h-4 w-4 text-destructive" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Expiring Soon</p>
                <p className="text-xs text-muted-foreground">Amoxicillin expires in 7 days</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
              <FileText className="h-4 w-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Pending Prescriptions</p>
                <p className="text-xs text-muted-foreground">3 prescriptions awaiting filling</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Sale #001234</p>
                  <p className="text-sm text-muted-foreground">John Doe - Prescription fill</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">UGX 45,500</p>
                <p className="text-sm text-muted-foreground">2 min ago</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Sale #001233</p>
                  <p className="text-sm text-muted-foreground">Sarah Smith - OTC purchase</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">UGX 12,990</p>
                <p className="text-sm text-muted-foreground">15 min ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}