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
    <div className="flex h-full w-64 flex-col bg-gradient-card border-r border-border shadow-soft">
      <div className="flex h-16 items-center px-6 border-b border-border bg-gradient-primary">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">Green Leaf</span>
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
                "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105",
                isActive
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
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