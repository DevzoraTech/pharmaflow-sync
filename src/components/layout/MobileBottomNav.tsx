import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Pill, 
  FileText, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Package,
  UserCheck,
  AlertTriangle
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Medicines", href: "/medicines", icon: Pill },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Staff", href: "/staff", icon: UserCheck },
  { name: "Alerts", href: "/alerts", icon: AlertTriangle },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg md:hidden mobile-safe-area">
      <nav className="flex items-center justify-around px-2 py-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 px-2 py-2 text-xs font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 mb-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span className="text-xs truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 