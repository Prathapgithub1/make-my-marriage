import express, { type ErrorRequestHandler } from 'express';
import request from 'supertest';
import { AppError } from '../src/shared/app-error';
import type { AuthOperations } from '../src/modules/auth/routes';
import { createGuestsRouter, createPublicInvitationsRouter } from '../src/modules/guests/routes';
import type { GuestsServiceOperations } from '../src/modules/guests/service';
import type {
  GuestSummary,
  GuestDashboardMetrics,
  PublicInvitationSummary,
} from '../src/modules/guests/schemas';
import { RsvpStatus } from '../src/generated/prisma/client';
import { createCsrfToken } from '../src/modules/auth/security';

const mockUser = {
  id: 'user-organizer-1',
  email: 'organizer@example.com',
  displayName: 'Akshitha Rao',
};

const mockGuest: GuestSummary = {
  id: 'guest-uuid-1',
  weddingId: 'wedding-uuid-1',
  name: 'Rajesh Sharma',
  email: 'rajesh.sharma@example.com',
  phone: '+919876543210',
  maxGuests: 4,
  rsvpStatus: RsvpStatus.PENDING,
  attendingCount: 0,
  rsvpRespondedAt: null,
  invitationToken: 'test-token-123',
  invitationSentAt: null,
  lastReminderSentAt: null,
  reminderCount: 0,
  notes: 'Close family from bride side',
  invitedEvents: [
    {
      id: 'event-uuid-1',
      name: 'Sangeet & Musical Evening',
      startsAt: '2026-11-20T10:00:00.000Z',
      venueName: 'The Grand Ballroom',
    },
  ],
  createdAt: '2026-11-10T10:00:00.000Z',
  updatedAt: '2026-11-10T10:00:00.000Z',
};

const mockGuestMetrics: GuestDashboardMetrics = {
  totalGuests: 1,
  pendingRsvps: 1,
  attendingGuests: 0,
  notAttendingGuests: 0,
  expectedAttendeeCount: 0,
  invitationsSentCount: 0,
};

const mockPublicInvitation: PublicInvitationSummary = {
  guest: {
    name: 'Rajesh Sharma',
    maxGuests: 4,
    rsvpStatus: RsvpStatus.PENDING,
    attendingCount: 0,
    rsvpRespondedAt: null,
  },
  wedding: {
    id: 'wedding-uuid-1',
    title: 'Akshay & Princi Wedding',
    brideName: 'Princi',
    groomName: 'Akshay',
    weddingDate: '2027-02-14',
    location: 'Dehradun',
    city: 'Dehradun',
    state: 'Uttarakhand',
    description: 'We invite you to our wedding celebration!',
  },
  invitedEvents: [
    {
      id: 'event-uuid-1',
      name: 'Wedding Ceremony',
      description: 'Traditional ritual',
      startsAt: '2027-02-14T18:00:00.000Z',
      endsAt: '2027-02-14T22:00:00.000Z',
      venueName: 'XYZ Resort',
      venueAddress: 'Rajpur Road, Dehradun',
      dressCode: 'Traditional Festive',
    },
  ],
};

function buildGuestsApp(
  serviceOverrides: Partial<GuestsServiceOperations> = {},
  authOverrides: Partial<AuthOperations> = {},
) {
  const guestsService: GuestsServiceOperations = {
    createGuest: jest.fn(async () => mockGuest),
    listGuests: jest.fn(async () => ({
      data: [mockGuest],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      metrics: mockGuestMetrics,
    })),
    getGuestById: jest.fn(async () => mockGuest),
    updateGuest: jest.fn(async () => mockGuest),
    deleteGuest: jest.fn(async () => ({
      success: true as const,
      id: mockGuest.id,
      message: 'Guest removed successfully.',
    })),
    getGuestDashboard: jest.fn(async () => mockGuestMetrics),
    getInvitationLink: jest.fn(async () => ({
      url: 'http://localhost:1234/invite/test-token-123',
      token: 'test-token-123',
      guestId: mockGuest.id,
      guestName: mockGuest.name,
    })),
    sendInvitation: jest.fn(async () => ({
      success: true as const,
      delivered: true,
    })),
    resendInvitation: jest.fn(async () => ({
      success: true as const,
      delivered: true,
    })),
    revokeInvitation: jest.fn(async () => ({
      success: true as const,
      message: 'Invitation link has been revoked.',
    })),
    sendReminders: jest.fn(async () => ({
      totalEligible: 1,
      totalSent: 1,
      totalFailed: 0,
    })),
    getPublicInvitation: jest.fn(async () => mockPublicInvitation),
    submitPublicRsvp: jest.fn(async () => ({
      ...mockPublicInvitation,
      guest: {
        ...mockPublicInvitation.guest,
        rsvpStatus: RsvpStatus.ATTENDING,
        attendingCount: 3,
        rsvpRespondedAt: '2026-11-11T12:00:00.000Z',
      },
    })),
    ...serviceOverrides,
  };

  const auth: AuthOperations = {
    createCsrfToken,
    signup: jest.fn(),
    login: jest.fn(),
    authenticate: jest.fn(async (token) =>
      token === 'valid-token' || token === 'valid-session' ? mockUser : null,
    ),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    consumeRateLimit: jest.fn(async () => true),
    ...authOverrides,
  };

  const app = express();
  app.use(express.json());
  app.use('/api/v1/guests', createGuestsRouter(guestsService, auth));
  app.use('/api/v1/public/invitations', createPublicInvitationsRouter(guestsService, auth));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal error' } });
  };
  app.use(errorHandler);

  return { app, guestsService, auth };
}

describe('Guests & RSVP API Endpoints', () => {
  const validCsrf = createCsrfToken();
  const validHeaders = {
    Cookie: `mmm_session=valid-session; mmm_csrf=${validCsrf}`,
    'X-CSRF-Token': validCsrf,
    Origin: 'http://localhost:1234',
  };
  const publicHeaders = {
    Cookie: `mmm_csrf=${validCsrf}`,
    'X-CSRF-Token': validCsrf,
    Origin: 'http://localhost:1234',
  };

  describe('POST /api/v1/guests (Create Guest)', () => {
    it('creates a guest with required fields and returns 201', async () => {
      const { app, guestsService } = buildGuestsApp();

      const response = await request(app)
        .post('/api/v1/guests')
        .set(validHeaders)
        .send({
          name: 'Rajesh Sharma',
          email: 'rajesh.sharma@example.com',
          phone: '+919876543210',
          maxGuests: 4,
          notes: 'Close family',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('Rajesh Sharma');
      expect(guestsService.createGuest).toHaveBeenCalledTimes(1);
    });

    it('rejects creation when guest name is missing or blank', async () => {
      const { app } = buildGuestsApp();

      const response = await request(app)
        .post('/api/v1/guests')
        .set(validHeaders)
        .send({
          name: '   ',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects creation when CSRF token is missing', async () => {
      const { app } = buildGuestsApp();

      const response = await request(app)
        .post('/api/v1/guests')
        .set('Cookie', 'mmm_session=valid-session')
        .set('Origin', 'http://localhost:1234')
        .send({
          name: 'Rajesh Sharma',
        });

      expect(response.status).toBe(403);
    });

    it('returns 401 when user is unauthenticated', async () => {
      const { app } = buildGuestsApp();

      const response = await request(app)
        .post('/api/v1/guests')
        .set({
          Cookie: `mmm_csrf=${validCsrf}`,
          'X-CSRF-Token': validCsrf,
          Origin: 'http://localhost:1234',
        })
        .send({
          name: 'Rajesh Sharma',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/guests (List Guests)', () => {
    it('retrieves paginated guests with summary metrics', async () => {
      const { app, guestsService } = buildGuestsApp();

      const response = await request(app)
        .get('/api/v1/guests')
        .set(validHeaders);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.metrics.totalGuests).toBe(1);
      expect(guestsService.listGuests).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/v1/guests/dashboard (Dashboard Metrics)', () => {
    it('returns guest dashboard summary metrics', async () => {
      const { app, guestsService } = buildGuestsApp();

      const response = await request(app)
        .get('/api/v1/guests/dashboard')
        .set(validHeaders);

      expect(response.status).toBe(200);
      expect(response.body.data.totalGuests).toBe(1);
      expect(guestsService.getGuestDashboard).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/v1/guests/:guestId (Read Guest)', () => {
    it('returns guest details by ID', async () => {
      const { app, guestsService } = buildGuestsApp();

      const response = await request(app)
        .get('/api/v1/guests/guest-uuid-1')
        .set(validHeaders);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('guest-uuid-1');
      expect(guestsService.getGuestById).toHaveBeenCalledWith(mockUser.id, 'guest-uuid-1');
    });

    it('returns 404 when guest is not found', async () => {
      const { app } = buildGuestsApp({
        getGuestById: jest.fn(async () => {
          throw new AppError(404, 'NOT_FOUND', 'Guest not found.');
        }),
      });

      const response = await request(app)
        .get('/api/v1/guests/non-existent-id')
        .set(validHeaders);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/guests/:guestId (Update Guest)', () => {
    it('updates guest details successfully', async () => {
      const { app, guestsService } = buildGuestsApp();

      const response = await request(app)
        .patch('/api/v1/guests/guest-uuid-1')
        .set(validHeaders)
        .send({
          name: 'Rajesh Sharma (Updated)',
          maxGuests: 5,
        });

      expect(response.status).toBe(200);
      expect(guestsService.updateGuest).toHaveBeenCalledTimes(1);
    });

    it('rejects update with empty payload', async () => {
      const { app } = buildGuestsApp();

      const response = await request(app)
        .patch('/api/v1/guests/guest-uuid-1')
        .set(validHeaders)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/guests/:guestId (Delete Guest)', () => {
    it('deletes guest successfully', async () => {
      const { app, guestsService } = buildGuestsApp();

      const response = await request(app)
        .delete('/api/v1/guests/guest-uuid-1')
        .set(validHeaders);

      expect(response.status).toBe(200);
      expect(guestsService.deleteGuest).toHaveBeenCalledWith(mockUser.id, 'guest-uuid-1');
    });
  });

  describe('GET /api/v1/guests/:guestId/invitation-link', () => {
    it('retrieves the stable invitation link for sharing', async () => {
      const { app, guestsService } = buildGuestsApp();

      const response = await request(app)
        .get('/api/v1/guests/guest-uuid-1/invitation-link')
        .set(validHeaders);

      expect(response.status).toBe(200);
      expect(response.body.data.url).toContain('/invite/test-token-123');
      expect(guestsService.getInvitationLink).toHaveBeenCalledWith(mockUser.id, 'guest-uuid-1');
    });
  });

  describe('POST /api/v1/guests/:guestId/invitation/send', () => {
    it('dispatches invitation email via Resend', async () => {
      const { app, guestsService } = buildGuestsApp();

      const response = await request(app)
        .post('/api/v1/guests/guest-uuid-1/invitation/send')
        .set(validHeaders);

      expect(response.status).toBe(200);
      expect(response.body.data.delivered).toBe(true);
      expect(guestsService.sendInvitation).toHaveBeenCalledWith(mockUser.id, 'guest-uuid-1');
    });
  });

  describe('POST /api/v1/guests/reminders/send', () => {
    it('sends reminder emails to pending guests', async () => {
      const { app, guestsService } = buildGuestsApp();

      const response = await request(app)
        .post('/api/v1/guests/reminders/send')
        .set(validHeaders)
        .send({ scope: 'ALL_PENDING' });

      expect(response.status).toBe(200);
      expect(response.body.data.totalSent).toBe(1);
      expect(guestsService.sendReminders).toHaveBeenCalledTimes(1);
    });
  });

  describe('Public Invitation Endpoints (/api/v1/public/invitations)', () => {
    it('GET /api/v1/public/invitations/:token returns public invitation without login', async () => {
      const { app, guestsService } = buildGuestsApp();

      const response = await request(app).get('/api/v1/public/invitations/test-token-123');

      expect(response.status).toBe(200);
      expect(response.body.data.guest.name).toBe('Rajesh Sharma');
      expect(response.body.data.wedding.title).toBe('Akshay & Princi Wedding');
      expect(guestsService.getPublicInvitation).toHaveBeenCalledWith('test-token-123');
    });

    it('POST /api/v1/public/invitations/:token/rsvp submits RSVP with valid attendee count', async () => {
      const { app, guestsService } = buildGuestsApp();

      const response = await request(app)
        .post('/api/v1/public/invitations/test-token-123/rsvp')
        .set(publicHeaders)
        .send({
          rsvpStatus: 'ATTENDING',
          attendingCount: 3,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.guest.rsvpStatus).toBe('ATTENDING');
      expect(response.body.data.guest.attendingCount).toBe(3);
      expect(guestsService.submitPublicRsvp).toHaveBeenCalledTimes(1);
    });

    it('POST /api/v1/public/invitations/:token/rsvp rejects headcount exceeding maximum capacity', async () => {
      const { app } = buildGuestsApp({
        submitPublicRsvp: jest.fn(async () => {
          throw new AppError(400, 'HEADCOUNT_EXCEEDED', 'You can attend with at most 4 people.');
        }),
      });

      const response = await request(app)
        .post('/api/v1/public/invitations/test-token-123/rsvp')
        .set(publicHeaders)
        .send({
          rsvpStatus: 'ATTENDING',
          attendingCount: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('HEADCOUNT_EXCEEDED');
    });
  });
});
