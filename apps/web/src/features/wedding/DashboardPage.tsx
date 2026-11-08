import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import weddingHeroImage from '../../assets/images/wedding-hero.jpg';
import {
  getDashboard,
  updateWedding,
  type DashboardData,
  type UpdateWeddingInput,
} from './weddingApi';

import { DashboardSidebar } from './components/DashboardSidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { WeddingOverview } from './components/WeddingOverview';
import { QuickActions } from './components/QuickActions';
import { SummaryCards } from './components/SummaryCard';
import { UpcomingEventsCard } from './components/UpcomingEventsCard';
import { TaskFocusList } from './components/TaskFocusList';
import { RecentActivityCard } from './components/RecentActivityCard';
import { PlanningProgressCard } from './components/PlanningProgressCard';
import { ComingSoonModal } from './components/ComingSoonModal';
import { EditWeddingDetailsModal } from './components/EditWeddingDetailsModal';
import { useIsInsideAuthenticatedLayout } from '../../components/layout/AuthenticatedLayoutContext';

export function DashboardPage() {
  const isInsideLayout = useIsInsideAuthenticatedLayout();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Coming Soon modal state
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

  const heroImageSrc =
    (typeof weddingHeroImage === 'string' || typeof weddingHeroImage === 'object') &&
    weddingHeroImage
      ? String((weddingHeroImage as unknown as { default?: string })?.default || weddingHeroImage)
      : '';

  const {
    data: dashboard,
    isLoading,
    error,
    refetch,
  } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateWeddingInput) => updateWedding(input),
    onSuccess: (updated) => {
      queryClient.setQueryData<DashboardData>(['dashboard'], (old) => {
        if (!old) return old;
        return {
          ...old,
          wedding: {
            ...old.wedding,
            title: updated.title,
            brideName: updated.brideName,
            groomName: updated.groomName,
            weddingDate: updated.weddingDate,
            location: updated.location,
            city: updated.city,
            state: updated.state,
            country: updated.country,
            description: updated.description,
          },
          countdown: {
            weddingDate: updated.weddingDate,
            daysRemaining: calculateDaysRemaining(updated.weddingDate),
          },
        };
      });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setIsEditModalOpen(false);
    },
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafaf3] flex flex-col items-center justify-center p-6 text-center text-[#1a1c18]">
        <div className="w-12 h-12 rounded-xl bg-[#8a4b35]/10 border border-[#8a4b35]/20 flex items-center justify-center text-[#8a4b35] font-serif font-bold text-xl mb-4 animate-pulse">
          M
        </div>
        <p className="font-serif text-2xl font-medium text-[#1a1c18]">
          Opening your wedding workspace...
        </p>
        <p className="text-sm text-[#53433e] mt-2">
          Retrieving your celebration timeline and guest registry
        </p>
      </div>
    );
  }

  if (error || !dashboard || !dashboard.wedding) {
    return (
      <div className="min-h-screen bg-[#fafaf3] flex flex-col items-center justify-center p-6 text-center text-[#1a1c18]">
        <div className="max-w-md bg-white rounded-2xl border border-[#d8c2bb]/50 p-8 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-[#8a4b35]">
            Workspace Unavailable
          </h2>
          <p className="text-sm text-[#53433e] mt-3 leading-relaxed">
            We were unable to load your wedding workspace details. Please verify your connection or
            refresh the page.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 rounded-lg bg-[#8a4b35] text-white text-sm font-semibold hover:bg-[#a8624b] transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/wedding/setup')}
              className="px-5 py-2.5 rounded-lg border border-[#d8c2bb] text-[#1a1c18] text-sm font-medium hover:bg-[#fafaf3] transition-colors"
            >
              Go to Wedding Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { wedding } = dashboard;
  const countdown = dashboard.countdown ?? {
    weddingDate: wedding.weddingDate ?? null,
    daysRemaining: calculateDaysRemaining(wedding.weddingDate ?? null),
  };

  const dashboardContent = (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 py-3.5 sm:py-4 md:py-5 min-w-0">
      {/* Section A: Wedding Overview / Hero Section */}
      <WeddingOverview
        title={wedding.title}
        description={wedding.description}
        weddingDate={wedding.weddingDate}
        location={wedding.location}
        daysRemaining={countdown.daysRemaining}
        onEdit={() => setIsEditModalOpen(true)}
      />

      {/* Section B: Quick Actions Bar */}
      <QuickActions
        onCreateEvent={() => navigate('/events')}
        onOpenComingSoon={handleOpenComingSoon}
      />

      {/* Section C: Dashboard Summary Cards (4 Cards) */}
      <SummaryCards
        eventsCount={dashboard.summary.events}
        tasksSummary={dashboard.summary.tasks}
        guestsCount={dashboard.summary.guests}
        rsvpsSummary={dashboard.summary.rsvps}
        totalExpenseAmount={dashboard.summary.totalExpenseAmount}
        weddingDate={wedding.weddingDate}
        onOpenComingSoon={handleOpenComingSoon}
      />

      {/* Section D: Two-Column Bento Layout (Screenshot 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start mb-6">
        {/* Column 1 (~58% width): Upcoming Events */}
        <div className="lg:col-span-7">
          <UpcomingEventsCard events={dashboard.upcomingEvents} />
        </div>

        {/* Column 2 (~42% width): Tasks to Focus On */}
        <div className="lg:col-span-5">
          <TaskFocusList
            tasksSummary={dashboard.summary.tasks}
            onOpenComingSoon={handleOpenComingSoon}
          />
        </div>
      </div>

      {/* Section E: Supplementary Planning Milestones & Concierge Sanctuary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start mb-8">
        {/* Left Column: Progress Milestones & Activity Feed */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Wedding Planning Progress Milestone Bar */}
          <PlanningProgressCard eventsCount={dashboard.summary.events} />

          {/* Recent Activity Feed */}
          <RecentActivityCard />
        </div>

        {/* Right Column: Editorial Concierge & Next Steps Checklist */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Editorial Concierge / Bespoke Destination Card */}
          <div className="bg-white rounded-2xl border border-[#d8c2bb]/40 overflow-hidden shadow-[0_1px_3px_rgba(37,39,35,0.03)] flex flex-col">
            <div className="relative h-48 w-full overflow-hidden bg-[#2e1d18]">
              {!imageLoadFailed && heroImageSrc ? (
                <img
                  src={heroImageSrc}
                  alt="Editorial wedding couple in Udaipur"
                  onError={() => setImageLoadFailed(true)}
                  className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              ) : (
                <div
                  data-testid="destination-image-fallback"
                  className="w-full h-full bg-gradient-to-br from-[#851321] via-[#5c2420] to-[#251513] flex items-center justify-center relative"
                >
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f4ba9c_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="text-center z-10 px-4">
                    <span className="text-2xl text-[#f4ba9c]">✦</span>
                    <p className="font-serif italic text-sm text-white/90 mt-1">
                      Bespoke Destination Sanctuary
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c18]/80 via-[#1a1c18]/25 to-transparent pointer-events-none" />
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#1a1c18] text-[11px] font-semibold tracking-wide shadow-xs">
                Concierge Service
              </span>
              <div className="absolute bottom-3 left-4 right-4 text-white pointer-events-none">
                <span className="text-[10px] uppercase tracking-widest text-[#f4ba9c] font-semibold">
                  Bespoke Destination
                </span>
                <p className="text-sm font-serif font-medium text-white/95">
                  {wedding.location?.trim() || 'The Oberoi Udaivilas, Udaipur'}
                </p>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between bg-white border-t border-[#e3e3dc]/40">
              <p className="text-xs text-[#53433e]">
                Curated for discerning couples • Concierge support ready
              </p>
              <button
                type="button"
                onClick={() =>
                  handleOpenComingSoon(
                    'Concierge Service',
                    'Direct consultation with bespoke destination coordinators and luxury planners.',
                  )
                }
                className="text-xs text-[#8a4b35] font-semibold hover:underline inline-flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
              >
                <span>Speak to Planner</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Your Next Steps Getting-Started Checklist */}
          <div className="bg-white rounded-2xl border border-[#d8c2bb]/40 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg text-[#1a1c18] font-medium">Your next steps</h3>
                <p className="text-xs text-[#53433e]">
                  Recommended priorities tailored to your planning phase
                </p>
              </div>
              <span className="text-xs font-semibold text-[#8a4b35]">
                {dashboard.summary.events > 0 ? '25%' : '0%'}
              </span>
            </div>

            <div className="space-y-2.5">
              <Link
                to="/events"
                className="group flex items-center justify-between p-3 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/50 hover:bg-[#f4f4ed]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 rounded border border-[#d8c2bb] group-hover:border-[#8a4b35] flex items-center justify-center bg-white transition-colors shrink-0">
                    {dashboard.summary.events > 0 ? (
                      <span className="text-xs text-[#556251] font-bold">✓</span>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors truncate">
                      1. Add wedding events
                    </h4>
                    <p className="text-[11px] text-[#53433e] truncate">
                      Ceremonies, timeline & venues
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#86736d] group-hover:text-[#8a4b35] group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </Link>

              <div
                onClick={() =>
                  handleOpenComingSoon(
                    'Create a Task',
                    'Tasks and checklist priorities are in development.',
                  )
                }
                className="group flex items-center justify-between p-3 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/50 hover:bg-[#f4f4ed]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 rounded border border-[#d8c2bb] group-hover:border-[#8a4b35] flex items-center justify-center bg-white transition-colors shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors truncate">
                      2. Create your first planning task
                    </h4>
                    <p className="text-[11px] text-[#53433e] truncate">
                      Attire, catering, stationery
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#86736d] group-hover:text-[#8a4b35] group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </div>

              <div
                onClick={() =>
                  handleOpenComingSoon('Manage Guests', 'Guest list and RSVPs are launching soon.')
                }
                className="group flex items-center justify-between p-3 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/50 hover:bg-[#f4f4ed]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 rounded border border-[#d8c2bb] group-hover:border-[#8a4b35] flex items-center justify-center bg-white transition-colors shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors truncate">
                      3. Start building the guest list
                    </h4>
                    <p className="text-[11px] text-[#53433e] truncate">Digital invites & RSVPs</p>
                  </div>
                </div>
                <span className="text-xs text-[#86736d] group-hover:text-[#8a4b35] group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </div>

              <div
                onClick={() =>
                  handleOpenComingSoon(
                    'Track Expenses',
                    'Budget tracking and vendor deposits are launching soon.',
                  )
                }
                className="group flex items-center justify-between p-3 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/50 hover:bg-[#f4f4ed]/40 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 rounded border border-[#d8c2bb] group-hover:border-[#8a4b35] flex items-center justify-center bg-white transition-colors shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors truncate">
                      4. Set an initial budget
                    </h4>
                    <p className="text-[11px] text-[#53433e] truncate">
                      Track vendor advances and expenses
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#86736d] group-hover:text-[#8a4b35] group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="w-full bg-[#fafaf3] border-t border-[#e3e3dc] py-6 mt-8">
        <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#53433e]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-[#8a4b35] text-sm">
              Make My Marriage
            </span>
            <span>•</span>
            <span>
              © 2026 Make My Marriage. Warm editorial minimalism for elevated celebrations.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-[#8a4b35] transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-[#8a4b35] transition-colors">
              Terms of Service
            </a>
            <a href="#support" className="hover:text-[#8a4b35] transition-colors">
              Concierge Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );

  if (isInsideLayout) {
    return (
      <>
        {dashboardContent}

        {/* 3. EDIT WEDDING DETAILS MODAL */}
        {isEditModalOpen && (
          <EditWeddingDetailsModal
            initialData={wedding}
            isSubmitting={updateMutation.isPending}
            error={updateMutation.error instanceof Error ? updateMutation.error.message : ''}
            onClose={() => setIsEditModalOpen(false)}
            onSave={(values) => updateMutation.mutate(values)}
          />
        )}

        {/* 4. COMING SOON MODAL */}
        <ComingSoonModal
          isOpen={comingSoonState.isOpen}
          onClose={() => setComingSoonState((prev) => ({ ...prev, isOpen: false }))}
          title={comingSoonState.title}
          description={comingSoonState.description}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#fafaf3] text-[#1a1c18] antialiased">
      {/* 1. SIDEBAR NAVIGATION */}
      <DashboardSidebar
        eventsCount={dashboard.summary.events}
        onOpenComingSoon={handleOpenComingSoon}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. MAIN WORKSPACE CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimal Role-Aware Top Header */}
        <DashboardHeader
          userName={userName}
          userEmail={userEmail}
          userInitials={userInitials}
          userRole={userRole}
          onSignOut={handleSignOut}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dashboard Body Canvas */}
        <main className="flex-1 w-full min-w-0">{dashboardContent}</main>
      </div>

      {/* 3. EDIT WEDDING DETAILS MODAL */}
      {isEditModalOpen && (
        <EditWeddingDetailsModal
          initialData={wedding}
          isSubmitting={updateMutation.isPending}
          error={updateMutation.error instanceof Error ? updateMutation.error.message : ''}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(values) => updateMutation.mutate(values)}
        />
      )}

      {/* 4. COMING SOON MODAL */}
      <ComingSoonModal
        isOpen={comingSoonState.isOpen}
        onClose={() => setComingSoonState((prev) => ({ ...prev, isOpen: false }))}
        title={comingSoonState.title}
        description={comingSoonState.description}
      />
    </div>
  );
}

export function calculateDaysRemaining(
  weddingDate: string | null | undefined,
  timeZone = 'Asia/Kolkata',
): number | null {
  if (!weddingDate) return null;
  const target = new Date(weddingDate);
  if (isNaN(target.getTime())) return null;

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const [currentYear, currentMonth, currentDay] = formatter.format(now).split('-').map(Number);
  const todayUtc = Date.UTC(currentYear, currentMonth - 1, currentDay);

  let targetYear: number;
  let targetMonth: number;
  let targetDay: number;

  if (/^\d{4}-\d{2}-\d{2}/.test(weddingDate)) {
    const [y, m, d] = weddingDate.slice(0, 10).split('-').map(Number);
    targetYear = y;
    targetMonth = m;
    targetDay = d;
  } else {
    const targetParts = formatter.format(target).split('-').map(Number);
    targetYear = targetParts[0];
    targetMonth = targetParts[1];
    targetDay = targetParts[2];
  }

  const targetUtc = Date.UTC(targetYear, targetMonth - 1, targetDay);
  return Math.ceil((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
}
