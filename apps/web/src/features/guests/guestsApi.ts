import { apiRequest } from '../../lib/api-client';

export type RsvpStatus = 'PENDING' | 'ATTENDING' | 'NOT_ATTENDING';

export interface GuestSummary {
  id: string;
  weddingId: string;
  name: string;
  email: string | null;
  phone: string | null;
  maxGuests: number;
  rsvpStatus: RsvpStatus;
  attendingCount: number;
  rsvpRespondedAt: string | null;
  invitationToken: string | null;
  invitationSentAt: string | null;
  lastReminderSentAt: string | null;
  reminderCount: number;
  notes: string | null;
  invitedEvents: Array<{
    id: string;
    name: string;
    startsAt: string | null;
    venueName: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface GuestDashboardMetrics {
  totalGuests: number;
  pendingRsvps: number;
  attendingGuests: number;
  notAttendingGuests: number;
  expectedAttendeeCount: number;
  invitationsSentCount: number;
}

export interface GuestsListResponse {
  data: GuestSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metrics: GuestDashboardMetrics;
}

export interface ListGuestsParams {
  page?: number;
  limit?: number;
  search?: string;
  rsvpStatus?: RsvpStatus | 'ALL';
  eventId?: string;
  invitationSent?: 'true' | 'false' | 'all';
  sortBy?: 'name' | 'createdAt' | 'rsvpStatus' | 'attendingCount';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateGuestPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  maxGuests?: number;
  notes?: string | null;
  invitedEventIds?: string[];
}

export interface UpdateGuestPayload {
  name?: string;
  email?: string | null;
  phone?: string | null;
  maxGuests?: number;
  rsvpStatus?: RsvpStatus;
  attendingCount?: number;
  notes?: string | null;
  invitedEventIds?: string[];
}

export interface PublicInvitationSummary {
  guest: {
    name: string;
    maxGuests: number;
    rsvpStatus: RsvpStatus;
    attendingCount: number;
    rsvpRespondedAt: string | null;
  };
  wedding: {
    id: string;
    title: string;
    brideName: string;
    groomName: string;
    weddingDate: string | null;
    location: string | null;
    city: string | null;
    state: string | null;
    description: string | null;
  };
  invitedEvents: Array<{
    id: string;
    name: string;
    description: string | null;
    startsAt: string | null;
    endsAt: string | null;
    venueName: string | null;
    venueAddress: string | null;
    dressCode: string | null;
  }>;
}

export interface SubmitRsvpPayload {
  rsvpStatus: 'ATTENDING' | 'NOT_ATTENDING';
  attendingCount: number;
  notes?: string | null;
}

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  PENDING: 'Pending',
  ATTENDING: 'Attending',
  NOT_ATTENDING: 'Not Attending',
};

export const RSVP_STATUS_STYLES: Record<
  RsvpStatus,
  { bg: string; text: string; dot: string; border: string }
> = {
  PENDING: {
    bg: 'bg-[#FEF6E6]',
    text: 'text-[#B7791F]',
    dot: 'bg-[#B7791F]',
    border: 'border-[#FDE8C0]',
  },
  ATTENDING: {
    bg: 'bg-[#EDF7EE]',
    text: 'text-[#2E7D32]',
    dot: 'bg-[#4CAF50]',
    border: 'border-[#C8E6C9]',
  },
  NOT_ATTENDING: {
    bg: 'bg-[#FDF2F2]',
    text: 'text-[#C0392B]',
    dot: 'bg-[#E53935]',
    border: 'border-[#FADBD8]',
  },
};

export function getWhatsAppShareUrl(
  guestName: string,
  weddingTitle: string,
  inviteUrl: string,
): string {
  const message = `Namaste ${guestName}! 🙏 You are warmly invited to celebrate with us for ${weddingTitle}.\n\nPlease view your personal invitation and RSVP here:\n${inviteUrl}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

export async function listGuests(params: ListGuestsParams = {}): Promise<GuestsListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search) query.set('search', params.search);
  if (params.rsvpStatus && params.rsvpStatus !== 'ALL') query.set('rsvpStatus', params.rsvpStatus);
  if (params.eventId) query.set('eventId', params.eventId);
  if (params.invitationSent && params.invitationSent !== 'all') {
    query.set('invitationSent', params.invitationSent);
  }
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const qs = query.toString();
  const res = await apiRequest<{
    data: GuestSummary[];
    pagination: GuestsListResponse['pagination'];
    metrics: GuestDashboardMetrics;
  }>(`/guests${qs ? `?${qs}` : ''}`);

  return {
    data: res.data ?? [],
    pagination: res.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 },
    metrics: res.metrics ?? {
      totalGuests: 0,
      pendingRsvps: 0,
      attendingGuests: 0,
      notAttendingGuests: 0,
      expectedAttendeeCount: 0,
      invitationsSentCount: 0,
    },
  };
}

export async function getGuestById(guestId: string): Promise<GuestSummary> {
  const res = await apiRequest<{ data: GuestSummary }>(`/guests/${guestId}`);
  return res.data;
}

export async function createGuest(input: CreateGuestPayload): Promise<GuestSummary> {
  const res = await apiRequest<{ data: GuestSummary }>('/guests', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateGuest(guestId: string, input: UpdateGuestPayload): Promise<GuestSummary> {
  const res = await apiRequest<{ data: GuestSummary }>(`/guests/${guestId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function deleteGuest(guestId: string): Promise<{ success: true; id: string }> {
  const res = await apiRequest<{ data: { success: true; id: string } }>(`/guests/${guestId}`, {
    method: 'DELETE',
  });
  return res.data;
}

export async function getGuestDashboard(): Promise<GuestDashboardMetrics> {
  const res = await apiRequest<{ data: GuestDashboardMetrics }>('/guests/dashboard');
  return res.data;
}

export async function getInvitationLink(
  guestId: string,
): Promise<{ url: string; token: string; guestId: string; guestName: string }> {
  const res = await apiRequest<{
    data: { url: string; token: string; guestId: string; guestName: string };
  }>(`/guests/${guestId}/invitation-link`);
  return res.data;
}

export async function sendGuestInvitation(
  guestId: string,
): Promise<{ success: true; delivered: boolean; error?: string }> {
  const res = await apiRequest<{
    data: { success: true; delivered: boolean; error?: string };
  }>(`/guests/${guestId}/invitation/send`, {
    method: 'POST',
  });
  return res.data;
}

export async function resendGuestInvitation(
  guestId: string,
): Promise<{ success: true; delivered: boolean; error?: string }> {
  const res = await apiRequest<{
    data: { success: true; delivered: boolean; error?: string };
  }>(`/guests/${guestId}/invitation/resend`, {
    method: 'POST',
  });
  return res.data;
}

export async function revokeGuestInvitation(
  guestId: string,
): Promise<{ success: true; message: string }> {
  const res = await apiRequest<{
    data: { success: true; message: string };
  }>(`/guests/${guestId}/invitation/revoke`, {
    method: 'POST',
  });
  return res.data;
}

export async function sendGuestReminders(payload: {
  scope: 'ALL_PENDING' | 'SELECTED';
  guestIds?: string[];
}): Promise<{ totalEligible: number; totalSent: number; totalFailed: number }> {
  const res = await apiRequest<{
    data: { totalEligible: number; totalSent: number; totalFailed: number };
  }>('/guests/reminders/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function getPublicInvitation(token: string): Promise<PublicInvitationSummary> {
  const res = await apiRequest<{ data: PublicInvitationSummary }>(`/public/invitations/${token}`);
  return res.data;
}

export async function submitPublicRsvp(
  token: string,
  payload: SubmitRsvpPayload,
): Promise<PublicInvitationSummary> {
  const res = await apiRequest<{ data: PublicInvitationSummary }>(
    `/public/invitations/${token}/rsvp`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return res.data;
}

