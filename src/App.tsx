import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { LoginForm } from "@/components/auth/LoginForm";
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import Dashboard from "./pages/Dashboard";
import Medicines from "./pages/Medicines";
import Prescriptions from "./pages/Prescriptions";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Inventory from "./pages/Inventory";
import Staff from "./pages/Staff";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold">P</span>
          </div>
          <p className="text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/medicines" element={<Medicines />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/prescriptions" element={<Prescriptions />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
