import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import { BrandMark } from '../../components/BrandMark';
import {
  listEvents,
  updateEvent,
  deleteEvent,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_STYLES,
  type WeddingEvent,
  type EventStatus,
} from './eventsApi';
import { EventModal } from './EventModal';
import { ApiRequestError } from '../../lib/api-client';
import { useIsInsideAuthenticatedLayout } from '../../components/layout/AuthenticatedLayoutContext';

export function formatEventDate(isoString: string | null): string {
  if (!isoString) return 'Date to be announced';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Date to be announced';
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Date to be announced';
  }
}

export function formatEventTimeRange(
  startsAt: string | null,
  endsAt: string | null,
): string | null {
  if (!startsAt && !endsAt) return null;

  const isZeroTime = (d: Date) => d.getHours() === 0 && d.getMinutes() === 0;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    if (isZeroTime(d)) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const startDate = startsAt ? new Date(startsAt) : null;
  const endDate = endsAt ? new Date(endsAt) : null;

  const validStart = startDate && !isNaN(startDate.getTime()) ? startDate : null;
  const validEnd = endDate && !isNaN(endDate.getTime()) ? endDate : null;

  // If start is 00:00 and no end time is specified, user scheduled a date-only event
  if (validStart && isZeroTime(validStart) && !validEnd) {
    return null;
  }

  const startFormatted = startsAt ? formatTime(startsAt) : '';
  const endFormatted = endsAt ? formatTime(endsAt) : '';

  if (startFormatted && endFormatted) return `${startFormatted} – ${endFormatted}`;
  if (startFormatted) return `Starts at ${startFormatted}`;
  if (endFormatted) return `Until ${endFormatted}`;
  return null;
}

export function EventsPage() {
  const isInsideLayout = useIsInsideAuthenticatedLayout();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | EventStatus>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<WeddingEvent | null>(null);

  // Delete modal state
  const [eventToDelete, setEventToDelete] = useState<WeddingEvent | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const weddingTitle = session?.wedding?.title || 'Your Wedding Workspace';

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['events', { statusFilter, sortOrder }],
    queryFn: () =>
      listEvents({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        sortBy: 'startsAt',
        sortOrder,
        limit: 100,
      }),
    staleTime: 30_000,
  });

  const allEvents = data?.events ?? [];
  const metrics = data?.metrics ?? {
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  };

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return allEvents;
    const q = searchQuery.toLowerCase().trim();
    return allEvents.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.venueName && e.venueName.toLowerCase().includes(q)) ||
        (e.venueAddress && e.venueAddress.toLowerCase().includes(q)),
    );
  }, [allEvents, searchQuery]);

  const cancelMutation = useMutation({
    mutationFn: (eventId: string) => updateEvent(eventId, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : 'Failed to cancel event');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => deleteEvent(eventId),
    onSuccess: () => {
      setEventToDelete(null);
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => {
      if (err instanceof ApiRequestError) {
        setDeleteError(err.message);
      } else {
        setDeleteError('Failed to delete event. Please try again.');
      }
    },
  });

  const handleCreateOrUpdateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleQuickCancel = (event: WeddingEvent) => {
    cancelMutation.mutate(event.id);
  };

  const handleConfirmDelete = () => {
    if (!eventToDelete) return;
    setDeleteError(null);
    deleteMutation.mutate(eventToDelete.id);
  };

  const error =
    queryError instanceof Error
      ? queryError.message
      : queryError
        ? 'Failed to load wedding events. Please refresh or try again.'
        : null;
  const deleting = deleteMutation.isPending;

  const eventsContent = (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 min-w-0">
      {/* Page Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8a4b35]/10 text-[#8a4b35] text-xs font-semibold uppercase tracking-wider mb-2">
            Ceremony & Timeline Management
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#1c1d1b] tracking-tight">
            Wedding Events
          </h1>
          <p className="text-sm sm:text-base text-[#5c5d59] mt-1 max-w-2xl">
            Plan and coordinate ceremonies, dinners, and parties for {weddingTitle}.
          </p>
        </div>

        <button
          onClick={() => {
            setEventToEdit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8a4b35] hover:bg-[#723c2a] text-white font-medium text-sm shadow-sm hover:shadow transition-all duration-200 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Event</span>
        </button>
      </div>

      {/* Informational Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total */}
        <div className="bg-white rounded-xl border border-[#d8c2bb]/50 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#7a7c77] uppercase tracking-wider">
            Total Events
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1c1d1b]">
              {metrics?.total ?? 0}
            </span>
            <span className="text-xs text-[#5c5d59]">ceremonies</span>
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-xl border border-[#d8c2bb]/50 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#556251] uppercase tracking-wider">
            Upcoming
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#3e4a3b]">
              {metrics?.upcoming ?? 0}
            </span>
            <span className="text-xs text-[#5c5d59]">scheduled</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl border border-[#d8c2bb]/50 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider">
            Completed
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#334155]">
              {metrics?.completed ?? 0}
            </span>
            <span className="text-xs text-[#5c5d59]">finished</span>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white rounded-xl border border-[#d8c2bb]/50 p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-[#991b1b] uppercase tracking-wider">
            Cancelled
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-[#991b1b]">
              {metrics?.cancelled ?? 0}
            </span>
            <span className="text-xs text-[#5c5d59]">archived</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#e5e3dc] p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by event or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#d8c2bb] focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/20 outline-none text-[#1c1d1b] placeholder:text-[#a09e99]"
          />
          <svg
            className="w-4 h-4 text-[#7a7c77] absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | EventStatus)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#d8c2bb] text-[#1c1d1b] bg-white focus:border-[#8a4b35] focus:ring-2 focus:ring-[#8a4b35]/20 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#d8c2bb] text-[#5c5d59] hover:text-[#1c1d1b] hover:bg-[#fafaf5] transition-colors"
          >
            <span>{sortOrder === 'asc' ? 'Earliest First' : 'Latest First'}</span>
            <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center mb-8">
          <p className="text-sm text-red-800 font-medium mb-3">{error}</p>
          <button
            onClick={() => void refetch()}
            className="px-4 py-2 rounded-xl bg-red-800 text-white text-xs font-semibold hover:bg-red-900 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-[#e5e3dc] p-5 shadow-xs animate-pulse space-y-4"
            >
              <div className="w-full h-40 bg-[#f4ede6] rounded-xl" />
              <div className="h-5 bg-[#f4ede6] rounded-md w-3/4" />
              <div className="h-4 bg-[#f4ede6] rounded-md w-1/2" />
              <div className="h-4 bg-[#f4ede6] rounded-md w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Content / Event Cards */}
      {!loading && !error && (
        <>
          {filteredEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#d8c2bb] p-12 text-center my-6">
              <div className="w-14 h-14 rounded-full bg-[#f4ede6] text-[#8a4b35] flex items-center justify-center text-2xl mx-auto mb-4">
                🎉
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1c1d1b] mb-1">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No events match your search or filter'
                  : 'Your wedding events start here'}
              </h3>
              <p className="text-sm text-[#5c5d59] max-w-md mx-auto mb-6">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try adjusting your search criteria or resetting filters to see all wedding ceremonies.'
                  : 'Organize your Mehendi, Sangeet, Ceremony, and Reception in one cohesive celebration timeline.'}
              </p>

              {searchQuery || statusFilter !== 'ALL' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  }}
                  className="px-4 py-2 rounded-xl border border-[#d8c2bb] text-sm font-semibold text-[#5c5d59] hover:bg-[#fafaf5]"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEventToEdit(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8a4b35] hover:bg-[#723c2a] text-white text-sm font-semibold shadow-xs hover:shadow transition-all"
                >
                  <span>+</span>
                  <span>Add your first event</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const statusStyle =
                  EVENT_STATUS_STYLES[event.status] ?? EVENT_STATUS_STYLES.PLANNED;
                const dateStr = formatEventDate(event.startsAt);
                const timeStr = formatEventTimeRange(event.startsAt, event.endsAt);

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl border border-[#e5e3dc] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Cover image or fallback */}
                      <div className="relative w-full h-44 bg-[#f4ede6] overflow-hidden">
                        {event.coverImageKey ? (
                          <img
                            src={event.coverImageKey}
                            alt={event.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[#8a4b35] bg-gradient-to-br from-[#faf6f0] to-[#f4ede6]">
                            <span className="font-serif text-3xl font-bold opacity-40">
                              {event.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="text-xs text-[#8a4b35]/60 mt-1 font-serif">
                              Make My Marriage
                            </span>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            {EVENT_STATUS_LABELS[event.status]}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5">
                        <Link
                          to={`/events/${event.id}`}
                          className="font-serif text-lg font-bold text-[#1c1d1b] hover:text-[#8a4b35] transition-colors line-clamp-1"
                        >
                          {event.name}
                        </Link>

                        {/* Date & Time */}
                        <div className="mt-2.5 space-y-1 text-xs text-[#5c5d59]">
                          <div className="flex items-center gap-2">
                            <span className="text-[#8a4b35]">📅</span>
                            <span className="font-medium text-[#1c1d1b]">{dateStr}</span>
                          </div>
                          {timeStr && (
                            <div className="flex items-center gap-2">
                              <span className="text-[#8a4b35]">⏰</span>
                              <span>{timeStr}</span>
                            </div>
                          )}
                        </div>

                        {/* Venue */}
                        {(event.venueName || event.venueAddress) && (
                          <div className="mt-3 pt-3 border-t border-[#f0ede6] text-xs text-[#5c5d59] flex items-start gap-2">
                            <span className="text-[#8a4b35] shrink-0 mt-0.5">📍</span>
                            <div className="line-clamp-2">
                              {event.venueName && (
                                <span className="font-medium text-[#1c1d1b] block">
                                  {event.venueName}
                                </span>
                              )}
                              {event.venueAddress && (
                                <span className="text-[11px] text-[#7a7c77]">
                                  {event.venueAddress}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Dress code preview if present */}
                        {event.dressCode && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#556251] bg-[#d9e7d2]/40 px-2 py-1 rounded-md">
                            <span>👗</span>
                            <span className="truncate">{event.dressCode}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="px-5 py-3.5 bg-[#fafaf7] border-t border-[#f0ede6] flex items-center justify-between text-xs">
                      <Link
                        to={`/events/${event.id}`}
                        className="font-semibold text-[#8a4b35] hover:text-[#723c2a] transition-colors"
                      >
                        View Details →
                      </Link>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEventToEdit(event);
                            setIsModalOpen(true);
                          }}
                          className="text-[#5c5d59] hover:text-[#1c1d1b] font-medium px-2 py-1 rounded-md hover:bg-black/5 transition-colors"
                        >
                          Edit
                        </button>

                        {event.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => void handleQuickCancel(event)}
                            className="text-[#991b1b] hover:text-red-800 font-medium px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setEventToDelete(event);
                            setDeleteError(null);
                          }}
                          className="text-[#7a7c77] hover:text-red-700 font-medium px-1.5 py-1 rounded-md hover:bg-red-50 transition-colors"
                          title="Delete event"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {/* End eventsContent */}
    </div>
  );

  const modalsContent = (
    <>
      {/* Create / Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        onSuccess={handleCreateOrUpdateSuccess}
      />

      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#e5e3dc] p-6 text-left">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-lg mb-4">
              ⚠️
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1c1d1b] mb-2">
              Delete &quot;{eventToDelete.name}&quot;?
            </h3>
            <p className="text-xs sm:text-sm text-[#5c5d59] leading-relaxed mb-4">
              Are you sure you want to delete this event? This action cannot be undone. Any
              associated guest invitations will be disconnected.
            </p>
            <p className="text-xs text-[#8a4b35] bg-[#faf6f0] p-3 rounded-xl border border-[#e7d5c9] mb-5">
              <strong>Tip:</strong> If you simply need to call off this ceremony, consider changing
              its status to <em>Cancelled</em> to preserve your records and notes.
            </p>

            {deleteError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-[#d8c2bb] text-sm font-medium text-[#5c5d59] hover:bg-[#fafaf5]"
              >
                Keep Event
              </button>
              {eventToDelete.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={async () => {
                    await handleQuickCancel(eventToDelete);
                    setEventToDelete(null);
                  }}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl border border-[#8a4b35] text-[#8a4b35] hover:bg-[#faf6f0] text-sm font-medium"
                >
                  Cancel Instead
                </button>
              )}
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
        {eventsContent}
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
              to="/dashboard"
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
              <span>Back to Dashboard</span>
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
      <main className="flex-1 w-full">{eventsContent}</main>
      {modalsContent}
    </div>
  );
}
