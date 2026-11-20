import { randomBytes } from 'node:crypto';
import type { PrismaClient } from '../../generated/prisma/client';
import { RsvpStatus } from '../../generated/prisma/client';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/app-error';
import { hashToken } from '../auth/security';
import type {
  CreateGuestInput,
  UpdateGuestInput,
  ListGuestsQuery,
  SubmitRsvpInput,
  SendRemindersPayload,
  GuestSummary,
  GuestDashboardMetrics,
  PublicInvitationSummary,
} from './schemas';

export interface EmailDeliveryResult {
  delivered: boolean;
  error?: string;
  resendMessageId?: string;
}

export interface GuestsMailer {
  sendInvitationEmail(options: {
    toEmail: string;
    guestName: string;
    weddingTitle: string;
    brideName: string;
    groomName: string;
    weddingDate: string | null;
    inviteUrl: string;
    maxGuests: number;
  }): Promise<EmailDeliveryResult>;

  sendReminderEmail(options: {
    toEmail: string;
    guestName: string;
    weddingTitle: string;
    brideName: string;
    groomName: string;
    weddingDate: string | null;
    inviteUrl: string;
  }): Promise<EmailDeliveryResult>;
}

export function createResendGuestsMailer(): GuestsMailer {
  const rawFromEmail = env.EMAIL_FROM ?? env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  const isPersonalDomain = /@(gmail|yahoo|hotmail|outlook)\.com$/i.test(rawFromEmail);
  const fromEmail = isPersonalDomain ? 'onboarding@resend.dev' : rawFromEmail;

  return {
    async sendInvitationEmail({
      toEmail,
      guestName,
      weddingTitle,
      brideName,
      groomName,
      weddingDate,
      inviteUrl,
      maxGuests,
    }): Promise<EmailDeliveryResult> {
      if (!env.RESEND_API_KEY || !fromEmail) {
        logger.info(
          { toEmail, guestName, weddingTitle, inviteUrl },
          'Resend API key not configured. Logged wedding guest invitation in development.',
        );
        console.log('\n================================================================');
        console.log(`[GUEST INVITATION - DEV MODE] Recipient: ${guestName} <${toEmail}>`);
        console.log(`Wedding: ${weddingTitle} (${brideName} & ${groomName})`);
        console.log(`Max Party Capacity: ${maxGuests}`);
        console.log(`Invitation Link: ${inviteUrl}`);
        console.log('Notice: RESEND_API_KEY is not configured in .env.');
        console.log('================================================================\n');
        return {
          delivered: false,
          error: 'Resend API key not configured in environment.',
        };
      }

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            subject: `Wedding Invitation: Celebrate with ${brideName} & ${groomName}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 18px; color: #2e302d; line-height: 1.6; background-color: #fafaf3;">
                <div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #eae6e1; padding: 36px 24px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                  <div style="margin-bottom: 20px;">
                    <span style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background: #851321; color: #ffffff; font-weight: 700; font-size: 22px; font-family: serif;">M</span>
                  </div>
                  <h1 style="font-family: serif; font-size: 28px; font-weight: 700; color: #1c1d1b; margin: 0 0 8px 0; letter-spacing: -0.5px;">${brideName} &amp; ${groomName}</h1>
                  <p style="text-transform: uppercase; letter-spacing: 2px; font-size: 11px; font-weight: 700; color: #8d493a; margin: 0 0 20px 0;">Wedding Celebration</p>
                  
                  <div style="width: 40px; height: 2px; background-color: #8d493a; margin: 0 auto 24px auto;"></div>

                  <p style="margin: 0 0 16px 0; font-size: 16px; color: #484b47;">
                    Dear <strong>${guestName}</strong>,
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 15px; color: #484b47; line-height: 1.7;">
                    We warmly invite you and your family to celebrate our special wedding moments with us. Your presence and blessings will mean the world to our families.
                  </p>

                  ${
                    weddingDate
                      ? `<div style="background: #fdfaf6; border: 1px solid #f2e7db; border-radius: 12px; padding: 14px; margin: 20px 0; display: inline-block; min-width: 200px;">
                          <span style="display: block; font-size: 11px; text-transform: uppercase; color: #86736d; font-weight: 600;">Ceremony Date</span>
                          <span style="font-size: 16px; font-weight: 700; color: #1a1c18;">${weddingDate}</span>
                        </div>`
                      : ''
                  }

                  <div style="margin: 28px 0;">
                    <a href="${inviteUrl}" style="background-color: #851321; color: #ffffff; padding: 14px 34px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 3px 10px rgba(133, 19, 33, 0.25);">View Invitation &amp; RSVP</a>
                  </div>

                  <p style="margin: 0 0 6px 0; font-size: 13px; color: #767974;">
                    Invitation reserved for up to <strong>${maxGuests}</strong> ${maxGuests === 1 ? 'guest' : 'guests'}.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #a4a7a1; word-break: break-all;">
                    Or paste this link into your browser: <a href="${inviteUrl}" style="color: #851321;">${inviteUrl}</a>
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          logger.error({ status: response.status, body: errBody }, 'Resend API returned error for guest invitation');
          return {
            delivered: false,
            error: `Email provider returned HTTP ${response.status}`,
          };
        }

        const data = (await response.json()) as { id?: string };
        return { delivered: true, resendMessageId: data?.id };
      } catch (err) {
        logger.error({ err }, 'Network error communicating with Resend for guest invitation');
        return {
          delivered: false,
          error: err instanceof Error ? err.message : 'Unknown network error',
        };
      }
    },

    async sendReminderEmail({
      toEmail,
      guestName,
      weddingTitle,
      brideName,
      groomName,
      weddingDate,
      inviteUrl,
    }): Promise<EmailDeliveryResult> {
      if (!env.RESEND_API_KEY || !fromEmail) {
        logger.info(
          { toEmail, guestName, weddingTitle, inviteUrl },
          'Resend API key not configured. Logged RSVP reminder in development.',
        );
        console.log(`[RSVP REMINDER - DEV MODE] To: ${guestName} <${toEmail}> | Link: ${inviteUrl}`);
        return {
          delivered: false,
          error: 'Resend API key not configured in environment.',
        };
      }

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            subject: `Friendly RSVP Reminder: ${brideName} & ${groomName}'s Wedding`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 18px; color: #2e302d; line-height: 1.6; background-color: #fafaf3;">
                <div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #eae6e1; padding: 36px 24px; text-align: center;">
                  <h2 style="font-family: serif; font-size: 24px; color: #1c1d1b; margin: 0 0 12px 0;">RSVP Reminder</h2>
                  <p style="margin: 0 0 16px 0; font-size: 15px; color: #484b47;">
                    Dear <strong>${guestName}</strong>,
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 15px; color: #484b47;">
                    We are finalizing catering and event seating for <strong>${weddingTitle}</strong> (${brideName} &amp; ${groomName}). Please take a moment to confirm your attendance so we can make proper arrangements for you.
                  </p>
                  <div style="margin: 28px 0;">
                    <a href="${inviteUrl}" style="background-color: #851321; color: #ffffff; padding: 13px 30px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">Confirm RSVP</a>
                  </div>
                  <p style="margin: 0; font-size: 12px; color: #a4a7a1;">
                    Link: <a href="${inviteUrl}" style="color: #851321;">${inviteUrl}</a>
                  </p>
                </div>
              </div>
            `,
          }),
        });

        if (!response.ok) {
          return {
            delivered: false,
            error: `Email provider returned HTTP ${response.status}`,
          };
        }

        const data = (await response.json()) as { id?: string };
        return { delivered: true, resendMessageId: data?.id };
      } catch (err) {
        return {
          delivered: false,
          error: err instanceof Error ? err.message : 'Unknown network error',
        };
      }
    },
  };
}

export interface GuestsServiceOperations {
  createGuest(userId: string, input: CreateGuestInput): Promise<GuestSummary>;
  listGuests(
    userId: string,
    query: ListGuestsQuery,
  ): Promise<{
    data: GuestSummary[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    metrics: GuestDashboardMetrics;
  }>;
  getGuestById(userId: string, guestId: string): Promise<GuestSummary>;
  updateGuest(userId: string, guestId: string, input: UpdateGuestInput): Promise<GuestSummary>;
  deleteGuest(
    userId: string,
    guestId: string,
  ): Promise<{ success: true; id: string; message: string }>;
  getGuestDashboard(userId: string): Promise<GuestDashboardMetrics>;
  getInvitationLink(
    userId: string,
    guestId: string,
  ): Promise<{ url: string; token: string; guestId: string; guestName: string }>;
  sendInvitation(
    userId: string,
    guestId: string,
  ): Promise<{ success: true; delivered: boolean; error?: string }>;
  resendInvitation(
    userId: string,
    guestId: string,
  ): Promise<{ success: true; delivered: boolean; error?: string }>;
  revokeInvitation(
    userId: string,
    guestId: string,
  ): Promise<{ success: true; message: string }>;
  sendReminders(
    userId: string,
    payload: SendRemindersPayload,
  ): Promise<{ totalEligible: number; totalSent: number; totalFailed: number }>;
  getPublicInvitation(token: string): Promise<PublicInvitationSummary>;
  submitPublicRsvp(token: string, input: SubmitRsvpInput): Promise<PublicInvitationSummary>;
}

export function createGuestsService(
  databaseClient?: PrismaClient | null,
  mailer: GuestsMailer = createResendGuestsMailer(),
): GuestsServiceOperations {
  function requireDatabase(): PrismaClient {
    if (!databaseClient) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Database client is not available.');
    }
    return databaseClient;
  }

  async function resolveWedding(database: PrismaClient, userId: string): Promise<string> {
    const membership = await database.weddingMembership.findUnique({
      where: { userId },
      select: { weddingId: true },
    });

    if (!membership) {
      throw new AppError(404, 'NOT_FOUND', 'You do not belong to a wedding workspace.');
    }

    return membership.weddingId;
  }

  function getBaseAppUrl(): string {
    return env.APP_BASE_URL ?? env.WEB_ORIGIN ?? 'http://localhost:1234';
  }

  function generateSecureToken(): { token: string; tokenHash: string } {
    const token = randomBytes(24).toString('base64url');
    const tokenHash = hashToken(token);
    return { token, tokenHash };
  }

  return {
    async createGuest(userId: string, input: CreateGuestInput): Promise<GuestSummary> {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      // Validate event ownership if events are provided
      if (input.invitedEventIds && input.invitedEventIds.length > 0) {
        const events = await database.event.findMany({
          where: {
            id: { in: input.invitedEventIds },
            weddingId,
          },
          select: { id: true },
        });

        if (events.length !== input.invitedEventIds.length) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'One or more selected events do not belong to your wedding workspace.',
            { invitedEventIds: 'Invalid event association' },
          );
        }
      }

      const { token, tokenHash } = generateSecureToken();

      const guest = await database.guest.create({
        data: {
          weddingId,
          name: input.name.trim(),
          email: input.email?.trim().toLowerCase() || null,
          phone: input.phone?.trim() || null,
          maxGuests: input.maxGuests,
          notes: input.notes?.trim() || null,
          rsvpStatus: RsvpStatus.PENDING,
          attendingCount: 0,
          invitationToken: token,
          invitationTokenHash: tokenHash,
          guestEvents: input.invitedEventIds && input.invitedEventIds.length > 0
            ? {
                create: input.invitedEventIds.map((eventId) => ({
                  eventId,
                })),
              }
            : undefined,
        },
        include: {
          guestEvents: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  startsAt: true,
                  venueName: true,
                },
              },
            },
          },
        },
      });

      return {
        id: guest.id,
        weddingId: guest.weddingId,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        maxGuests: guest.maxGuests,
        rsvpStatus: guest.rsvpStatus,
        attendingCount: guest.attendingCount,
        rsvpRespondedAt: guest.rsvpRespondedAt ? guest.rsvpRespondedAt.toISOString() : null,
        invitationToken: guest.invitationToken,
        invitationSentAt: guest.invitationSentAt ? guest.invitationSentAt.toISOString() : null,
        lastReminderSentAt: guest.lastReminderSentAt ? guest.lastReminderSentAt.toISOString() : null,
        reminderCount: guest.reminderCount,
        notes: guest.notes,
        invitedEvents: guest.guestEvents.map((ge) => ({
          id: ge.event.id,
          name: ge.event.name,
          startsAt: ge.event.startsAt ? ge.event.startsAt.toISOString() : null,
          venueName: ge.event.venueName,
        })),
        createdAt: guest.createdAt.toISOString(),
        updatedAt: guest.updatedAt.toISOString(),
      };
    },

    async listGuests(userId: string, query: ListGuestsQuery) {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const where: Record<string, unknown> = { weddingId };

      if (query.rsvpStatus && query.rsvpStatus !== 'ALL') {
        where.rsvpStatus = query.rsvpStatus;
      }

      if (query.eventId) {
        where.guestEvents = {
          some: { eventId: query.eventId },
        };
      }

      if (query.invitationSent !== undefined) {
        where.invitationSentAt = query.invitationSent ? { not: null } : null;
      }

      if (query.search) {
        const searchTerm = query.search.trim();
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      const page = Math.max(1, query.page);
      const limit = Math.max(1, Math.min(100, query.limit));
      const skip = (page - 1) * limit;

      const [total, guests, allWeddingGuests] = await Promise.all([
        database.guest.count({ where }),
        database.guest.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ [query.sortBy]: query.sortOrder }, { createdAt: 'desc' }],
          include: {
            guestEvents: {
              include: {
                event: {
                  select: {
                    id: true,
                    name: true,
                    startsAt: true,
                    venueName: true,
                  },
                },
              },
            },
          },
        }),
        database.guest.findMany({
          where: { weddingId },
          select: {
            rsvpStatus: true,
            attendingCount: true,
            invitationSentAt: true,
          },
        }),
      ]);

      const metrics: GuestDashboardMetrics = {
        totalGuests: allWeddingGuests.length,
        pendingRsvps: allWeddingGuests.filter((g) => g.rsvpStatus === RsvpStatus.PENDING).length,
        attendingGuests: allWeddingGuests.filter((g) => g.rsvpStatus === RsvpStatus.ATTENDING).length,
        notAttendingGuests: allWeddingGuests.filter((g) => g.rsvpStatus === RsvpStatus.NOT_ATTENDING).length,
        expectedAttendeeCount: allWeddingGuests
          .filter((g) => g.rsvpStatus === RsvpStatus.ATTENDING)
          .reduce((sum, g) => sum + g.attendingCount, 0),
        invitationsSentCount: allWeddingGuests.filter((g) => g.invitationSentAt !== null).length,
      };

      const data: GuestSummary[] = guests.map((guest) => ({
        id: guest.id,
        weddingId: guest.weddingId,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        maxGuests: guest.maxGuests,
        rsvpStatus: guest.rsvpStatus,
        attendingCount: guest.attendingCount,
        rsvpRespondedAt: guest.rsvpRespondedAt ? guest.rsvpRespondedAt.toISOString() : null,
        invitationToken: guest.invitationToken,
        invitationSentAt: guest.invitationSentAt ? guest.invitationSentAt.toISOString() : null,
        lastReminderSentAt: guest.lastReminderSentAt ? guest.lastReminderSentAt.toISOString() : null,
        reminderCount: guest.reminderCount,
        notes: guest.notes,
        invitedEvents: guest.guestEvents.map((ge) => ({
          id: ge.event.id,
          name: ge.event.name,
          startsAt: ge.event.startsAt ? ge.event.startsAt.toISOString() : null,
          venueName: ge.event.venueName,
        })),
        createdAt: guest.createdAt.toISOString(),
        updatedAt: guest.updatedAt.toISOString(),
      }));

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
        metrics,
      };
    },

    async getGuestById(userId: string, guestId: string): Promise<GuestSummary> {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const guest = await database.guest.findFirst({
        where: { id: guestId, weddingId },
        include: {
          guestEvents: {
            include: {
              event: {
                select: {
                  id: true,
                  name: true,
                  startsAt: true,
                  venueName: true,
                },
              },
            },
          },
        },
      });

      if (!guest) {
        throw new AppError(404, 'NOT_FOUND', 'Guest not found.');
      }

      return {
        id: guest.id,
        weddingId: guest.weddingId,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        maxGuests: guest.maxGuests,
        rsvpStatus: guest.rsvpStatus,
        attendingCount: guest.attendingCount,
        rsvpRespondedAt: guest.rsvpRespondedAt ? guest.rsvpRespondedAt.toISOString() : null,
        invitationToken: guest.invitationToken,
        invitationSentAt: guest.invitationSentAt ? guest.invitationSentAt.toISOString() : null,
        lastReminderSentAt: guest.lastReminderSentAt ? guest.lastReminderSentAt.toISOString() : null,
        reminderCount: guest.reminderCount,
        notes: guest.notes,
        invitedEvents: guest.guestEvents.map((ge) => ({
          id: ge.event.id,
          name: ge.event.name,
          startsAt: ge.event.startsAt ? ge.event.startsAt.toISOString() : null,
          venueName: ge.event.venueName,
        })),
        createdAt: guest.createdAt.toISOString(),
        updatedAt: guest.updatedAt.toISOString(),
      };
    },

    async updateGuest(userId: string, guestId: string, input: UpdateGuestInput): Promise<GuestSummary> {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const existing = await database.guest.findFirst({
        where: { id: guestId, weddingId },
      });

      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Guest not found.');
      }

      const effectiveMaxGuests = input.maxGuests ?? existing.maxGuests;
      const effectiveAttending = input.attendingCount ?? existing.attendingCount;

      if (effectiveAttending > effectiveMaxGuests) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          `Attending count (${effectiveAttending}) cannot exceed maximum allowed guests (${effectiveMaxGuests}).`,
          { maxGuests: 'Capacity cannot be less than attending count' },
        );
      }

      // If updating invited events, validate ownership
      if (input.invitedEventIds !== undefined) {
        if (input.invitedEventIds.length > 0) {
          const events = await database.event.findMany({
            where: {
              id: { in: input.invitedEventIds },
              weddingId,
            },
            select: { id: true },
          });

          if (events.length !== input.invitedEventIds.length) {
            throw new AppError(
              400,
              'VALIDATION_ERROR',
              'One or more selected events do not belong to your wedding workspace.',
              { invitedEventIds: 'Invalid event association' },
            );
          }
        }
      }

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name.trim();
      if (input.email !== undefined) updateData.email = input.email?.trim().toLowerCase() || null;
      if (input.phone !== undefined) updateData.phone = input.phone?.trim() || null;
      if (input.maxGuests !== undefined) updateData.maxGuests = input.maxGuests;
      if (input.rsvpStatus !== undefined) {
        updateData.rsvpStatus = input.rsvpStatus;
        if (input.rsvpStatus === 'NOT_ATTENDING' && input.attendingCount === undefined) {
          updateData.attendingCount = 0;
        }
      }
      if (input.attendingCount !== undefined) updateData.attendingCount = input.attendingCount;
      if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;

      const updated = await database.$transaction(async (tx) => {
        if (input.invitedEventIds !== undefined) {
          await tx.guestEvent.deleteMany({
            where: { guestId },
          });

          if (input.invitedEventIds.length > 0) {
            await tx.guestEvent.createMany({
              data: input.invitedEventIds.map((eventId) => ({
                guestId,
                eventId,
              })),
            });
          }
        }

        return tx.guest.update({
          where: { id: guestId },
          data: updateData,
          include: {
            guestEvents: {
              include: {
                event: {
                  select: {
                    id: true,
                    name: true,
                    startsAt: true,
                    venueName: true,
                  },
                },
              },
            },
          },
        });
      });

      return {
        id: updated.id,
        weddingId: updated.weddingId,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        maxGuests: updated.maxGuests,
        rsvpStatus: updated.rsvpStatus,
        attendingCount: updated.attendingCount,
        rsvpRespondedAt: updated.rsvpRespondedAt ? updated.rsvpRespondedAt.toISOString() : null,
        invitationToken: updated.invitationToken,
        invitationSentAt: updated.invitationSentAt ? updated.invitationSentAt.toISOString() : null,
        lastReminderSentAt: updated.lastReminderSentAt ? updated.lastReminderSentAt.toISOString() : null,
        reminderCount: updated.reminderCount,
        notes: updated.notes,
        invitedEvents: updated.guestEvents.map((ge) => ({
          id: ge.event.id,
          name: ge.event.name,
          startsAt: ge.event.startsAt ? ge.event.startsAt.toISOString() : null,
          venueName: ge.event.venueName,
        })),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    },

    async deleteGuest(userId: string, guestId: string) {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const existing = await database.guest.findFirst({
        where: { id: guestId, weddingId },
        select: { id: true },
      });

      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Guest not found.');
      }

      await database.guest.delete({
        where: { id: guestId },
      });

      return {
        success: true as const,
        id: guestId,
        message: 'Guest removed successfully.',
      };
    },

    async getGuestDashboard(userId: string): Promise<GuestDashboardMetrics> {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const allGuests = await database.guest.findMany({
        where: { weddingId },
        select: {
          rsvpStatus: true,
          attendingCount: true,
          invitationSentAt: true,
        },
      });

      return {
        totalGuests: allGuests.length,
        pendingRsvps: allGuests.filter((g) => g.rsvpStatus === RsvpStatus.PENDING).length,
        attendingGuests: allGuests.filter((g) => g.rsvpStatus === RsvpStatus.ATTENDING).length,
        notAttendingGuests: allGuests.filter((g) => g.rsvpStatus === RsvpStatus.NOT_ATTENDING).length,
        expectedAttendeeCount: allGuests
          .filter((g) => g.rsvpStatus === RsvpStatus.ATTENDING)
          .reduce((sum, g) => sum + g.attendingCount, 0),
        invitationsSentCount: allGuests.filter((g) => g.invitationSentAt !== null).length,
      };
    },

    async getInvitationLink(userId: string, guestId: string) {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      let guest = await database.guest.findFirst({
        where: { id: guestId, weddingId },
        select: {
          id: true,
          name: true,
          invitationToken: true,
          invitationRevokedAt: true,
        },
      });

      if (!guest) {
        throw new AppError(404, 'NOT_FOUND', 'Guest not found.');
      }

      let token = guest.invitationToken;

      // If token is missing or link was revoked, regenerate a fresh active token
      if (!token || guest.invitationRevokedAt !== null) {
        const generated = generateSecureToken();
        token = generated.token;

        await database.guest.update({
          where: { id: guestId },
          data: {
            invitationToken: token,
            invitationTokenHash: generated.tokenHash,
            invitationRevokedAt: null,
          },
        });
      }

      const baseUrl = getBaseAppUrl();
      const url = `${baseUrl}/invite/${token}`;

      return {
        url,
        token,
        guestId: guest.id,
        guestName: guest.name,
      };
    },

    async sendInvitation(userId: string, guestId: string) {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const [guest, wedding] = await Promise.all([
        database.guest.findFirst({
          where: { id: guestId, weddingId },
        }),
        database.wedding.findUnique({
          where: { id: weddingId },
          select: {
            title: true,
            brideName: true,
            groomName: true,
            weddingDate: true,
          },
        }),
      ]);

      if (!guest || !wedding) {
        throw new AppError(404, 'NOT_FOUND', 'Guest not found.');
      }

      if (!guest.email) {
        throw new AppError(
          400,
          'GUEST_EMAIL_REQUIRED',
          'Please provide an email address for this guest before sending an invitation.',
        );
      }

      // Ensure active token
      let token = guest.invitationToken;
      if (!token || guest.invitationRevokedAt !== null) {
        const generated = generateSecureToken();
        token = generated.token;
        await database.guest.update({
          where: { id: guestId },
          data: {
            invitationToken: token,
            invitationTokenHash: generated.tokenHash,
            invitationRevokedAt: null,
          },
        });
      }

      const inviteUrl = `${getBaseAppUrl()}/invite/${token}`;
      const weddingDateStr = wedding.weddingDate
        ? wedding.weddingDate.toISOString().slice(0, 10)
        : null;

      const result = await mailer.sendInvitationEmail({
        toEmail: guest.email,
        guestName: guest.name,
        weddingTitle: wedding.title,
        brideName: wedding.brideName,
        groomName: wedding.groomName,
        weddingDate: weddingDateStr,
        inviteUrl,
        maxGuests: guest.maxGuests,
      });

      await database.guest.update({
        where: { id: guestId },
        data: {
          invitationSentAt: new Date(),
        },
      });

      return {
        success: true as const,
        delivered: result.delivered,
        error: result.error,
      };
    },

    async resendInvitation(userId: string, guestId: string) {
      return this.sendInvitation(userId, guestId);
    },

    async revokeInvitation(userId: string, guestId: string) {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const guest = await database.guest.findFirst({
        where: { id: guestId, weddingId },
        select: { id: true },
      });

      if (!guest) {
        throw new AppError(404, 'NOT_FOUND', 'Guest not found.');
      }

      await database.guest.update({
        where: { id: guestId },
        data: {
          invitationRevokedAt: new Date(),
        },
      });

      return {
        success: true as const,
        message: 'Invitation link has been revoked.',
      };
    },

    async sendReminders(userId: string, payload: SendRemindersPayload) {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const where: Record<string, unknown> = {
        weddingId,
        rsvpStatus: RsvpStatus.PENDING,
        email: { not: null },
      };

      if (payload.scope === 'SELECTED' && payload.guestIds && payload.guestIds.length > 0) {
        where.id = { in: payload.guestIds };
      }

      const [pendingGuests, wedding] = await Promise.all([
        database.guest.findMany({ where }),
        database.wedding.findUnique({
          where: { id: weddingId },
          select: {
            title: true,
            brideName: true,
            groomName: true,
            weddingDate: true,
          },
        }),
      ]);

      if (!wedding) {
        throw new AppError(404, 'NOT_FOUND', 'Wedding workspace not found.');
      }

      let totalSent = 0;
      let totalFailed = 0;
      const weddingDateStr = wedding.weddingDate
        ? wedding.weddingDate.toISOString().slice(0, 10)
        : null;

      for (const guest of pendingGuests) {
        if (!guest.email) continue;

        let token = guest.invitationToken;
        if (!token) {
          const generated = generateSecureToken();
          token = generated.token;
          await database.guest.update({
            where: { id: guest.id },
            data: {
              invitationToken: token,
              invitationTokenHash: generated.tokenHash,
            },
          });
        }

        const inviteUrl = `${getBaseAppUrl()}/invite/${token}`;

        const result = await mailer.sendReminderEmail({
          toEmail: guest.email,
          guestName: guest.name,
          weddingTitle: wedding.title,
          brideName: wedding.brideName,
          groomName: wedding.groomName,
          weddingDate: weddingDateStr,
          inviteUrl,
        });

        if (result.delivered) {
          totalSent += 1;
        } else {
          totalFailed += 1;
        }

        await database.guest.update({
          where: { id: guest.id },
          data: {
            lastReminderSentAt: new Date(),
            reminderCount: { increment: 1 },
          },
        });
      }

      return {
        totalEligible: pendingGuests.length,
        totalSent,
        totalFailed,
      };
    },

    async getPublicInvitation(token: string): Promise<PublicInvitationSummary> {
      const database = requireDatabase();
      const tokenHash = hashToken(token);

      const guest = await database.guest.findUnique({
        where: { invitationTokenHash: tokenHash },
        include: {
          wedding: {
            select: {
              id: true,
              title: true,
              brideName: true,
              groomName: true,
              weddingDate: true,
              location: true,
              city: true,
              state: true,
              description: true,
            },
          },
          guestEvents: {
            include: {
              event: true,
            },
          },
        },
      });

      if (!guest) {
        throw new AppError(404, 'NOT_FOUND', 'Invitation link is invalid or does not exist.');
      }

      if (guest.invitationRevokedAt !== null) {
        throw new AppError(403, 'INVITATION_REVOKED', 'This wedding invitation link has been revoked.');
      }

      if (guest.invitationExpiresAt !== null && guest.invitationExpiresAt < new Date()) {
        throw new AppError(410, 'INVITATION_EXPIRED', 'This wedding invitation link has expired.');
      }

      const activeEvents = guest.guestEvents
        .map((ge) => ge.event)
        .filter((evt) => evt.status !== 'CANCELLED')
        .sort((a, b) => {
          const aTime = a.startsAt ? a.startsAt.getTime() : 0;
          const bTime = b.startsAt ? b.startsAt.getTime() : 0;
          return aTime - bTime;
        });

      return {
        guest: {
          name: guest.name,
          maxGuests: guest.maxGuests,
          rsvpStatus: guest.rsvpStatus,
          attendingCount: guest.attendingCount,
          rsvpRespondedAt: guest.rsvpRespondedAt ? guest.rsvpRespondedAt.toISOString() : null,
        },
        wedding: {
          id: guest.wedding.id,
          title: guest.wedding.title,
          brideName: guest.wedding.brideName,
          groomName: guest.wedding.groomName,
          weddingDate: guest.wedding.weddingDate
            ? guest.wedding.weddingDate.toISOString().slice(0, 10)
            : null,
          location: guest.wedding.location,
          city: guest.wedding.city,
          state: guest.wedding.state,
          description: guest.wedding.description,
        },
        invitedEvents: activeEvents.map((evt) => ({
          id: evt.id,
          name: evt.name,
          description: evt.description,
          startsAt: evt.startsAt ? evt.startsAt.toISOString() : null,
          endsAt: evt.endsAt ? evt.endsAt.toISOString() : null,
          venueName: evt.venueName,
          venueAddress: evt.venueAddress,
          dressCode: evt.dressCode,
        })),
      };
    },

    async submitPublicRsvp(token: string, input: SubmitRsvpInput): Promise<PublicInvitationSummary> {
      const database = requireDatabase();
      const tokenHash = hashToken(token);

      const guest = await database.guest.findUnique({
        where: { invitationTokenHash: tokenHash },
      });

      if (!guest) {
        throw new AppError(404, 'NOT_FOUND', 'Invitation link is invalid or does not exist.');
      }

      if (guest.invitationRevokedAt !== null) {
        throw new AppError(403, 'INVITATION_REVOKED', 'This wedding invitation link has been revoked.');
      }

      if (guest.invitationExpiresAt !== null && guest.invitationExpiresAt < new Date()) {
        throw new AppError(410, 'INVITATION_EXPIRED', 'This wedding invitation link has expired.');
      }

      let attendingCount = 0;
      if (input.rsvpStatus === RsvpStatus.ATTENDING) {
        if (input.attendingCount > guest.maxGuests) {
          throw new AppError(
            400,
            'HEADCOUNT_EXCEEDED',
            `You can attend with at most ${guest.maxGuests} ${guest.maxGuests === 1 ? 'person' : 'people'}.`,
            { attendingCount: `Exceeds max allowed (${guest.maxGuests})` },
          );
        }
        attendingCount = Math.max(1, input.attendingCount);
      }

      const updateData: Record<string, unknown> = {
        rsvpStatus: input.rsvpStatus,
        attendingCount,
        rsvpRespondedAt: new Date(),
      };
      if (input.notes !== undefined) {
        updateData.notes = input.notes?.trim() || null;
      }

      await database.guest.update({
        where: { id: guest.id },
        data: updateData,
      });

      return this.getPublicInvitation(token);
    },
  };
}

