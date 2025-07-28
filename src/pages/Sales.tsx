import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";

export default function Sales() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales Management</h1>
          <p className="text-muted-foreground">Track and manage pharmacy sales</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Sale
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Sales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">$2,845</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">Sales completed today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Sale
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$31.96</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Sales tracking and POS system will be implemented with backend integration.</p>
        </CardContent>
      </Card>
    </div>
  );
}