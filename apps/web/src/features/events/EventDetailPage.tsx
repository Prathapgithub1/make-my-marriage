import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import { BrandMark } from '../../components/BrandMark';
import {
  getEvent,
  updateEvent,
  deleteEvent,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_STYLES,
  type WeddingEvent,
} from './eventsApi';
import { EventModal } from './EventModal';
import { formatEventDate, formatEventTimeRange } from './EventsPage';
import { ApiRequestError } from '../../lib/api-client';
import { useIsInsideAuthenticatedLayout } from '../../components/layout/AuthenticatedLayoutContext';

type TabKey = 'overview' | 'guests' | 'tasks' | 'expenses' | 'vendors';

export function EventDetailPage() {
  const isInsideLayout = useIsInsideAuthenticatedLayout();
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Deletion modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    data: event,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['events', eventId],
    queryFn: () => getEvent(eventId!),
    enabled: Boolean(eventId),
    staleTime: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: WeddingEvent['status']) => updateEvent(eventId!, { status: newStatus }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['events', eventId], updated);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : 'Failed to update event status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(eventId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/events', { replace: true });
    },
    onError: (err) => {
      if (err instanceof ApiRequestError) {
        setDeleteError(err.message);
      } else {
        setDeleteError('Failed to delete event.');
      }
    },
  });

  const handleStatusChange = (newStatus: WeddingEvent['status']) => {
    statusMutation.mutate(newStatus);
  };

  const handleConfirmDelete = () => {
    setDeleteError(null);
    deleteMutation.mutate();
  };

  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? 'Failed to load event details. Please try again.'
        : null;
  const deleting = deleteMutation.isPending;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#8a4b35]/10 border border-[#8a4b35]/20 flex items-center justify-center text-[#8a4b35] font-serif font-bold text-xl mb-4 animate-pulse">
          🎉
        </div>
        <p className="font-serif text-xl font-medium text-[#1c1d1b]">Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#fafaf5] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white rounded-2xl border border-[#d8c2bb]/50 p-8 shadow-sm">
          <h2 className="font-serif text-2xl font-semibold text-[#8a4b35]">Event Not Found</h2>
          <p className="text-sm text-[#5c5d59] mt-3 leading-relaxed">
            {error ||
              'The requested wedding event could not be found or you do not have permission to view it.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => void refetch()}
              className="px-4 py-2 rounded-xl bg-[#8a4b35] text-white text-xs font-semibold hover:bg-[#723c2a]"
            >
              Retry
            </button>
            <Link
              to="/events"
              className="px-4 py-2 rounded-xl border border-[#d8c2bb] text-[#1c1d1b] text-xs font-medium hover:bg-[#fafaf5]"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusStyle = EVENT_STATUS_STYLES[event.status] ?? EVENT_STATUS_STYLES.PLANNED;
  const dateFormatted = formatEventDate(event.startsAt);
  const timeFormatted = formatEventTimeRange(event.startsAt, event.endsAt);

  const detailContent = (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 min-w-0">
      {/* Cover Hero Banner */}
      <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden shadow-sm border border-[#e5e3dc] bg-[#f4ede6] mb-8">
        {event.coverImageKey ? (
          <img
            src={event.coverImageKey}
            alt={event.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8a4b35] bg-gradient-to-br from-[#faf6f0] via-[#f7eee5] to-[#ece1d5]">
            <span className="text-6xl font-serif font-bold opacity-30">
              {event.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-sm font-serif tracking-widest uppercase text-[#8a4b35]/70 mt-2">
              Make My Marriage Celebration
            </span>
          </div>
        )}

        {/* Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

        {/* Hero Content */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${statusStyle.badge}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                {EVENT_STATUS_LABELS[event.status]}
              </span>
              {event.dressCode && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/40 backdrop-blur-md text-white border border-white/20">
                  👗 {event.dressCode}
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
              {event.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs sm:text-sm text-white/90">
              <span className="flex items-center gap-1.5">
                <span>📅</span>
                <strong>{dateFormatted}</strong>
              </span>
              {timeFormatted && (
                <span className="flex items-center gap-1.5">
                  <span>⏰</span>
                  <span>{timeFormatted}</span>
                </span>
              )}
              {event.venueName && (
                <span className="flex items-center gap-1.5">
                  <span>📍</span>
                  <span>{event.venueName}</span>
                </span>
              )}
            </div>
          </div>

          {/* Top Hero Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/95 hover:bg-white text-[#1c1d1b] text-xs sm:text-sm font-semibold shadow-md transition-all"
            >
              Edit Event
            </button>
            {event.status !== 'CANCELLED' ? (
              <button
                type="button"
                onClick={() => void handleStatusChange('CANCELLED')}
                className="px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs sm:text-sm font-medium backdrop-blur-md transition-all"
              >
                Cancel Event
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleStatusChange('CONFIRMED')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs sm:text-sm font-medium backdrop-blur-md transition-all"
              >
                Reopen Event
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="p-2 rounded-xl bg-black/40 hover:bg-red-700/80 text-white transition-all text-sm"
              title="Delete event"
            >
              🗑
            </button>
          </div>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex items-center border-b border-[#e5e3dc] gap-6 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors relative ${
            activeTab === 'overview'
              ? 'text-[#8a4b35] border-b-2 border-[#8a4b35]'
              : 'text-[#5c5d59] hover:text-[#1c1d1b]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('guests')}
          className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors relative ${
            activeTab === 'guests'
              ? 'text-[#8a4b35] border-b-2 border-[#8a4b35]'
              : 'text-[#5c5d59] hover:text-[#1c1d1b]'
          }`}
        >
          Invited Guests
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors relative ${
            activeTab === 'tasks'
              ? 'text-[#8a4b35] border-b-2 border-[#8a4b35]'
              : 'text-[#5c5d59] hover:text-[#1c1d1b]'
          }`}
        >
          Related Tasks
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors relative ${
            activeTab === 'expenses'
              ? 'text-[#8a4b35] border-b-2 border-[#8a4b35]'
              : 'text-[#5c5d59] hover:text-[#1c1d1b]'
          }`}
        >
          Related Expenses
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors relative ${
            activeTab === 'vendors'
              ? 'text-[#8a4b35] border-b-2 border-[#8a4b35]'
              : 'text-[#5c5d59] hover:text-[#1c1d1b]'
          }`}
        >
          Related Vendor
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-2xl border border-[#e5e3dc] p-6 shadow-xs">
              <h3 className="font-serif text-lg font-bold text-[#1c1d1b] mb-3">
                About this Ceremony
              </h3>
              {event.description ? (
                <p className="text-sm text-[#5c5d59] leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              ) : (
                <p className="text-xs text-[#7a7c77] italic">
                  No description or host instructions added yet. Click &quot;Edit Event&quot; to add
                  notes for your planning team.
                </p>
              )}
            </div>

            {/* Venue Card */}
            <div className="bg-white rounded-2xl border border-[#e5e3dc] p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#8a4b35] text-lg">📍</span>
                <h3 className="font-serif text-lg font-bold text-[#1c1d1b]">Venue & Location</h3>
              </div>
              {event.venueName || event.venueAddress ? (
                <div className="space-y-2">
                  {event.venueName && (
                    <div className="font-medium text-sm text-[#1c1d1b]">{event.venueName}</div>
                  )}
                  {event.venueAddress && (
                    <p className="text-xs text-[#5c5d59] leading-relaxed">{event.venueAddress}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#7a7c77] italic">Venue has not been finalized yet.</p>
              )}
            </div>
          </div>

          {/* Right Col: Snapshot & Metadata */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#e5e3dc] p-6 shadow-xs space-y-4">
              <h3 className="font-serif text-base font-bold text-[#1c1d1b] border-b border-[#f0ede6] pb-2">
                Event Summary
              </h3>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#7a7c77] font-semibold block">
                  Status
                </span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                    {EVENT_STATUS_LABELS[event.status]}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#7a7c77] font-semibold block">
                  Date & Schedule
                </span>
                <span className="text-xs font-medium text-[#1c1d1b] block mt-1">
                  {dateFormatted}
                </span>
                {timeFormatted && (
                  <span className="text-xs text-[#5c5d59] block">{timeFormatted}</span>
                )}
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#7a7c77] font-semibold block">
                  Dress Code
                </span>
                <span className="text-xs text-[#1c1d1b] block mt-1">
                  {event.dressCode || 'Not specified'}
                </span>
              </div>

              <div className="pt-2 border-t border-[#f0ede6] text-[11px] text-[#7a7c77]">
                Last updated on {new Date(event.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Invited Guests */}
      {activeTab === 'guests' && (
        <div className="bg-white rounded-2xl border border-dashed border-[#d8c2bb] p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#f4ede6] text-[#8a4b35] flex items-center justify-center text-xl mx-auto mb-3">
            👥
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1c1d1b] mb-1">
            Guest Invitations for this Event
          </h3>
          <p className="text-xs sm:text-sm text-[#5c5d59] max-w-md mx-auto mb-4">
            All registered guests on your wedding list can be invited to {event.name}. Specific
            sub-event RSVPs and headcount assignments will synchronize when the guest registry is
            connected.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#fafaf5] border border-[#d8c2bb] text-xs text-[#5c5d59]">
            <span>Status:</span>
            <strong className="text-[#1c1d1b]">Open to all wedding invitees by default</strong>
          </div>
        </div>
      )}

      {/* Tab 3: Related Tasks */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-2xl border border-dashed border-[#d8c2bb] p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#f4ede6] text-[#8a4b35] flex items-center justify-center text-xl mx-auto mb-3">
            ✓
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1c1d1b] mb-1">
            Event Tasks & Checklists
          </h3>
          <p className="text-xs sm:text-sm text-[#5c5d59] max-w-md mx-auto">
            Checklist tasks tagged with &quot;{event.name}&quot; (such as catering finalization,
            sound checks, and bridal entrance timing) will be accessible here.
          </p>
        </div>
      )}

      {/* Tab 4: Related Expenses */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-dashed border-[#d8c2bb] p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#f4ede6] text-[#8a4b35] flex items-center justify-center text-xl mx-auto mb-3">
            💳
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1c1d1b] mb-1">
            Event Expenses & Budget
          </h3>
          <p className="text-xs sm:text-sm text-[#5c5d59] max-w-md mx-auto">
            Track invoices, advances, and final vendor payments allocated to {event.name}.
          </p>
        </div>
      )}

      {/* Tab 5: Related Vendors */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-dashed border-[#d8c2bb] p-10 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#f4ede6] text-[#8a4b35] flex items-center justify-center text-xl mx-auto mb-3">
            🤝
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1c1d1b] mb-1">
            Assigned Event Vendors
          </h3>
          <p className="text-xs sm:text-sm text-[#5c5d59] max-w-md mx-auto">
            Assign photographers, makeup artists, DJs, and caterers dedicated to this ceremony.
          </p>
        </div>
      )}
      {/* End detailContent */}
    </div>
  );

  const modalsContent = (
    <>
      {/* Edit Modal */}
      <EventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        eventToEdit={event}
        onSuccess={(updated) => {
          queryClient.setQueryData(['events', eventId], updated);
          queryClient.invalidateQueries({ queryKey: ['events'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#e5e3dc] p-6 text-left">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-lg mb-4">
              ⚠️
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1c1d1b] mb-2">
              Permanently Delete Event?
            </h3>
            <p className="text-xs sm:text-sm text-[#5c5d59] leading-relaxed mb-4">
              Are you sure you want to delete <strong>{event.name}</strong>? This action will remove
              all details and disassociate guest records.
            </p>
            <p className="text-xs text-[#8a4b35] bg-[#faf6f0] p-3 rounded-xl border border-[#e7d5c9] mb-5">
              <strong>Recommendation:</strong> Prefer setting the status to <em>Cancelled</em> if
              you wish to preserve your notes and celebration history.
            </p>

            {deleteError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-[#d8c2bb] text-sm font-medium text-[#5c5d59] hover:bg-[#fafaf5]"
              >
                Keep Event
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-semibold shadow-xs"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isInsideLayout) {
    return (
      <>
        {detailContent}
        {modalsContent}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf5] text-[#2c2d2a] font-sans antialiased flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#fafaf5]/90 backdrop-blur-md border-b border-[#e5e3dc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#851321] rounded-lg p-1"
            >
              <BrandMark compact />
              <div className="flex flex-col">
                <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-[#1c1d1b] leading-tight">
                  Make My Marriage
                </span>
                <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#8a4b35] uppercase">
                  Wedding Events & Itinerary
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#5c5d59] hover:text-[#1c1d1b] px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>All Events</span>
            </Link>

            <button
              onClick={async () => {
                try {
                  await logout();
                } finally {
                  navigate('/login', { replace: true });
                }
              }}
              className="text-xs sm:text-sm text-[#7a7c77] hover:text-[#851321] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full">{detailContent}</main>
      {modalsContent}
    </div>
  );
}
