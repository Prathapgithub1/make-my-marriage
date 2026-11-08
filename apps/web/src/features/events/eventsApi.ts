import { apiRequest } from '../../lib/api-client';

export type EventStatus = 'PLANNED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface WeddingEvent {
  id: string;
  weddingId: string;
  name: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  venueName: string | null;
  venueAddress: string | null;
  dressCode: string | null;
  coverImageKey: string | null;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EventMetrics {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

export interface EventsListResponse {
  events: WeddingEvent[];
  metrics: EventMetrics;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateEventInput {
  name: string;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  dressCode?: string | null;
  coverImageKey?: string | null;
  status?: EventStatus;
}

export type UpdateEventInput = Partial<CreateEventInput>;

export interface ListEventsQuery {
  page?: number;
  limit?: number;
  status?: EventStatus;
  search?: string;
  sortBy?: 'startsAt' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

type Envelope<T> = { data: T; requestId?: string };

export const EVENT_NAME_PRESETS = [
  'Roka',
  'Engagement',
  'Mehendi',
  'Haldi',
  'Sangeet',
  'Cocktail',
  'Wedding',
  'Reception',
] as const;

export const DRESS_CODE_SUGGESTIONS = [
  'Traditional Indian / Ethnic Formal',
  'Yellow Festive / Kurta / Lehenga',
  'Indo-Western / Glamorous Festive',
  'Cocktail Chic / Tuxedo & Evening Gown',
  'Royal Traditional / Sherwani & Bridal Red',
  'Smart Casual & Breezy',
  'Pastel Elegant',
] as const;

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  PLANNED: 'Planned',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const EVENT_STATUS_STYLES: Record<EventStatus, { badge: string; dot: string }> = {
  PLANNED: {
    badge: 'bg-[#f4ede6] text-[#8a4b35] border-[#e7d5c9]',
    dot: 'bg-[#8a4b35]',
  },
  CONFIRMED: {
    badge: 'bg-[#d9e7d2] text-[#3e4a3b] border-[#c0d6b6]',
    dot: 'bg-[#556251]',
  },
  COMPLETED: {
    badge: 'bg-[#e2e8f0] text-[#334155] border-[#cbd5e1]',
    dot: 'bg-[#64748b]',
  },
  CANCELLED: {
    badge: 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]',
    dot: 'bg-[#ef4444]',
  },
};

export const CURATED_COVER_PRESETS = [
  {
    label: 'Ceremony / Mandap',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Mehendi & Floral',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Sangeet & Celebration',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Haldi Sunlight',
    url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Reception & Elegance',
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Cocktail & Evening',
    url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
  },
];

export type EventsListApiResponse = {
  data: WeddingEvent[];
  metrics?: EventMetrics;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  requestId?: string;
};

export async function listEvents(query: ListEventsQuery = {}): Promise<EventsListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.status) params.set('status', query.status);
  if (query.search) params.set('search', query.search);
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);

  const qs = params.toString();
  const path = qs ? `events?${qs}` : 'events';
  const response = await apiRequest<EventsListApiResponse>(path);

  const rawData = response?.data as unknown;
  const events: WeddingEvent[] = Array.isArray(rawData)
    ? (rawData as WeddingEvent[])
    : Array.isArray((response as unknown as { events?: WeddingEvent[] })?.events)
      ? (response as unknown as { events: WeddingEvent[] }).events
      : Array.isArray((rawData as { events?: WeddingEvent[] })?.events)
        ? (rawData as { events: WeddingEvent[] }).events
        : [];

  const metrics: EventMetrics = response?.metrics ??
    (rawData as { metrics?: EventMetrics })?.metrics ?? {
      total: events.length,
      upcoming: events.filter((e) => e.status === 'CONFIRMED' || e.status === 'PLANNED').length,
      completed: events.filter((e) => e.status === 'COMPLETED').length,
      cancelled: events.filter((e) => e.status === 'CANCELLED').length,
    };

  const pagination = response?.pagination ??
    (rawData as { pagination?: EventsListResponse['pagination'] })?.pagination ?? {
      page: 1,
      limit: 50,
      total: events.length,
      totalPages: 1,
    };

  return { events, metrics, pagination };
}

export async function getEvent(eventId: string): Promise<WeddingEvent> {
  const response = await apiRequest<Envelope<WeddingEvent>>(`events/${eventId}`);
  return response.data;
}

export async function createEvent(input: CreateEventInput): Promise<WeddingEvent> {
  const response = await apiRequest<Envelope<WeddingEvent>>('events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updateEvent(eventId: string, input: UpdateEventInput): Promise<WeddingEvent> {
  const response = await apiRequest<Envelope<WeddingEvent>>(`events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function deleteEvent(
  eventId: string,
): Promise<{ success: boolean; id: string; message: string }> {
  const response = await apiRequest<Envelope<{ success: boolean; id: string; message: string }>>(
    `events/${eventId}`,
    {
      method: 'DELETE',
    },
  );
  return response.data;
}
