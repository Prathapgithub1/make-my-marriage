import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import { BrandLockup } from '../../components/BrandMark';
import {
  getDashboard,
  updateWedding,
  type DashboardData,
  type UpdateWeddingInput,
} from './weddingApi';

export function DashboardPage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const formattedDate = wedding.weddingDate
    ? new Date(wedding.weddingDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Date not set yet';

  const shortDate = wedding.weddingDate
    ? new Date(wedding.weddingDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not set';

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf3] text-[#1a1c18] antialiased">
      {/* 1. SHARED TOPBAR */}
      <header className="bg-white border-b border-[#e3e3dc]/70 sticky top-0 z-50 shadow-xs">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 md:px-10 max-w-[1360px] mx-auto h-16">
          {/* Brand Logo & Product Anchor */}
          <div className="flex items-center gap-4">
            <BrandLockup />

            {/* Navigation Cluster (Desktop) */}
            <nav className="hidden md:flex items-center gap-6 ml-8">
              <span className="text-[#8a4b35] border-b-2 border-[#8a4b35] pb-1 font-semibold text-xs uppercase tracking-wider cursor-default">
                Overview
              </span>
              <a
                href="#events"
                className="text-[#53433e] hover:text-[#1a1c18] pb-1 transition-colors text-xs uppercase tracking-wider font-medium"
              >
                Events
              </a>
              <a
                href="#tasks"
                className="text-[#53433e] hover:text-[#1a1c18] pb-1 transition-colors text-xs uppercase tracking-wider font-medium"
              >
                Checklist
              </a>
              <a
                href="#guests"
                className="text-[#53433e] hover:text-[#1a1c18] pb-1 transition-colors text-xs uppercase tracking-wider font-medium"
              >
                Guest List
              </a>
            </nav>
          </div>

          {/* Trailing Action Cluster & User Profile */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Support button */}
            <a
              href="#support"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d8c2bb]/50 text-[#53433e] text-xs font-medium hover:bg-[#f4f4ed] transition-colors"
            >
              <span>Support</span>
            </a>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#d8c2bb]/30">
              <div
                className="w-8 h-8 rounded-full bg-[#d9e7d2] text-[#3e4a3b] font-semibold text-xs flex items-center justify-center ring-1 ring-[#d8c2bb]/50"
                title={userName}
              >
                {userInitials}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#1a1c18] leading-tight">
                  {userName}
                </span>
                <span className="text-[11px] text-[#53433e] leading-tight">{userEmail}</span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
              className="text-xs font-medium text-[#53433e] hover:text-[#8a4b35] px-2.5 py-1.5 rounded-lg border border-[#d8c2bb]/40 hover:bg-[#eeeee8] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN DASHBOARD CANVAS */}
      <main className="flex-grow w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-10">
        {/* Hero Identity & Wedding Welcome Header */}
        <div className="bg-white rounded-2xl border border-[#d8c2bb]/40 p-6 md:p-8 mb-8 shadow-[0_1px_3px_rgba(37,39,35,0.03),0_4px_12px_rgba(37,39,35,0.02)] relative overflow-hidden">
          {/* Ambient Decorative background wash */}
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#d9e7d2]/30 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d9e7d2]/60 text-[#3e4a3b] text-xs font-semibold mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#556251]"></span>
                Welcome to your wedding workspace
              </div>

              {/* Headline */}
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#1a1c18] tracking-tight font-medium">
                {wedding.title}
              </h1>

              {/* Metadata Bar */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-sm text-[#53433e]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#8a4b35] font-semibold">📅</span>
                  <span>{formattedDate}</span>
                </div>
                <span className="text-[#d8c2bb] hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#8a4b35] font-semibold">📍</span>
                  <span>{wedding.location?.trim() || 'Location not set yet'}</span>
                </div>
                <span className="text-[#d8c2bb] hidden sm:inline">•</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#d9e7d2]/70 text-[#5b6857] text-xs font-semibold tracking-wide">
                  {countdown.daysRemaining !== null
                    ? countdown.daysRemaining >= 0
                      ? `${countdown.daysRemaining} days to go`
                      : `${Math.abs(countdown.daysRemaining)} days ago`
                    : 'Date pending'}
                </span>
              </div>
            </div>

            {/* Edit Wedding Details Action */}
            <div className="flex items-center gap-3 self-start md:self-center">
              <button
                type="button"
                id="edit-wedding-details-btn"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#d8c2bb]/70 hover:border-[#8a4b35] text-[#1a1c18] hover:text-[#8a4b35] text-xs font-semibold shadow-2xs transition-all hover:bg-[#f4f4ed]"
              >
                <span>✏️</span>
                <span>Edit wedding details</span>
              </button>
            </div>
          </div>
        </div>

        {/* Four Compact Wedding Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-10">
          {/* Metric 1: Wedding Date */}
          <div className="bg-white rounded-xl border border-[#d8c2bb]/40 p-5 hover:border-[#d8c2bb] transition-all shadow-[0_1px_3px_rgba(37,39,35,0.03)] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-xs uppercase tracking-wider text-[#53433e] font-semibold">
                Wedding Date
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#f4f4ed] flex items-center justify-center text-[#8a4b35]">
                📅
              </div>
            </div>
            <div className="mt-4">
              <div className="font-serif text-xl font-medium text-[#1a1c18]">{shortDate}</div>
              <p className="text-xs text-[#53433e] mt-0.5">
                {wedding.weddingDate ? 'Ceremony & Reception scheduled' : 'Date not finalized'}
              </p>
            </div>
          </div>

          {/* Metric 2: Events */}
          <div className="bg-white rounded-xl border border-[#d8c2bb]/40 p-5 hover:border-[#d8c2bb] transition-all shadow-[0_1px_3px_rgba(37,39,35,0.03)] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-xs uppercase tracking-wider text-[#53433e] font-semibold">
                Events
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#f4f4ed] flex items-center justify-center text-[#8a4b35]">
                🎉
              </div>
            </div>
            <div className="mt-4">
              <div className="font-serif text-xl font-medium text-[#53433e]/80">No events yet</div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-[#53433e]">Add ceremonies & itineraries</p>
                <a className="text-xs font-semibold text-[#8a4b35] hover:underline" href="#events">
                  + Add Event
                </a>
              </div>
            </div>
          </div>

          {/* Metric 3: Tasks */}
          <div className="bg-white rounded-xl border border-[#d8c2bb]/40 p-5 hover:border-[#d8c2bb] transition-all shadow-[0_1px_3px_rgba(37,39,35,0.03)] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-xs uppercase tracking-wider text-[#53433e] font-semibold">
                Tasks
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#f4f4ed] flex items-center justify-center text-[#8a4b35]">
                ✓
              </div>
            </div>
            <div className="mt-4">
              <div className="font-serif text-xl font-medium text-[#53433e]/80">No tasks yet</div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-[#53433e]">Keep track of deadlines</p>
                <a className="text-xs font-semibold text-[#8a4b35] hover:underline" href="#tasks">
                  + Create Task
                </a>
              </div>
            </div>
          </div>

          {/* Metric 4: Budget & Expenses */}
          <div className="bg-white rounded-xl border border-[#d8c2bb]/40 p-5 hover:border-[#d8c2bb] transition-all shadow-[0_1px_3px_rgba(37,39,35,0.03)] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="text-xs uppercase tracking-wider text-[#53433e] font-semibold">
                Budget & Expenses
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#f4f4ed] flex items-center justify-center text-[#8a4b35]">
                💳
              </div>
            </div>
            <div className="mt-4">
              <div className="font-serif text-xl font-medium text-[#53433e]/80">Not set up yet</div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-[#53433e] truncate mr-1">Set target & track</p>
                <a
                  className="text-xs font-semibold text-[#8a4b35] hover:underline shrink-0"
                  href="#budget"
                >
                  Set Budget
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Planning Overview: Two-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Your Planning (7 of 12 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-medium text-[#1a1c18]">Your Planning</h2>
                <p className="text-xs text-[#53433e]">
                  Curate and monitor your wedding milestones with structured ease.
                </p>
              </div>
              <span className="text-xs text-[#556251] bg-[#d9e7d2]/50 px-2.5 py-1 rounded-full font-medium">
                4 Setup Steps Left
              </span>
            </div>

            {/* Section A: Upcoming Events Container with Empty State */}
            <div
              className="bg-white rounded-2xl border border-[#d8c2bb]/40 p-6 md:p-7 shadow-[0_1px_3px_rgba(37,39,35,0.03)]"
              id="events"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e3e3dc]/40">
                <div className="flex items-center gap-2">
                  <span className="text-[#8a4b35] text-lg">🎉</span>
                  <h3 className="font-semibold text-sm text-[#1a1c18]">Upcoming Events</h3>
                </div>
                <button
                  type="button"
                  className="text-xs text-[#8a4b35] hover:text-[#a8624b] font-semibold transition-colors"
                >
                  View Timeline
                </button>
              </div>
              {/* Empty State */}
              <div className="text-center py-8 px-4 flex flex-col items-center justify-center bg-[#f4f4ed]/50 rounded-xl border border-dashed border-[#d8c2bb]/60">
                <div className="w-12 h-12 rounded-full bg-white border border-[#d8c2bb]/40 flex items-center justify-center text-[#8a4b35] mb-3 shadow-xs text-xl">
                  🎉
                </div>
                <h4 className="font-serif text-lg text-[#1a1c18] font-medium">
                  Your wedding events start here
                </h4>
                <p className="text-xs text-[#53433e] max-w-sm mt-1.5 mb-5 text-center leading-relaxed">
                  Organize your Mehendi, Sangeet, Ceremony and Reception in one timeline.
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#8a4b35] text-white text-xs font-semibold hover:bg-[#a8624b] shadow-xs transition-colors"
                >
                  <span>+</span>
                  <span>Add your first event</span>
                </button>
              </div>
            </div>

            {/* Section B: Tasks to Focus On Container with Empty State */}
            <div
              className="bg-white rounded-2xl border border-[#d8c2bb]/40 p-6 md:p-7 shadow-[0_1px_3px_rgba(37,39,35,0.03)]"
              id="tasks"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e3e3dc]/40">
                <div className="flex items-center gap-2">
                  <span className="text-[#8a4b35] text-lg">✓</span>
                  <h3 className="font-semibold text-sm text-[#1a1c18]">Tasks to Focus On</h3>
                </div>
                <span className="text-xs text-[#53433e] font-medium">0 of 0 Completed</span>
              </div>
              {/* Empty State */}
              <div className="text-center py-8 px-4 flex flex-col items-center justify-center bg-[#f4f4ed]/50 rounded-xl border border-dashed border-[#d8c2bb]/60">
                <div className="w-12 h-12 rounded-full bg-white border border-[#d8c2bb]/40 flex items-center justify-center text-[#556251] mb-3 shadow-xs text-xl">
                  📋
                </div>
                <h4 className="font-serif text-lg text-[#1a1c18] font-medium">
                  Keep your plans organized
                </h4>
                <p className="text-xs text-[#53433e] max-w-sm mt-1.5 mb-5 text-center leading-relaxed">
                  Create tasks, set due dates, and assign roles to family members or wedding
                  planners.
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-[#d8c2bb] text-[#1a1c18] text-xs font-semibold hover:bg-[#f4f4ed] hover:border-[#8a4b35] transition-all"
                >
                  <span>+</span>
                  <span>Create a task</span>
                </button>
              </div>
            </div>

            {/* Section C: Your Next Steps Getting-Started Checklist */}
            <div className="bg-white rounded-2xl border border-[#d8c2bb]/40 p-6 md:p-7 shadow-[0_1px_3px_rgba(37,39,35,0.03)]">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-serif text-xl text-[#1a1c18] font-medium">Your next steps</h3>
                  <p className="text-xs text-[#53433e]">
                    Recommended priorities tailored to your planning phase
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-[#8a4b35]">0%</span>
                  <div className="w-20 h-1.5 bg-[#e3e3dc] rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-[#556251] w-0"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="group flex items-center justify-between p-3.5 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/50 hover:bg-[#f4f4ed]/40 transition-all cursor-pointer">
                  <div className="flex items-center gap-3.5">
                    <div className="w-5 h-5 rounded border border-[#d8c2bb] group-hover:border-[#8a4b35] flex items-center justify-center bg-white transition-colors"></div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors">
                        1. Add wedding events
                      </h4>
                      <p className="text-[11px] text-[#53433e]">Ceremonies, timeline & venues</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#86736d] group-hover:text-[#8a4b35] group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </div>

                <div className="group flex items-center justify-between p-3.5 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/50 hover:bg-[#f4f4ed]/40 transition-all cursor-pointer">
                  <div className="flex items-center gap-3.5">
                    <div className="w-5 h-5 rounded border border-[#d8c2bb] group-hover:border-[#8a4b35] flex items-center justify-center bg-white transition-colors"></div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors">
                        2. Create your first planning task
                      </h4>
                      <p className="text-[11px] text-[#53433e]">Attire, catering, stationery</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#86736d] group-hover:text-[#8a4b35] group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </div>

                <div className="group flex items-center justify-between p-3.5 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/50 hover:bg-[#f4f4ed]/40 transition-all cursor-pointer">
                  <div className="flex items-center gap-3.5">
                    <div className="w-5 h-5 rounded border border-[#d8c2bb] group-hover:border-[#8a4b35] flex items-center justify-center bg-white transition-colors"></div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors">
                        3. Start building the guest list
                      </h4>
                      <p className="text-[11px] text-[#53433e]">Digital invites & RSVPs</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#86736d] group-hover:text-[#8a4b35] group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </div>

                <div className="group flex items-center justify-between p-3.5 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/50 hover:bg-[#f4f4ed]/40 transition-all cursor-pointer">
                  <div className="flex items-center gap-3.5">
                    <div className="w-5 h-5 rounded border border-[#d8c2bb] group-hover:border-[#8a4b35] flex items-center justify-center bg-white transition-colors"></div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors">
                        4. Set an initial budget
                      </h4>
                      <p className="text-[11px] text-[#53433e]">
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

          {/* RIGHT COLUMN: Quick Actions & Exploration (5 of 12 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#1a1c18]">
                Quick Actions & Exploration
              </h2>
              <p className="text-xs text-[#53433e]">
                Seamless access to concierge tools & digital workspace features.
              </p>
            </div>

            {/* Bento Grid of Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Action 1 */}
              <div className="bg-white p-4 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/40 hover:shadow-xs transition-all group cursor-pointer flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#f4f4ed] flex items-center justify-center text-[#8a4b35] group-hover:bg-[#ffdbd0] transition-colors">
                  📅
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors flex items-center justify-between">
                    Plan an Event
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </h4>
                  <p className="text-[11px] text-[#53433e] mt-0.5">
                    Schedule ceremonies, timings, & venues
                  </p>
                </div>
              </div>

              {/* Action 2 */}
              <div className="bg-white p-4 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/40 hover:shadow-xs transition-all group cursor-pointer flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#f4f4ed] flex items-center justify-center text-[#556251] group-hover:bg-[#d9e7d2] transition-colors">
                  ✓
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors flex items-center justify-between">
                    Create a Task
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </h4>
                  <p className="text-[11px] text-[#53433e] mt-0.5">
                    Organize checklists & assignees
                  </p>
                </div>
              </div>

              {/* Action 3 */}
              <div className="bg-white p-4 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/40 hover:shadow-xs transition-all group cursor-pointer flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#f4f4ed] flex items-center justify-center text-[#8a4b35] group-hover:bg-[#ffdbd0] transition-colors">
                  👥
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors flex items-center justify-between">
                    Manage Guests
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </h4>
                  <p className="text-[11px] text-[#53433e] mt-0.5">
                    Build guest lists, families, & RSVPs
                  </p>
                </div>
              </div>

              {/* Action 4 */}
              <div className="bg-white p-4 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/40 hover:shadow-xs transition-all group cursor-pointer flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#f4f4ed] flex items-center justify-center text-[#556251] group-hover:bg-[#d9e7d2] transition-colors">
                  💳
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors flex items-center justify-between">
                    Track Expenses
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </h4>
                  <p className="text-[11px] text-[#53433e] mt-0.5">
                    Record vendor deposits & outlays
                  </p>
                </div>
              </div>

              {/* Action 5 */}
              <div className="bg-white p-4 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/40 hover:shadow-xs transition-all group cursor-pointer flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#f4f4ed] flex items-center justify-center text-[#8a4b35] group-hover:bg-[#ffdbd0] transition-colors">
                  🏪
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors flex items-center justify-between">
                    Explore Vendors
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </h4>
                  <p className="text-[11px] text-[#53433e] mt-0.5">
                    Discover photographers & caterers
                  </p>
                </div>
              </div>

              {/* Action 6 */}
              <div className="bg-white p-4 rounded-xl border border-[#d8c2bb]/40 hover:border-[#8a4b35]/40 hover:shadow-xs transition-all group cursor-pointer flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#f4f4ed] flex items-center justify-center text-[#556251] group-hover:bg-[#d9e7d2] transition-colors">
                  🌐
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-semibold text-[#1a1c18] group-hover:text-[#8a4b35] transition-colors flex items-center justify-between">
                    Wedding Website
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </h4>
                  <p className="text-[11px] text-[#53433e] mt-0.5">
                    Publish couple story & live schedule
                  </p>
                </div>
              </div>
            </div>

            {/* Editorial Bridal Preview Card */}
            <div className="bg-white rounded-2xl border border-[#d8c2bb]/40 overflow-hidden shadow-[0_1px_3px_rgba(37,39,35,0.03)] flex flex-col">
              <div className="relative h-48 w-full overflow-hidden bg-[#e8e9e2]">
                <img
                  src="https://lh3.googleusercontent.com/aida/AEtjO1W7SJSa4j0duSkXubslI2HL0U5Bjr_anyUNox-nWW0Qf_YU45cFwrVz1y2ddYD_7SNsikEGxYxE669tyd6TbZIh9KgfEfY6Yo5ePbuCoQSIGs0B_Z7KmPFh3_-gJXVDsyXLoGfBuOmzKjykkZ23ZhlR4_vc9pRWHUdPPCqPdXx1u1cRy5vYaYCKy8V9m_tTtsYwb2wwg-4goO-ZoIZl53YORUVYxPixo4mdx_Mzx67Q2BWanBZDrdlwDjY"
                  alt="Editorial wedding couple in Udaipur"
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c18]/70 via-transparent to-transparent"></div>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#1a1c18] text-[11px] font-semibold tracking-wide shadow-xs">
                  Concierge Service
                </span>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="text-[10px] uppercase tracking-widest text-[#f4ba9c] font-semibold">
                    Bespoke Destination
                  </span>
                  <p className="text-sm font-serif font-medium text-white/95">
                    {wedding.location || 'The Oberoi Udaivilas Celebration Suite'}
                  </p>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between bg-white border-t border-[#e3e3dc]/40">
                <p className="text-xs text-[#53433e]">
                  Curated for discerning couples • Concierge support ready
                </p>
                <button
                  type="button"
                  className="text-xs text-[#8a4b35] font-semibold hover:underline inline-flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Speak to Planner</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

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

      {/* 4. FOOTER */}
      <footer className="w-full bg-[#fafaf3] border-t border-[#e3e3dc] py-6 mt-16">
        <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#53433e]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-[#8a4b35] text-sm">
              Make My Marriage
            </span>
            <span>•</span>
            <span>
              © 2025 Make My Marriage. Warm editorial minimalism for elevated celebrations.
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
            <a href="#journal" className="hover:text-[#8a4b35] transition-colors">
              Style Journal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function EditWeddingDetailsModal({
  initialData,
  isSubmitting,
  error,
  onClose,
  onSave,
}: {
  initialData: DashboardData['wedding'];
  isSubmitting: boolean;
  error?: string;
  onClose: () => void;
  onSave: (values: UpdateWeddingInput) => void;
}) {
  const [title, setTitle] = useState(initialData.title);
  const [brideName, setBrideName] = useState(initialData.brideName);
  const [groomName, setGroomName] = useState(initialData.groomName);
  const [weddingDate, setWeddingDate] = useState(initialData.weddingDate ?? '');
  const [location, setLocation] = useState(initialData.location ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      brideName,
      groomName,
      weddingDate: weddingDate ? weddingDate : null,
      location: location ? location : null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-[#d8c2bb]/50 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center pb-3 border-b border-[#e3e3dc]">
          <h3 className="font-serif text-xl font-medium text-[#1a1c18]">Edit wedding details</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
              htmlFor="edit-title"
            >
              Wedding Name
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1.5 w-full min-h-10 px-3 border border-[#d8c2bb]/70 rounded-lg text-sm text-[#1a1c18] outline-none focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                htmlFor="edit-bride"
              >
                Partner 1
              </label>
              <input
                id="edit-bride"
                type="text"
                value={brideName}
                onChange={(e) => setBrideName(e.target.value)}
                required
                className="mt-1.5 w-full min-h-10 px-3 border border-[#d8c2bb]/70 rounded-lg text-sm text-[#1a1c18] outline-none focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/10"
              />
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                htmlFor="edit-groom"
              >
                Partner 2
              </label>
              <input
                id="edit-groom"
                type="text"
                value={groomName}
                onChange={(e) => setGroomName(e.target.value)}
                required
                className="mt-1.5 w-full min-h-10 px-3 border border-[#d8c2bb]/70 rounded-lg text-sm text-[#1a1c18] outline-none focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                htmlFor="edit-date"
              >
                Wedding Date
              </label>
              <input
                id="edit-date"
                type="date"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
                className="mt-1.5 w-full min-h-10 px-3 border border-[#d8c2bb]/70 rounded-lg text-sm text-[#1a1c18] outline-none focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/10"
              />
            </div>
            <div>
              <label
                className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                htmlFor="edit-loc"
              >
                Location
              </label>
              <input
                id="edit-loc"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or venue"
                className="mt-1.5 w-full min-h-10 px-3 border border-[#d8c2bb]/70 rounded-lg text-sm text-[#1a1c18] outline-none focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/10"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#e3e3dc]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#d8c2bb] text-xs font-medium text-[#53433e] hover:bg-[#fafaf3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#8a4b35] text-white text-xs font-semibold hover:bg-[#a8624b] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
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
