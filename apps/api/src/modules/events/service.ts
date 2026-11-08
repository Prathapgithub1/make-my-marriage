import type { PrismaClient } from '../../generated/prisma/client';
import { EventStatus } from '../../generated/prisma/client';
import { AppError } from '../../shared/app-error';
import type {
  CreateEventInput,
  UpdateEventInput,
  ListEventsQuery,
  EventSummary,
  EventsListResponse,
} from './schemas';

export interface EventsServiceOperations {
  createEvent(userId: string, input: CreateEventInput): Promise<EventSummary>;
  listEvents(userId: string, query: ListEventsQuery): Promise<EventsListResponse>;
  getEventById(userId: string, eventId: string): Promise<EventSummary>;
  updateEvent(userId: string, eventId: string, input: UpdateEventInput): Promise<EventSummary>;
  deleteEvent(
    userId: string,
    eventId: string,
  ): Promise<{ success: true; id: string; message: string }>;
}

export function formatEventSummary(event: {
  id: string;
  weddingId: string;
  name: string;
  description: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  venueName: string | null;
  venueAddress: string | null;
  dressCode: string | null;
  coverImageKey: string | null;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}): EventSummary {
  return {
    id: event.id,
    weddingId: event.weddingId,
    name: event.name,
    description: event.description,
    startsAt: event.startsAt ? event.startsAt.toISOString() : null,
    endsAt: event.endsAt ? event.endsAt.toISOString() : null,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    dressCode: event.dressCode,
    coverImageKey: event.coverImageKey,
    status: event.status,
    guestCount: 0,
    taskCount: 0,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export function createEventsService(prismaClient?: PrismaClient | null): EventsServiceOperations {
  function requireDatabase(): PrismaClient {
    if (!prismaClient) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Database client is not available.');
    }
    return prismaClient;
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

  return {
    async createEvent(userId: string, input: CreateEventInput): Promise<EventSummary> {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const startsAt = input.startsAt ? new Date(input.startsAt) : null;
      const endsAt = input.endsAt ? new Date(input.endsAt) : null;

      if (startsAt && endsAt && endsAt.getTime() < startsAt.getTime()) {
        throw new AppError(400, 'VALIDATION_ERROR', 'End time cannot be earlier than start time.', {
          endsAt: 'End time cannot be earlier than start time',
        });
      }

      const venueAddress = input.venueAddress ?? input.address ?? null;

      const event = await database.event.create({
        data: {
          weddingId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          startsAt,
          endsAt,
          venueName: input.venueName?.trim() || null,
          venueAddress: venueAddress?.trim() || null,
          dressCode: input.dressCode?.trim() || null,
          coverImageKey: input.coverImageKey?.trim() || null,
          status: input.status ?? EventStatus.PLANNED,
        },
      });

      return formatEventSummary(event);
    },

    async listEvents(userId: string, query: ListEventsQuery): Promise<EventsListResponse> {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const where: Record<string, unknown> = { weddingId };

      if (query.status) {
        where.status = query.status;
      } else if (!query.includeCancelled) {
        // By default show all unless cancelled is specifically filtered or requested
      }

      if (query.search) {
        const searchTerm = query.search.trim();
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { venueName: { contains: searchTerm, mode: 'insensitive' } },
          { venueAddress: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }

      if (query.from || query.to) {
        const dateFilter: Record<string, Date> = {};
        if (query.from) dateFilter.gte = new Date(query.from);
        if (query.to) dateFilter.lte = new Date(query.to);
        where.startsAt = dateFilter;
      }

      const page = Math.max(1, query.page);
      const limit = Math.max(1, Math.min(100, query.limit));
      const skip = (page - 1) * limit;

      const [totalCount, statusCounts, events] = await Promise.all([
        database.event.count({ where }),
        database.event.groupBy({
          by: ['status'],
          where: { weddingId },
          _count: { _all: true },
        }),
        database.event.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }],
        }),
      ]);

      let allEventsCount = 0;
      let plannedCount = 0;
      let confirmedCount = 0;
      let completedCount = 0;
      let cancelledCount = 0;

      for (const row of statusCounts) {
        const count = row._count._all;
        allEventsCount += count;
        if (row.status === EventStatus.PLANNED) plannedCount = count;
        else if (row.status === EventStatus.CONFIRMED) confirmedCount = count;
        else if (row.status === EventStatus.COMPLETED) completedCount = count;
        else if (row.status === EventStatus.CANCELLED) cancelledCount = count;
      }

      const upcomingCount = plannedCount + confirmedCount;

      return {
        events: events.map(formatEventSummary),
        metrics: {
          total: allEventsCount,
          upcoming: upcomingCount,
          completed: completedCount,
          cancelled: cancelledCount,
        },
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      };
    },

    async getEventById(userId: string, eventId: string): Promise<EventSummary> {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const event = await database.event.findFirst({
        where: { id: eventId, weddingId },
      });

      if (!event) {
        throw new AppError(404, 'NOT_FOUND', 'Event not found.');
      }

      return formatEventSummary(event);
    },

    async updateEvent(
      userId: string,
      eventId: string,
      input: UpdateEventInput,
    ): Promise<EventSummary> {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const existing = await database.event.findFirst({
        where: { id: eventId, weddingId },
      });

      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Event not found.');
      }

      const effectiveStartsAt =
        input.startsAt !== undefined
          ? input.startsAt
            ? new Date(input.startsAt)
            : null
          : existing.startsAt;

      const effectiveEndsAt =
        input.endsAt !== undefined
          ? input.endsAt
            ? new Date(input.endsAt)
            : null
          : existing.endsAt;

      if (
        effectiveStartsAt &&
        effectiveEndsAt &&
        effectiveEndsAt.getTime() < effectiveStartsAt.getTime()
      ) {
        throw new AppError(400, 'VALIDATION_ERROR', 'End time cannot be earlier than start time.', {
          endsAt: 'End time cannot be earlier than start time',
        });
      }

      const dataToUpdate: Record<string, unknown> = {};

      if (input.name !== undefined) dataToUpdate.name = input.name.trim();
      if (input.description !== undefined) {
        dataToUpdate.description = input.description ? input.description.trim() : null;
      }
      if (input.startsAt !== undefined) dataToUpdate.startsAt = effectiveStartsAt;
      if (input.endsAt !== undefined) dataToUpdate.endsAt = effectiveEndsAt;
      if (input.venueName !== undefined) {
        dataToUpdate.venueName = input.venueName ? input.venueName.trim() : null;
      }
      if (input.venueAddress !== undefined || input.address !== undefined) {
        const addr = input.venueAddress ?? input.address;
        dataToUpdate.venueAddress = addr ? addr.trim() : null;
      }
      if (input.dressCode !== undefined) {
        dataToUpdate.dressCode = input.dressCode ? input.dressCode.trim() : null;
      }
      if (input.coverImageKey !== undefined) {
        dataToUpdate.coverImageKey = input.coverImageKey ? input.coverImageKey.trim() : null;
      }
      if (input.status !== undefined) dataToUpdate.status = input.status;

      const updated = await database.event.update({
        where: { id: eventId },
        data: dataToUpdate,
      });

      return formatEventSummary(updated);
    },

    async deleteEvent(
      userId: string,
      eventId: string,
    ): Promise<{ success: true; id: string; message: string }> {
      const database = requireDatabase();
      const weddingId = await resolveWedding(database, userId);

      const existing = await database.event.findFirst({
        where: { id: eventId, weddingId },
      });

      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Event not found.');
      }

      await database.event.delete({
        where: { id: eventId },
      });

      return { success: true, id: eventId, message: 'Event deleted successfully.' };
    },
  };
}
