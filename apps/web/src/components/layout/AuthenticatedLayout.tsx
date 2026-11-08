import { useState, useMemo } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../features/auth/AuthProvider';
import { getDashboard, type DashboardData } from '../../features/wedding/weddingApi';
import { DashboardSidebar } from '../../features/wedding/components/DashboardSidebar';
import { DashboardHeader } from '../../features/wedding/components/DashboardHeader';
import { ComingSoonModal } from '../../features/wedding/components/ComingSoonModal';
import { AuthenticatedLayoutContext } from './AuthenticatedLayoutContext';

export function AuthenticatedLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [comingSoonState, setComingSoonState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  const handleOpenComingSoon = (title: string, description: string) => {
    setComingSoonState({
      isOpen: true,
      title,
      description,
    });
  };

  const handleCloseComingSoon = () => {
    setComingSoonState((prev) => ({ ...prev, isOpen: false }));
  };

  const { data: dashboard } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 30_000,
  });

  const userInitials = useMemo(() => {
    const name = session?.user.displayName ?? session?.user.name ?? session?.user.email ?? 'W';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [session]);

  const userName =
    session?.user.displayName ?? session?.user.name ?? session?.user.email ?? 'Valued Member';
  const userEmail = session?.user.email ?? '';
  const userRole = session?.membership?.role ?? 'ORGANIZER';

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <AuthenticatedLayoutContext.Provider value={true}>
      <div className="min-h-screen w-full lg:grid lg:grid-cols-[270px_minmax(0,1fr)] bg-[#fafaf3] text-[#1a1c18] antialiased">
        {/* Desktop Sticky Sidebar / Mobile Drawer */}
        <DashboardSidebar
          eventsCount={dashboard?.summary.events}
          onOpenComingSoon={handleOpenComingSoon}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="min-w-0 flex flex-col flex-1 w-full bg-[#fafaf3]">
          {/* Pinned Top Header */}
          <DashboardHeader
            userName={userName}
            userEmail={userEmail}
            userInitials={userInitials}
            userRole={userRole}
            onSignOut={handleSignOut}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />

          {/* Page Content Viewport */}
          <main className="flex-1 w-full min-w-0">
            <Outlet />
          </main>
        </div>

        {/* Global Coming Soon Modal for sidebar actions */}
        <ComingSoonModal
          isOpen={comingSoonState.isOpen}
          onClose={handleCloseComingSoon}
          title={comingSoonState.title}
          description={comingSoonState.description}
        />
      </div>
    </AuthenticatedLayoutContext.Provider>
  );
}
