import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  Bell, 
  Calendar, 
  Package, 
  Search,
  Filter,
  Check,
  X,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert as AlertComponent, AlertDescription } from "@/components/ui/alert";
import { alertsAPI, type Alert } from "@/lib/api";

// TypeScript interfaces

interface AlertStats {
  total: number;
  unread: number;
  byType: {
    STOCK: number;
    EXPIRY: number;
    SYSTEM: number;
  };
  bySeverity: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStats>({
    total: 0,
    unread: 0,
    byType: { STOCK: 0, EXPIRY: 0, SYSTEM: 0 },
    bySeverity: { HIGH: 0, MEDIUM: 0, LOW: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Fetch alerts from API
  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const [alertsResponse, statsResponse] = await Promise.all([
        alertsAPI.getAll({
          type: typeFilter && typeFilter !== "all" ? typeFilter : undefined,
          severity: severityFilter && severityFilter !== "all" ? severityFilter : undefined,
          isRead: showUnreadOnly ? false : undefined
        }),
        alertsAPI.getStats()
      ]);
      
      setAlerts(alertsResponse.alerts || []);
      setStats(statsResponse || {
        total: 0,
        unread: 0,
        byType: { STOCK: 0, EXPIRY: 0, SYSTEM: 0 },
        bySeverity: { HIGH: 0, MEDIUM: 0, LOW: 0 }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch alerts';
      setError(errorMessage);
      console.error('Error fetching alerts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, severityFilter, showUnreadOnly]);

  // Load alerts on component mount and when filters change
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Mark alert as read
  const markAsRead = async (alertId: string) => {
    try {
      await alertsAPI.markAsRead(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
      // Update stats
      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  // Mark all alerts as read
  const markAllAsRead = async () => {
    try {
      await alertsAPI.markAllAsRead({
        type: typeFilter && typeFilter !== "all" ? typeFilter : undefined,
        severity: severityFilter && severityFilter !== "all" ? severityFilter : undefined
      });
      setAlerts(alerts.map(alert => ({ ...alert, isRead: true })));
      setAlerts(alerts.map(alert => ({ ...alert, is_read: true })));
      setStats(prev => ({ ...prev, unread: 0 }));
    } catch (err) {
      console.error('Error marking all alerts as read:', err);
    }
  };

  // Delete alert
  const deleteAlert = async (alertId: string) => {
    try {
      await alertsAPI.delete(alertId);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  // Check for new stock alerts
  const checkStockAlerts = async () => {
    try {
      await alertsAPI.checkStock();
      await fetchAlerts(); // Refresh alerts
    } catch (err) {
      console.error('Error checking stock alerts:', err);
    }
  };

  // Check for expiry alerts
  const checkExpiryAlerts = async () => {
    try {
      await alertsAPI.checkExpiry();
      await fetchAlerts(); // Refresh alerts
    } catch (err) {
      console.error('Error checking expiry alerts:', err);
    }
  };

  // Filter alerts based on search term
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchTerm === "" || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return <Badge variant="destructive">High</Badge>;
      case "MEDIUM":
        return <Badge variant="warning">Medium</Badge>;
      case "LOW":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "STOCK":
        return <Package className="h-4 w-4" />;
      case "EXPIRY":
        return <Calendar className="h-4 w-4" />;
      case "SYSTEM":
        return <Bell className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Alerts & Notifications</h1>
        <p className="text-muted-foreground">Monitor important pharmacy alerts and notifications</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={fetchAlerts} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button variant="outline" onClick={markAllAsRead} disabled={stats.unread === 0}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark All Read
        </Button>
        <Button variant="outline" onClick={checkStockAlerts}>
          <Package className="h-4 w-4 mr-2" />
          Check Stock
        </Button>
        <Button variant="outline" onClick={checkExpiryAlerts}>
          <Calendar className="h-4 w-4 mr-2" />
          Check Expiry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Unread Alerts
            </CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-destructive mb-2">{stats.unread}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Stock Alerts
            </CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-warning mb-2">{stats.byType.STOCK}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Low/out of stock</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Expiry Alerts
            </CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-destructive mb-2">{stats.byType.EXPIRY}</div>
            <p className="text-xs md:text-sm text-muted-foreground">Expiring soon</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              System Alerts
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-3xl font-bold text-foreground mb-2">{stats.byType.SYSTEM}</div>
            <p className="text-xs md:text-sm text-muted-foreground">System notifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="STOCK">Stock Alerts</SelectItem>
                <SelectItem value="EXPIRY">Expiry Alerts</SelectItem>
                <SelectItem value="SYSTEM">System Alerts</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showUnreadOnly ? "default" : "outline"}
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Unread Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <AlertComponent variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </AlertComponent>
      )}

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Alerts</span>
            <span className="text-sm font-normal text-muted-foreground">
              {filteredAlerts.length} of {alerts.length} alerts
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading alerts...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {alerts.length === 0 ? (
                <>
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No alerts found</p>
                  <p className="text-sm">Your pharmacy is running smoothly!</p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No alerts match your search criteria</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                    alert.is_read ? 'bg-background' : 'bg-muted/30'
                  }`}
                >
                  <div className="mt-1">
                    {getIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium ${!alert.is_read ? 'font-semibold' : ''}`}>
                        {alert.title}
                      </h4>
                      {getSeverityBadge(alert.severity)}
                      {!alert.is_read && (
                        <Badge variant="outline" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(alert.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!alert.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(alert.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAlert(alert.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}