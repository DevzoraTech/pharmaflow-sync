import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import type { User } from '@supabase/supabase-js';
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} onLogout={onLogout} />
        <main className={`flex-1 overflow-auto p-4 md:p-6 ${isMobile ? 'pb-20' : ''}`}>
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}