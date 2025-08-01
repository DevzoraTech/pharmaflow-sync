import { Button } from "@/components/ui/button";
import { Bell, Search, LogOut, User as UserIcon, Clock, AlertTriangle, CheckCircle, Menu, Package, Users, FileText, ShoppingCart, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { User } from '@supabase/supabase-js';
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { alertsAPI, medicinesAPI, customersAPI, prescriptionsAPI, salesAPI } from "@/lib/supabase-api";
import type { Alert, Medicine, Customer, PrescriptionWithDetails, SaleWithDetails } from "@/lib/supabase-api";
import { useToast } from "@/hooks/use-toast";
import { MobileMenu } from "./MobileMenu";

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

interface SearchResult {
  type: 'medicine' | 'customer' | 'prescription' | 'sale';
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  data: Medicine | Customer | PrescriptionWithDetails | SaleWithDetails;
}

export function Header({ user, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await alertsAPI.getAll({
        limit: 10,
        isRead: false
      });
      const alertsData = response.alerts || [];
      setAlerts(alertsData);
      setUnreadCount(alertsData.length);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search functionality
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const results: SearchResult[] = [];

      // Search medicines
      try {
        const medicinesResponse = await medicinesAPI.getAll({ search: query, limit: 5 });
        medicinesResponse.medicines.forEach((medicine) => {
          results.push({
            type: 'medicine',
            id: medicine.id,
            title: medicine.name,
            subtitle: `${medicine.generic_name || 'Generic'} • ${medicine.quantity} in stock`,
            icon: <Package className="h-4 w-4 text-primary" />,
            data: medicine
          });
        });
      } catch (error) {
        console.error('Error searching medicines:', error);
      }

      // Search customers
      try {
        const customersResponse = await customersAPI.getAll({ search: query, limit: 5 });
        customersResponse.customers.forEach((customer) => {
          results.push({
            type: 'customer',
            id: customer.id,
            title: customer.name,
            subtitle: `${customer.email || 'No email'} • ${customer.phone || 'No phone'}`,
            icon: <Users className="h-4 w-4 text-success" />,
            data: customer
          });
        });
      } catch (error) {
        console.error('Error searching customers:', error);
      }

      // Search prescriptions
      try {
        const prescriptionsResponse = await prescriptionsAPI.getAll({ search: query, limit: 5 });
        prescriptionsResponse.prescriptions.forEach((prescription) => {
          results.push({
            type: 'prescription',
            id: prescription.id,
            title: `Prescription #${prescription.prescription_number}`,
            subtitle: `${prescription.customer.name} • ${prescription.status}`,
            icon: <FileText className="h-4 w-4 text-warning" />,
            data: prescription
          });
        });
      } catch (error) {
        console.error('Error searching prescriptions:', error);
      }

      // Search sales
      try {
        const salesResponse = await salesAPI.getAll({ search: query, limit: 5 });
        salesResponse.sales.forEach((sale) => {
          results.push({
            type: 'sale',
            id: sale.id,
            title: `Sale #${sale.id.slice(0, 8)}`,
            subtitle: `${sale.customer?.name || 'Walk-in'} • ${sale.payment_method} • UGX ${sale.total}`,
            icon: <ShoppingCart className="h-4 w-4 text-success" />,
            data: sale
          });
        });
      } catch (error) {
        console.error('Error searching sales:', error);
      }

      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle search result selection
  const handleSearchResultClick = (result: SearchResult) => {
    setSearchQuery("");
    setShowSearchResults(false);
    
    switch (result.type) {
      case 'medicine':
        navigate('/medicines');
        break;
      case 'customer':
        navigate('/customers');
        break;
      case 'prescription':
        navigate('/prescriptions');
        break;
      case 'sale':
        navigate('/sales');
        break;
    }
  };

  // Handle search input focus/blur
  const handleSearchFocus = () => {
    if (searchResults.length > 0) {
      setShowSearchResults(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => setShowSearchResults(false), 200);
  };

  // Handle keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery("");
      setShowSearchResults(false);
      searchInputRef.current?.blur();
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await alertsAPI.markAsRead(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast({
        title: "Alert marked as read",
        description: "The alert has been dismissed.",
      });
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark alert as read.",
        variant: "destructive",
      });
    }
  };

  const handleViewAllAlerts = () => {
    navigate('/alerts');
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'MEDIUM':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'LOW':
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'text-destructive';
      case 'MEDIUM':
        return 'text-warning';
      case 'LOW':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-gradient-card px-4 md:px-6 shadow-soft backdrop-blur-sm">
      {/* Mobile: Show menu button and title */}
      <div className="flex items-center gap-4 flex-1 md:hidden">
        <MobileMenu />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">D</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">PharmaFlow Sync</span>
            <span className="text-xs text-muted-foreground">by Devzora Technologies</span>
          </div>
        </div>
      </div>

      {/* Desktop: Show branding and search bar */}
      <div className="hidden md:flex items-center gap-6 flex-1">
        {/* Desktop Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-foreground">PharmaFlow Sync</span>
            <span className="text-xs text-muted-foreground">by Devzora Technologies</span>
          </div>
        </div>
        
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search medicines, customers, prescriptions..."
            className="pl-10 bg-background/50 backdrop-blur-sm border-0 shadow-soft"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            onKeyDown={handleSearchKeyDown}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Searching...
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <ScrollArea className="max-h-96">
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-primary/5 cursor-pointer border-b border-border last:border-b-0"
                      onClick={() => handleSearchResultClick(result)}
                    >
                      <div className="flex-shrink-0">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {result.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              ) : searchQuery.trim() ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No results found for "{searchQuery}"
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Show search toggle and notifications */}
      <div className="flex items-center gap-2 md:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsSearchVisible(!isSearchVisible)}
          className="hover:bg-primary/10"
        >
          <Search className="h-5 w-5" />
        </Button>
        
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground shadow-glow animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card/95 backdrop-blur-sm border shadow-elegant">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAllAlerts}
                className="text-xs hover:bg-primary/10"
              >
                View All
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading alerts...
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              <ScrollArea className="h-80">
                {alerts.map((alert) => (
                  <DropdownMenuItem
                    key={alert.id}
                    className="flex items-start gap-3 p-3 hover:bg-primary/5 cursor-pointer"
                    onClick={() => handleMarkAsRead(alert.id)}
                  >
                    <div className="mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-tight">
                          {alert.title}
                        </p>
                        <span className={`text-xs ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <UserIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-sm border shadow-elegant">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.user_metadata?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.user_metadata?.role?.toLowerCase() || 'pharmacist'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <UserIcon className="mr-2 h-4 w-4" />
              Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Desktop: Show notifications and user dropdown */}
      <div className="hidden md:flex items-center gap-4">
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground shadow-glow animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card/95 backdrop-blur-sm border shadow-elegant">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAllAlerts}
                className="text-xs hover:bg-primary/10"
              >
                View All
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading alerts...
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No new notifications
              </div>
            ) : (
              <ScrollArea className="h-80">
                {alerts.map((alert) => (
                  <DropdownMenuItem
                    key={alert.id}
                    className="flex items-start gap-3 p-3 hover:bg-primary/5 cursor-pointer"
                    onClick={() => handleMarkAsRead(alert.id)}
                  >
                    <div className="mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-tight">
                          {alert.title}
                        </p>
                        <span className={`text-xs ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <UserIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card/95 backdrop-blur-sm border shadow-elegant">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium">{user?.user_metadata?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.user_metadata?.role?.toLowerCase() || 'pharmacist'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <UserIcon className="mr-2 h-4 w-4" />
              Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Search Bar - Collapsible */}
      {isSearchVisible && (
        <div className="absolute top-16 left-0 right-0 z-40 bg-card border-b border-border p-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search medicines, customers, prescriptions..."
              className="pl-10 bg-background/50 backdrop-blur-sm"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onKeyDown={handleSearchKeyDown}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            {/* Mobile Search Results */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-hidden">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Searching...
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <ScrollArea className="max-h-64">
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        className="flex items-center gap-3 p-3 hover:bg-primary/5 cursor-pointer border-b border-border last:border-b-0"
                        onClick={() => handleSearchResultClick(result)}
                      >
                        <div className="flex-shrink-0">
                          {result.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {result.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                ) : searchQuery.trim() ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No results found for "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}