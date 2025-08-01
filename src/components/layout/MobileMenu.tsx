import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  BarChart3, 
  Settings,
  Package,
  X
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const additionalNavigation = [
  { name: "Prescriptions", href: "/prescriptions", icon: FileText },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileMenu() {
  const location = useLocation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Package className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">More Options</SheetTitle>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </div>
        </SheetHeader>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {additionalNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300",
                  isActive
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}
                onClick={() => {
                  // Close the sheet when a link is clicked
                  const sheetTrigger = document.querySelector('[data-radix-sheet-trigger]') as HTMLElement;
                  if (sheetTrigger) {
                    sheetTrigger.click();
                  }
                }}
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
      </SheetContent>
    </Sheet>
  );
} 