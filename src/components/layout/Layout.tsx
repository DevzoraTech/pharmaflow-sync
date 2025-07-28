import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { UserData } from "@/types/auth";

interface LayoutProps {
  children: React.ReactNode;
  user: UserData;
  onLogout: () => void;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} onLogout={onLogout} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}