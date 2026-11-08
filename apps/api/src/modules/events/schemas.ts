import { z } from 'zod';
import { EventStatus } from '../../generated/prisma/client';

export const eventStatusSchema = z.enum([
  EventStatus.PLANNED,
  EventStatus.CONFIRMED,
  EventStatus.COMPLETED,
  EventStatus.CANCELLED,
]);

function isValidIsoDate(val: string | null | undefined): boolean {
  if (!val) return true;
  const d = new Date(val);
  return !isNaN(d.getTime());
}

export const createEventSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Event name cannot be blank')
      .max(160, 'Event name cannot exceed 160 characters'),
    description: z
      .string()
      .trim()
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional()
      .nullable(),
    startsAt: z
      .string()
      .trim()
      .refine(isValidIsoDate, { message: 'Start time must be a valid ISO date-time' })
      .optional()
      .nullable(),
    endsAt: z
      .string()
      .trim()
      .refine(isValidIsoDate, { message: 'End time must be a valid ISO date-time' })
      .optional()
      .nullable(),
    venueName: z
      .string()
      .trim()
      .max(200, 'Venue name cannot exceed 200 characters')
      .optional()
      .nullable(),
    venueAddress: z
      .string()
      .trim()
      .max(500, 'Venue address cannot exceed 500 characters')
      .optional()
      .nullable(),
    address: z
      .string()
      .trim()
      .max(500, 'Venue address cannot exceed 500 characters')
      .optional()
      .nullable(),
    dressCode: z
      .string()
      .trim()
      .max(120, 'Dress code cannot exceed 120 characters')
      .optional()
      .nullable(),
    coverImageKey: z
      .string()
      .trim()
      .max(1024, 'Cover image key cannot exceed 1024 characters')
      .optional()
      .nullable(),
    status: eventStatusSchema.default(EventStatus.PLANNED),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt).getTime() >= new Date(data.startsAt).getTime();
      }
      return true;
    },
    {
      message: 'End time cannot be earlier than start time',
      path: ['endsAt'],
    },
  );

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Event name cannot be blank')
      .max(160, 'Event name cannot exceed 160 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional()
      .nullable(),
    startsAt: z
      .string()
      .trim()
      .refine(isValidIsoDate, { message: 'Start time must be a valid ISO date-time' })
      .optional()
      .nullable(),
    endsAt: z
      .string()
      .trim()
      .refine(isValidIsoDate, { message: 'End time must be a valid ISO date-time' })
      .optional()
      .nullable(),
    venueName: z
      .string()
      .trim()
      .max(200, 'Venue name cannot exceed 200 characters')
      .optional()
      .nullable(),
    venueAddress: z
      .string()
      .trim()
      .max(500, 'Venue address cannot exceed 500 characters')
      .optional()
      .nullable(),
    address: z
      .string()
      .trim()
      .max(500, 'Venue address cannot exceed 500 characters')
      .optional()
      .nullable(),
    dressCode: z
      .string()
      .trim()
      .max(120, 'Dress code cannot exceed 120 characters')
      .optional()
      .nullable(),
    coverImageKey: z
      .string()
      .trim()
      .max(1024, 'Cover image key cannot exceed 1024 characters')
      .optional()
      .nullable(),
    status: eventStatusSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt).getTime() >= new Date(data.startsAt).getTime();
      }
      return true;
    },
    {
      message: 'End time cannot be earlier than start time',
      path: ['endsAt'],
    },
  );

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const listEventsQuerySchema = z.object({
  status: eventStatusSchema.optional(),
  from: z.string().trim().refine(isValidIsoDate, { message: 'Invalid from date' }).optional(),
  to: z.string().trim().refine(isValidIsoDate, { message: 'Invalid to date' }).optional(),
  search: z.string().trim().max(100).optional(),
  includeCancelled: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .optional()
    .transform((val) => val === true || val === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(['startsAt', 'name', 'createdAt', 'status']).default('startsAt'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

export type EventSummary = {
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
  guestCount?: number;
  taskCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type EventMetrics = {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
};

export type EventsListResponse = {
  events: EventSummary[];
  metrics: EventMetrics;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
