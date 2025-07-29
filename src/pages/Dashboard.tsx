import { useState, useEffect } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Pill, 
  DollarSign, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Package,
  FileText,
  Calendar,
  RefreshCw,
  Loader2
} from "lucide-react";
import { dashboardAPI } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [salesChart, setSalesChart] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const [statsData, transactionsData, chartData] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentTransactions(5),
        dashboardAPI.getSalesChart(7)
      ]);
      
      setStats(statsData);
      setRecentTransactions(transactionsData);
      setSalesChart(chartData);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening at your pharmacy.</p>
        </div>
        <Button variant="outline" onClick={fetchDashboardData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Sales Today"
          value={`UGX ${stats?.totalRevenue?.toLocaleString() || '0'}`}
          change={`${stats?.totalSales || 0} transactions today`}
          changeType="positive"
          icon={DollarSign}
        />
        <StatsCard
          title="Medicines in Stock"
          value={stats?.totalMedicines?.toString() || '0'}
          change={`${stats?.lowStockItems || 0} low stock items`}
          changeType={stats?.lowStockItems > 0 ? "negative" : "neutral"}
          icon={Pill}
        />
        <StatsCard
          title="Total Customers"
          value={stats?.totalCustomers?.toString() || '0'}
          change="Registered customers"
          changeType="positive"
          icon={Users}
        />
        <StatsCard
          title="Expiring Soon"
          value={stats?.expiringSoon?.toString() || '0'}
          change="Next 30 days"
          changeType={stats?.expiringSoon > 0 ? "negative" : "neutral"}
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
            <div className="h-64">
              {salesChart.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2 text-center">
                    {salesChart.map((day, index) => (
                      <div key={index} className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="bg-primary/20 rounded-lg p-2">
                          <div className="text-sm font-medium">UGX {day.sales.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{day.transactions} sales</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No sales data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Quick Alerts
            {recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Sale #{transaction.id.substring(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.customer?.name || 'Walk-in'} - 
                          {transaction.prescription ? ' Prescription fill' : ' Direct sale'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">UGX {Number(transaction.total).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.sale_date).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent transactions</p>
                <p className="text-sm">Sales will appear here</p>
              </div>
            )}
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Unread Alerts</p>
                  <p className="text-xs text-muted-foreground">{stats.unreadAlerts} alerts need attention</p>
                </div>
              </div>
            )}
            {(!stats?.lowStockItems && !stats?.expiringSoon && !stats?.pendingPrescriptions && !stats?.unreadAlerts) && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No alerts at this time</p>
                <p className="text-sm">Your pharmacy is running smoothly!</p>
              </div>
            )}
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