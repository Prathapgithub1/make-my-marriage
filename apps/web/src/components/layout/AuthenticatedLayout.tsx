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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('mmm_sidebar_collapsed') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('mmm_sidebar_collapsed', String(next));
        } catch {}
      }
      return next;
    });
  };

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

  const tasksDueCount = useMemo(() => {
    if (!dashboard?.summary.tasks) return 0;
    if (typeof dashboard.summary.tasks.due === 'number') {
      return dashboard.summary.tasks.due;
    }
    return Math.max(0, dashboard.summary.tasks.total - dashboard.summary.tasks.completed);
  }, [dashboard]);

  const formattedWeddingDate = useMemo(() => {
    if (!dashboard?.wedding?.weddingDate) return null;
    try {
      const d = new Date(dashboard.wedding.weddingDate);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return null;
    }
  }, [dashboard?.wedding?.weddingDate]);

  const weddingLocation = useMemo(() => {
    if (!dashboard?.wedding) return null;
    return dashboard.wedding.location || dashboard.wedding.city || null;
  }, [dashboard?.wedding]);

  const daysRemaining = dashboard?.countdown?.daysRemaining ?? null;

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <AuthenticatedLayoutContext.Provider value={true}>
      <div className="min-h-screen w-full flex bg-[#fafaf3] text-[#1a1c18] antialiased">
        {/* Desktop Sticky Sidebar / Mobile Drawer */}
        <DashboardSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          eventsCount={dashboard?.summary.events}
          tasksDueCount={tasksDueCount}
          guestsCount={dashboard?.summary.guests}
          vendorsCount={dashboard?.summary.vendors}
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
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={handleToggleCollapse}
            weddingTitle={dashboard?.wedding?.title}
            weddingDate={formattedWeddingDate}
            weddingLocation={weddingLocation}
            daysRemaining={daysRemaining}
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
