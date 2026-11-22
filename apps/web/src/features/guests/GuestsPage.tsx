import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listGuests,
  deleteGuest,
  type GuestSummary,
  type RsvpStatus,
  RSVP_STATUS_LABELS,
  RSVP_STATUS_STYLES,
  getInvitationLink,
  getWhatsAppShareUrl,
} from './guestsApi';
import { listEvents, type WeddingEvent } from '../events/eventsApi';
import { GuestModal } from './GuestModal';
import { GuestDetailModal } from './GuestDetailModal';
import { SendRemindersModal } from './SendRemindersModal';
import { useAuth } from '../auth/AuthProvider';

export function GuestsPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const weddingTitle = session?.wedding?.title || 'Our Wedding';

  // State
  const [search, setSearch] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState<RsvpStatus | 'ALL'>('ALL');
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [invitationFilter, setInvitationFilter] = useState<'all' | 'true' | 'false'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'rsvpStatus'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<GuestSummary | null>(null);
  const [selectedGuestForDetail, setSelectedGuestForDetail] = useState<GuestSummary | null>(null);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [copyFeedbackId, setCopyFeedbackId] = useState<string | null>(null);

  // Fetch events for filtering
  const { data: eventsResponse } = useQuery<{ events: WeddingEvent[] }>({
    queryKey: ['events', 'list'],
    queryFn: () => listEvents({ limit: 100 }),
  });
  const availableEvents = eventsResponse?.events ?? [];

  // Fetch guests list & metrics
  const {
    data: guestsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'guests',
      { search, rsvpFilter, selectedEventId, invitationFilter, sortBy, sortOrder },
    ],
    queryFn: () =>
      listGuests({
        search: search.trim() || undefined,
        rsvpStatus: rsvpFilter,
        eventId: selectedEventId === 'ALL' ? undefined : selectedEventId,
        invitationSent: invitationFilter,
        sortBy,
        sortOrder,
        limit: 100,
      }),
  });

  const guests = guestsData?.data ?? [];
  const metrics = guestsData?.metrics ?? {
    totalGuests: 0,
    pendingRsvps: 0,
    attendingGuests: 0,
    notAttendingGuests: 0,
    expectedAttendeeCount: 0,
    invitationsSentCount: 0,
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (guestId: string) => deleteGuest(guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleCopyLink = async (guest: GuestSummary) => {
    try {
      const linkData = await getInvitationLink(guest.id);
      const inviteUrl = linkData.url || `${window.location.origin}/invite/${linkData.token}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopyFeedbackId(guest.id);
      setTimeout(() => setCopyFeedbackId(null), 2500);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = async (guest: GuestSummary) => {
    try {
      const linkData = await getInvitationLink(guest.id);
      const inviteUrl = linkData.url || `${window.location.origin}/invite/${linkData.token}`;
      const waUrl = getWhatsAppShareUrl(guest.name, weddingTitle, inviteUrl);
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Fallback
    }
  };

  const handleEdit = (guest: GuestSummary) => {
    setGuestToEdit(guest);
    setIsAddModalOpen(true);
  };

  const handleDelete = (guestId: string) => {
    deleteMutation.mutate(guestId);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 sm:pb-6 border-b border-[#EBE4DC]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider text-[#8D493A] bg-[#FAF3F0] border border-[#F2E1D5] uppercase mb-1.5">
            <svg className="w-3.5 h-3.5 text-[#8D493A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Guest List & RSVP Suite</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1A1C18] tracking-tight">
            Guests & RSVP
          </h1>
          <p className="text-xs sm:text-sm text-[#86736D] mt-1 max-w-xl">
            Manage your guest roster, track RSVP responses, and dispatch personal invitations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsRemindersModalOpen(true)}
            className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-white text-[#8D493A] border border-[#D5C9BE] hover:bg-[#F3ECE4] transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#8D493A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Send Reminders ({metrics.pendingRsvps})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setGuestToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-[#8D493A] hover:bg-[#72382B] text-white transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE4DC] shadow-xs hover:border-[#8D493A]/30 transition-colors flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#86736D]">Total Parties</div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1A1C18] mt-1.5">{metrics.totalGuests}</div>
          <div className="text-[11px] text-[#86736D] mt-1 pt-2 border-t border-[#F4EFEA]">Invited groups</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE4DC] shadow-xs hover:border-[#8D493A]/30 transition-colors flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D32]">Attending</div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2E7D32] mt-1.5">{metrics.expectedAttendeeCount}</div>
          <div className="text-[11px] text-[#2E7D32] mt-1 pt-2 border-t border-[#F4EFEA]">
            {metrics.attendingGuests} confirmed {metrics.attendingGuests === 1 ? 'party' : 'parties'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE4DC] shadow-xs hover:border-[#8D493A]/30 transition-colors flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#B7791F]">Pending RSVP</div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#B7791F] mt-1.5">{metrics.pendingRsvps}</div>
          <div className="text-[11px] text-[#86736D] mt-1 pt-2 border-t border-[#F4EFEA]">Awaiting response</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE4DC] shadow-xs hover:border-[#8D493A]/30 transition-colors flex flex-col justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#C0392B]">Declined</div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#C0392B] mt-1.5">{metrics.notAttendingGuests}</div>
          <div className="text-[11px] text-[#86736D] mt-1 pt-2 border-t border-[#F4EFEA]">Unable to attend</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE4DC] shadow-xs hover:border-[#8D493A]/30 transition-colors flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8D493A]">Invitations Sent</div>
          <div className="text-2xl sm:text-3xl font-serif font-bold text-[#8D493A] mt-1.5">{metrics.invitationsSentCount}</div>
          <div className="text-[11px] text-[#86736D] mt-1 pt-2 border-t border-[#F4EFEA]">
            of {metrics.totalGuests} parties ({metrics.totalGuests > 0 ? Math.round((metrics.invitationsSentCount / metrics.totalGuests) * 100) : 0}%)
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE4DC] shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86736D]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by guest name, email, or phone..."
              className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#D5C9BE] rounded-xl text-[#1A1C18] focus:outline-hidden focus:ring-1 focus:ring-[#8D493A]"
            />
          </div>

          {/* Controls: Event and Dispatch Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {availableEvents.length > 0 && (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9BE] rounded-xl text-[#1A1C18] focus:outline-hidden focus:ring-1 focus:ring-[#8D493A]"
              >
                <option value="ALL">All Events</option>
                {availableEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={invitationFilter}
              onChange={(e) => setInvitationFilter(e.target.value as 'all' | 'true' | 'false')}
              className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9BE] rounded-xl text-[#1A1C18] focus:outline-hidden focus:ring-1 focus:ring-[#8D493A]"
            >
              <option value="all">All Delivery</option>
              <option value="true">Invite Sent</option>
              <option value="false">Invite Not Sent</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'createdAt' | 'rsvpStatus')}
              className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9BE] rounded-xl text-[#1A1C18] focus:outline-hidden focus:ring-1 focus:ring-[#8D493A]"
            >
              <option value="name">Sort: Name</option>
              <option value="createdAt">Sort: Added Date</option>
              <option value="rsvpStatus">Sort: RSVP Status</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#D5C9BE] rounded-xl text-[#1A1C18] hover:bg-[#F3ECE4] cursor-pointer transition-colors"
              title="Toggle sort direction"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>

        {/* RSVP Status Tabs */}
        <div className="flex items-center gap-2 border-t border-[#EBE4DC] pt-3.5 overflow-x-auto scrollbar-none">
          {(
            [
              { key: 'ALL', label: 'All Guests', count: metrics.totalGuests },
              { key: 'PENDING', label: 'Pending', count: metrics.pendingRsvps },
              { key: 'ATTENDING', label: 'Attending', count: metrics.attendingGuests },
              { key: 'NOT_ATTENDING', label: 'Not Attending', count: metrics.notAttendingGuests },
            ] as const
          ).map((tab) => {
            const isActive = rsvpFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRsvpFilter(tab.key)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shrink-0 inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#8D493A] text-white shadow-xs'
                    : 'text-[#86736D] hover:text-[#1A1C18] hover:bg-[#FAF8F5]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#EBE4DC] text-[#6B5E59]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guest Roster Table / List */}
      <div className="bg-white rounded-2xl border border-[#EBE4DC] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 sm:p-16 text-center text-xs text-[#86736D]">
            <div className="w-8 h-8 border-2 border-[#8D493A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading guest roster...
          </div>
        ) : isError ? (
          <div className="p-12 sm:p-16 text-center space-y-3">
            <p className="text-xs text-[#C0392B]">Failed to load guests.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#FAF8F5] text-[#8D493A] border border-[#D5C9BE] hover:bg-[#F3ECE4] transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : guests.length === 0 ? (
          <div className="p-12 sm:p-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#EBE4DC] flex items-center justify-center mx-auto text-[#86736D]">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#1A1C18]">
                {metrics.totalGuests === 0 ? 'No guests added yet' : 'No matching guests found'}
              </h3>
              <p className="text-xs text-[#86736D] mt-1 max-w-sm mx-auto leading-relaxed">
                {metrics.totalGuests === 0
                  ? 'Add your friends and family to begin tracking party sizes, event access, and RSVP responses.'
                  : 'Try clearing your search query or switching your RSVP filters.'}
              </p>
            </div>
            {metrics.totalGuests === 0 && (
              <button
                type="button"
                onClick={() => {
                  setGuestToEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="mt-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#8D493A] hover:bg-[#72382B] text-white shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Your First Guest</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#EBE4DC] bg-[#FAF8F5] text-[11px] font-bold uppercase tracking-wider text-[#86736D]">
                  <th className="py-3.5 px-4 sm:px-6">Guest Name</th>
                  <th className="py-3.5 px-4 sm:px-6">Contact</th>
                  <th className="py-3.5 px-4 sm:px-6">RSVP Status</th>
                  <th className="py-3.5 px-4 sm:px-6">Party Size</th>
                  <th className="py-3.5 px-4 sm:px-6">Ceremonies</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE4DC]">
                {guests.map((guest) => {
                  const statusStyle = RSVP_STATUS_STYLES[guest.rsvpStatus];
                  const statusLabel = RSVP_STATUS_LABELS[guest.rsvpStatus];
                  const isCopied = copyFeedbackId === guest.id;

                  return (
                    <tr
                      key={guest.id}
                      className="hover:bg-[#FAF8F5]/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedGuestForDetail(guest)}
                    >
                      {/* Name */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-semibold text-[#1A1C18] flex items-center gap-1.5">
                          <span>{guest.name}</span>
                          {guest.invitationSentAt && (
                            <span
                              title={`Invitation sent on ${new Date(guest.invitationSentAt).toLocaleDateString()}`}
                              className="text-[#2E7D32]"
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        {guest.notes && (
                          <div className="text-[11px] text-[#86736D] truncate max-w-xs mt-0.5">
                            {guest.notes}
                          </div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4 sm:px-6 text-xs text-[#6B5E59]">
                        <div>{guest.email || <span className="text-[#86736D] italic">—</span>}</div>
                        {guest.phone && <div className="text-[11px] text-[#86736D] mt-0.5">{guest.phone}</div>}
                      </td>

                      {/* RSVP Badge */}
                      <td className="py-4 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          {statusLabel}
                        </span>
                        {guest.rsvpRespondedAt && (
                          <div className="text-[10px] text-[#86736D] mt-1">
                            {new Date(guest.rsvpRespondedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        )}
                      </td>

                      {/* Party Size */}
                      <td className="py-4 px-4 sm:px-6 text-xs text-[#1A1C18]">
                        <span className="font-medium">
                          {guest.rsvpStatus === 'ATTENDING'
                            ? `${guest.attendingCount} of ${guest.maxGuests}`
                            : `${guest.maxGuests} max`}
                        </span>
                      </td>

                      {/* Invited Ceremonies */}
                      <td className="py-4 px-4 sm:px-6">
                        {guest.invitedEvents && guest.invitedEvents.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {guest.invitedEvents.slice(0, 2).map((e) => (
                              <span
                                key={e.id}
                                className="px-2 py-0.5 text-[10px] rounded-md bg-[#F4EFEA] text-[#6B5E59] border border-[#E2D8CE] truncate max-w-[120px]"
                              >
                                {e.name}
                              </span>
                            ))}
                            {guest.invitedEvents.length > 2 && (
                              <span className="text-[10px] text-[#86736D] self-center">
                                +{guest.invitedEvents.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#86736D] italic">All Events</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-4 px-4 sm:px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(guest)}
                            title={isCopied ? 'Link Copied!' : 'Copy Personal Invitation Link'}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                              isCopied
                                ? 'bg-[#EDF7EE] text-[#2E7D32] border-[#C8E6C9]'
                                : 'bg-white text-[#86736D] hover:text-[#1A1C18] border-[#EBE4DC] hover:bg-[#FAF8F5]'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleWhatsAppShare(guest)}
                            title="Share on WhatsApp"
                            className="p-2 rounded-xl bg-white text-[#25D366] hover:bg-[#EDF7EE] border border-[#EBE4DC] transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.303c-.087.087-.177.182-.076.356.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086.159.058 1.011.477 1.184.564.173.087.289.13.332.202.043.073.043.419-.101.824z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(guest)}
                            title="Edit Guest"
                            className="p-2 rounded-xl bg-white text-[#86736D] hover:text-[#1A1C18] border border-[#EBE4DC] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <GuestModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setGuestToEdit(null);
        }}
        guestToEdit={guestToEdit}
      />

      <GuestDetailModal
        isOpen={Boolean(selectedGuestForDetail)}
        onClose={() => setSelectedGuestForDetail(null)}
        guest={selectedGuestForDetail}
        weddingTitle={weddingTitle}
        onEdit={(guest) => {
          setSelectedGuestForDetail(null);
          handleEdit(guest);
        }}
        onDelete={handleDelete}
      />

      <SendRemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        pendingGuestsCount={metrics.pendingRsvps}
      />
    </div>
  );
}

