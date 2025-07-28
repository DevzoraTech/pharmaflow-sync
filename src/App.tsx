import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Medicines from "./pages/Medicines";
import Prescriptions from "./pages/Prescriptions";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import Staff from "./pages/Staff";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
