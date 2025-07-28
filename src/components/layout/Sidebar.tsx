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
  { name: "Prescriptions", href: "/prescriptions", icon: FileText },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Staff", href: "/staff", icon: UserCheck },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Alerts", href: "/alerts", icon: AlertTriangle },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Pill className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">PharmaCare</span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}