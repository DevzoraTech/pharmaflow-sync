import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Pill, 
  FileText, 
  Users, 
  ShoppingCart, 
  MoreHorizontal
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
  Package,
  UserCheck,
  AlertTriangle,
  BarChart3,
  Settings
} from "lucide-react";

const primaryNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Medicines", href: "/medicines", icon: Pill },
  { name: "Prescriptions", href: "/prescriptions", icon: FileText },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Customers", href: "/customers", icon: Users },
];

const secondaryNavigation = [
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Staff", href: "/staff", icon: UserCheck },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Alerts", href: "/alerts", icon: AlertTriangle },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {primaryNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">{item.name}</span>
            </Link>
          );
        })}
        
        {/* More Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center p-2 rounded-lg min-w-0 flex-1 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <MoreHorizontal className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">More</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {secondaryNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-lg border transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted border-border"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}