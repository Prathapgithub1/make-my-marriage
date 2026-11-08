import express, { type ErrorRequestHandler } from 'express';
import request from 'supertest';
import { AppError } from '../src/shared/app-error';
import type { AuthOperations } from '../src/modules/auth/routes';
import { createEventsRouter } from '../src/modules/events/routes';
import { createEventsService, type EventsServiceOperations } from '../src/modules/events/service';
import type { EventSummary, EventsListResponse } from '../src/modules/events/schemas';
import { EventStatus } from '../src/generated/prisma/client';
import { createCsrfToken } from '../src/modules/auth/security';

const mockUser = {
  id: 'user-organizer-1',
  email: 'organizer@example.com',
  displayName: 'Akshitha Rao',
};

const mockEvent: EventSummary = {
  id: 'event-uuid-1',
  weddingId: 'wedding-uuid-1',
  name: 'Sangeet Night',
  description: 'Music, dance, and celebrations',
  startsAt: '2026-11-20T18:00:00.000Z',
  endsAt: '2026-11-20T23:00:00.000Z',
  venueName: 'Grand Ballroom, Oberoi',
  venueAddress: 'Udaipur, Rajasthan',
  dressCode: 'Indo-Western Festive',
  coverImageKey: 'events/sangeet-cover.jpg',
  status: EventStatus.PLANNED,
  guestCount: 0,
  taskCount: 0,
  createdAt: '2026-11-08T10:00:00.000Z',
  updatedAt: '2026-11-08T10:00:00.000Z',
};

const mockEventsListResponse: EventsListResponse = {
  events: [mockEvent],
  metrics: {
    total: 1,
    upcoming: 1,
    completed: 0,
    cancelled: 0,
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 1,
    totalPages: 1,
  },
};

function buildEventsApp(
  serviceOverrides: Partial<EventsServiceOperations> = {},
  authOverrides: Partial<AuthOperations> = {},
) {
  const eventsService: EventsServiceOperations = {
    createEvent: jest.fn(async () => mockEvent),
    listEvents: jest.fn(async () => mockEventsListResponse),
    getEventById: jest.fn(async () => mockEvent),
    updateEvent: jest.fn(async () => mockEvent),
    deleteEvent: jest.fn(async () => ({
      success: true as const,
      id: mockEvent.id,
      message: 'Event deleted successfully.',
    })),
    ...serviceOverrides,
  };

  const auth: AuthOperations = {
    createCsrfToken,
    signup: jest.fn(),
    login: jest.fn(),
    authenticate: jest.fn(async (token) => (token === 'valid-token' ? mockUser : null)),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    consumeRateLimit: jest.fn(async () => true),
    ...authOverrides,
  };

  const app = express();
  app.use(express.json());
  app.use('/api/v1/events', createEventsRouter(eventsService, auth));

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    void _next;
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: { code: error.code, message: error.message, details: error.details },
      });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  };

  app.use(errorHandler);
  return { app, eventsService, auth };
}

describe('Event Management Module REST API', () => {
  const validCsrf = createCsrfToken();
  const authHeaders = {
    Origin: 'http://localhost:1234',
    Cookie: `mmm_session=valid-token; mmm_csrf=${validCsrf}`,
    'X-CSRF-Token': validCsrf,
  };

  describe('POST /api/v1/events', () => {
    it('creates an event successfully (201)', async () => {
      const { app, eventsService } = buildEventsApp();

      const res = await request(app).post('/api/v1/events').set(authHeaders).send({
        name: 'Mehendi Ceremony',
        startsAt: '2026-11-19T14:00:00.000Z',
        endsAt: '2026-11-19T18:00:00.000Z',
        venueName: 'Courtyard Lawn',
        venueAddress: 'Udaipur, Rajasthan',
        dressCode: 'Yellow / Floral',
        description: 'Traditional mehendi rituals and music',
      });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(eventsService.createEvent).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          name: 'Mehendi Ceremony',
        }),
      );
    });

    it('rejects creation when name is missing or blank (400)', async () => {
      const { app } = buildEventsApp();

      const res = await request(app).post('/api/v1/events').set(authHeaders).send({
        name: '   ',
        startsAt: '2026-11-19T14:00:00.000Z',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.name).toBeDefined();
    });

    it('rejects creation when end time is earlier than start time (400)', async () => {
      const { app } = buildEventsApp();

      const res = await request(app).post('/api/v1/events').set(authHeaders).send({
        name: 'Cocktail Party',
        startsAt: '2026-11-20T20:00:00.000Z',
        endsAt: '2026-11-20T18:00:00.000Z',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.endsAt).toMatch(/End time cannot be earlier than start time/i);
    });

    it('rejects creation when status is invalid (400)', async () => {
      const { app } = buildEventsApp();

      const res = await request(app).post('/api/v1/events').set(authHeaders).send({
        name: 'Wedding Ceremony',
        status: 'NOT_A_VALID_STATUS',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects unauthenticated request (401)', async () => {
      const { app } = buildEventsApp();

      const res = await request(app)
        .post('/api/v1/events')
        .set('Origin', 'http://localhost:1234')
        .set('Cookie', `mmm_csrf=${validCsrf}`)
        .set('X-CSRF-Token', validCsrf)
        .send({ name: 'Test' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('GET /api/v1/events', () => {
    it('returns event list with pagination and metrics (200)', async () => {
      const { app, eventsService } = buildEventsApp();

      const res = await request(app)
        .get('/api/v1/events?search=Sangeet&page=1&limit=10')
        .set(authHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.metrics).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(eventsService.listEvents).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          search: 'Sangeet',
          page: 1,
          limit: 10,
        }),
      );
    });

    it('rejects invalid query parameters (400)', async () => {
      const { app } = buildEventsApp();

      const res = await request(app).get('/api/v1/events?status=INVALID_STATUS').set(authHeaders);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/events/:eventId', () => {
    it('returns event details when found (200)', async () => {
      const { app, eventsService } = buildEventsApp();

      const res = await request(app).get(`/api/v1/events/${mockEvent.id}`).set(authHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(mockEvent.id);
      expect(eventsService.getEventById).toHaveBeenCalledWith(mockUser.id, mockEvent.id);
    });

    it('returns 404 NOT_FOUND when event does not exist or belongs to another wedding', async () => {
      const { app } = buildEventsApp({
        getEventById: jest.fn(async () => {
          throw new AppError(404, 'NOT_FOUND', 'Event not found.');
        }),
      });

      const res = await request(app).get('/api/v1/events/foreign-event-id').set(authHeaders);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/events/:eventId', () => {
    it('updates event fields successfully (200)', async () => {
      const { app, eventsService } = buildEventsApp({
        updateEvent: jest.fn(async () => ({
          ...mockEvent,
          name: 'Grand Sangeet & Musical Evening',
          status: EventStatus.CONFIRMED,
        })),
      });

      const res = await request(app).patch(`/api/v1/events/${mockEvent.id}`).set(authHeaders).send({
        name: 'Grand Sangeet & Musical Evening',
        status: 'CONFIRMED',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Grand Sangeet & Musical Evening');
      expect(res.body.data.status).toBe(EventStatus.CONFIRMED);
      expect(eventsService.updateEvent).toHaveBeenCalledWith(
        mockUser.id,
        mockEvent.id,
        expect.objectContaining({
          name: 'Grand Sangeet & Musical Evening',
          status: 'CONFIRMED',
        }),
      );
    });

    it('allows cancelling an event via PATCH status CANCELLED (200)', async () => {
      const { app, eventsService } = buildEventsApp({
        updateEvent: jest.fn(async () => ({
          ...mockEvent,
          status: EventStatus.CANCELLED,
        })),
      });

      const res = await request(app)
        .patch(`/api/v1/events/${mockEvent.id}`)
        .set(authHeaders)
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(EventStatus.CANCELLED);
      expect(eventsService.updateEvent).toHaveBeenCalledWith(
        mockUser.id,
        mockEvent.id,
        expect.objectContaining({ status: 'CANCELLED' }),
      );
    });

    it('rejects invalid patch payload (400)', async () => {
      const { app } = buildEventsApp();

      const res = await request(app).patch(`/api/v1/events/${mockEvent.id}`).set(authHeaders).send({
        startsAt: '2026-11-20T22:00:00.000Z',
        endsAt: '2026-11-20T19:00:00.000Z',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/v1/events/:eventId', () => {
    it('deletes an event successfully (200)', async () => {
      const { app, eventsService } = buildEventsApp();

      const res = await request(app).delete(`/api/v1/events/${mockEvent.id}`).set(authHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(eventsService.deleteEvent).toHaveBeenCalledWith(mockUser.id, mockEvent.id);
    });

    it('returns 404 if event does not belong to user wedding (cross-wedding isolation)', async () => {
      const { app } = buildEventsApp({
        deleteEvent: jest.fn(async () => {
          throw new AppError(404, 'NOT_FOUND', 'Event not found.');
        }),
      });

      const res = await request(app).delete('/api/v1/events/foreign-event-id').set(authHeaders);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('EventsService Unit Integration Logic', () => {
    it('enforces wedding workspace resolution and rejects users without wedding', async () => {
      const mockPrisma = {
        weddingMembership: {
          findUnique: jest.fn(async () => null),
        },
      } as unknown as Parameters<typeof createEventsService>[0];

      const service = createEventsService(mockPrisma);

      await expect(
        service.createEvent('unattached-user', { name: 'Test Event', status: EventStatus.PLANNED }),
      ).rejects.toThrow('You do not belong to a wedding workspace.');
    });

    it('rejects endsAt earlier than startsAt during service creation', async () => {
      const mockPrisma = {
        weddingMembership: {
          findUnique: jest.fn(async () => ({ weddingId: 'wedding-1' })),
        },
      } as unknown as Parameters<typeof createEventsService>[0];

      const service = createEventsService(mockPrisma);

      await expect(
        service.createEvent('user-1', {
          name: 'Test Event',
          startsAt: '2026-11-20T20:00:00.000Z',
          endsAt: '2026-11-20T18:00:00.000Z',
          status: EventStatus.PLANNED,
        }),
      ).rejects.toThrow('End time cannot be earlier than start time.');
    });
  });
});
