import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Pill, 
  DollarSign, 
  Users, 
  AlertTriangle,
  RefreshCw,
  Loader2
} from "lucide-react";
import { dashboardAPI } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalMedicines: number;
  lowStockItems: number;
  totalCustomers: number;
  expiringSoon: number;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'prescription' | 'medicine';
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const [statsData, transactionsData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentTransactions(5)
      ]);
      
      setStats(statsData);
      // Convert transactions to activity format
      const activities = transactionsData.map((transaction: any) => ({
        id: transaction.id,
        type: 'sale' as const,
        title: `Sale #${transaction.id.substring(0, 8)}`,
        description: transaction.customer?.name || 'Unknown Customer',
        amount: transaction.total,
        timestamp: transaction.sale_date
      }));
      setRecentActivity(activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-primary text-primary-foreground p-4 md:p-8 rounded-2xl shadow-glow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-primary-foreground/80 text-sm md:text-lg">Welcome back! Here's what's happening at Green Leaf Pharmacy.</p>
          </div>
          <Button variant="outline" onClick={fetchDashboardData} disabled={isLoading} 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 w-full md:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Sales Today</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-foreground mb-2">UGX {stats?.totalRevenue?.toLocaleString() || '0'}</div>
            <p className="text-xs md:text-sm text-muted-foreground">{stats?.totalSales || 0} transactions today</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Medicines in Stock</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Pill className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-foreground mb-2">{stats?.totalMedicines || 0}</div>
            <p className="text-xs md:text-sm text-muted-foreground">{stats?.lowStockItems || 0} low stock items</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-foreground mb-2">{stats?.totalCustomers || 0}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-foreground mb-2">{stats?.expiringSoon || 0}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Sales and transactions will appear here</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm md:text-base">{activity.title}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {activity.amount && (
                      <p className="font-medium text-sm md:text-base">UGX {activity.amount.toLocaleString()}</p>
                    )}
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}