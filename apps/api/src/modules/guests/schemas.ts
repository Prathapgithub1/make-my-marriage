import { z } from 'zod';
import { RsvpStatus } from '../../generated/prisma/client';

export const rsvpStatusSchema = z.enum([
  RsvpStatus.PENDING,
  RsvpStatus.ATTENDING,
  RsvpStatus.NOT_ATTENDING,
]);

export const createGuestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Guest name is required')
    .max(160, 'Guest name cannot exceed 160 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(320, 'Email cannot exceed 320 characters')
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  phone: z
    .string()
    .trim()
    .max(32, 'Phone cannot exceed 32 characters')
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  maxGuests: z.coerce
    .number()
    .int('Maximum guests must be a whole number')
    .min(1, 'Maximum guests must be at least 1')
    .max(10000, 'Maximum guests cannot exceed 10,000')
    .default(1),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  invitedEventIds: z.array(z.string().uuid('Invalid event ID')).max(100).default([]),
});

export const updateGuestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Guest name cannot be blank')
      .max(160, 'Guest name cannot exceed 160 characters')
      .optional(),
    email: z
      .string()
      .trim()
      .email('Invalid email address')
      .max(320, 'Email cannot exceed 320 characters')
      .optional()
      .nullable()
      .or(z.literal('').transform(() => null)),
    phone: z
      .string()
      .trim()
      .max(32, 'Phone cannot exceed 32 characters')
      .optional()
      .nullable()
      .or(z.literal('').transform(() => null)),
    maxGuests: z.coerce
      .number()
      .int('Maximum guests must be a whole number')
      .min(1, 'Maximum guests must be at least 1')
      .max(10000, 'Maximum guests cannot exceed 10,000')
      .optional(),
    rsvpStatus: rsvpStatusSchema.optional(),
    attendingCount: z.coerce
      .number()
      .int('Attending count must be a whole number')
      .min(0, 'Attending count cannot be negative')
      .max(10000, 'Attending count cannot exceed 10,000')
      .optional(),
    notes: z
      .string()
      .trim()
      .max(2000, 'Notes cannot exceed 2000 characters')
      .optional()
      .nullable()
      .or(z.literal('').transform(() => null)),
    invitedEventIds: z.array(z.string().uuid('Invalid event ID')).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listGuestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  rsvpStatus: z.enum(['ALL', 'PENDING', 'ATTENDING', 'NOT_ATTENDING']).optional(),
  eventId: z.string().uuid('Invalid event ID').optional(),
  invitationSent: z
    .enum(['true', 'false', 'all'])
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  sortBy: z.enum(['name', 'createdAt', 'rsvpStatus', 'attendingCount']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const submitRsvpSchema = z
  .object({
    rsvpStatus: z.enum([RsvpStatus.ATTENDING, RsvpStatus.NOT_ATTENDING]),
    attendingCount: z.coerce.number().int().min(0).max(10000).default(1),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.rsvpStatus === RsvpStatus.NOT_ATTENDING) {
        return true;
      }
      return data.attendingCount >= 1;
    },
    {
      message: 'Attending headcount must be at least 1 when attending',
      path: ['attendingCount'],
    },
  );

export const sendRemindersPayloadSchema = z.object({
  scope: z.enum(['ALL_PENDING', 'SELECTED']).default('ALL_PENDING'),
  guestIds: z.array(z.string().uuid('Invalid guest ID')).max(500).optional(),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type ListGuestsQuery = z.infer<typeof listGuestsQuerySchema>;
export type SubmitRsvpInput = z.infer<typeof submitRsvpSchema>;
export type SendRemindersPayload = z.infer<typeof sendRemindersPayloadSchema>;

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

