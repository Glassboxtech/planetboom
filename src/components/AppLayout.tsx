import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  requireSuperAdmin?: boolean;
}

export function AppLayout({ children, title, subtitle, headerActions, requireSuperAdmin = false }: AppLayoutProps) {
  const { user, isLoading, isAdmin, isSuperAdmin, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this app.</p>
          <Button variant="outline" onClick={signOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 bg-card/90 backdrop-blur-lg border-b border-border h-14 flex items-center px-4 gap-3">
            <SidebarTrigger />
            {title && (
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
                {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
              </div>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              {headerActions}
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
