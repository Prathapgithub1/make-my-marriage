import express from 'express';
import request from 'supertest';
import { AppError } from '../src/shared/app-error';
import type { AuthOperations } from '../src/modules/auth/routes';
import { createWeddingRouter, createDashboardRouter } from '../src/modules/wedding/routes';
import type {
  WeddingServiceOperations,
  WeddingDetail,
  DashboardData,
} from '../src/modules/wedding/service';
import { calculateDaysRemaining } from '../src/modules/wedding/service';
import { generateWeddingSlug } from '../src/modules/wedding/slug';
import { createCsrfToken } from '../src/modules/auth/security';

const mockUser = {
  id: '3a986e0b-9d8f-41b1-925a-5ad8d8137652',
  email: 'aisha@example.com',
  displayName: 'Aisha Rao',
};

const mockWedding: WeddingDetail = {
  id: '11111111-2222-3333-4444-555555555555',
  title: "Aisha & Rohan's Celebration",
  brideName: 'Aisha Rao',
  groomName: 'Rohan Sharma',
  weddingDate: '2026-12-15',
  location: 'The Oberoi Udaivilas, Udaipur',
  city: 'Udaipur',
  state: 'Rajasthan',
  country: 'India',
  description: 'Grand royal wedding',
  website: {
    slug: 'aisha-rohan-15122026',
    isPublished: false,
  },
};

const mockDashboard: DashboardData = {
  wedding: {
    id: mockWedding.id,
    title: mockWedding.title,
    brideName: mockWedding.brideName,
    groomName: mockWedding.groomName,
    weddingDate: mockWedding.weddingDate,
    location: mockWedding.location,
    city: mockWedding.city,
    state: mockWedding.state,
    country: mockWedding.country,
    description: mockWedding.description,
  },
  countdown: {
    weddingDate: '2026-12-15',
    daysRemaining: 120,
  },
  summary: {
    events: 0,
    tasks: { total: 0, completed: 0 },
    guests: 0,
    rsvps: { pending: 0, attending: 0, notAttending: 0 },
    totalExpenseAmount: '0.00',
    vendors: 0,
  },
  upcomingEvents: [],
  upcomingTasks: [],
};

function buildWeddingApp(
  serviceOverrides: Partial<WeddingServiceOperations> = {},
  authOverrides: Partial<AuthOperations> = {},
) {
  const weddingService: WeddingServiceOperations = {
    createWedding: jest.fn(async () => mockWedding),
    getWeddingByUserId: jest.fn(async () => mockWedding),
    updateWedding: jest.fn(async () => mockWedding),
    getDashboard: jest.fn(async () => mockDashboard),
    ...serviceOverrides,
  };

  const authService: AuthOperations = {
    createCsrfToken,
    signup: jest.fn(),
    login: jest.fn(),
    authenticate: jest.fn(async (token) => (token === 'valid-session' ? mockUser : null)),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    consumeRateLimit: jest.fn(async () => true),
    ...authOverrides,
  };

  const app = express();
  app.use(express.json());
  app.use('/api/v1/wedding', createWeddingRouter(weddingService, authService));
  app.use('/api/v1/dashboard', createDashboardRouter(weddingService, authService));
  app.use(
    (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      void _next;
      const appError = error instanceof AppError ? error : undefined;
      res.status(appError?.statusCode ?? 500).json({
        error: {
          code: appError?.code ?? 'INTERNAL_ERROR',
          message: appError?.message ?? 'An unexpected error occurred.',
          ...(appError?.details ? { details: appError.details } : {}),
        },
      });
    },
  );

  return { app, weddingService, authService };
}

describe('Wedding & Dashboard Routes', () => {
  const validCsrf = createCsrfToken();
  const validHeaders = {
    Origin: 'http://localhost:1234',
    Cookie: `mmm_session=valid-session; mmm_csrf=${validCsrf}`,
    'X-CSRF-Token': validCsrf,
  };

  describe('POST /api/v1/wedding', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const { app } = buildWeddingApp();
      const res = await request(app)
        .post('/api/v1/wedding')
        .set('Origin', 'http://localhost:1234')
        .set('Cookie', `mmm_csrf=${validCsrf}`)
        .set('X-CSRF-Token', validCsrf)
        .send({
          title: "Aisha & Rohan's Wedding",
          brideName: 'Aisha Rao',
          groomName: 'Rohan Sharma',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('rejects invalid wedding data with 400 and validation details', async () => {
      const { app } = buildWeddingApp();
      const res = await request(app).post('/api/v1/wedding').set(validHeaders).send({
        title: 'A', // too short (<2)
        brideName: '', // empty
        groomName: '',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
    });

    it('creates a wedding workspace for authenticated user without an existing wedding', async () => {
      const { app, weddingService } = buildWeddingApp();
      const payload = {
        title: "Aisha & Rohan's Celebration",
        brideName: 'Aisha Rao',
        groomName: 'Rohan Sharma',
        weddingDate: '2026-12-15',
        location: 'The Oberoi Udaivilas, Udaipur',
        city: 'Udaipur',
        state: 'Rajasthan',
        country: 'India',
      };

      const res = await request(app).post('/api/v1/wedding').set(validHeaders).send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe(mockWedding.id);
      expect(res.body.data.website.slug).toBe('aisha-rohan-15122026');
      expect(weddingService.createWedding).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining(payload),
      );
    });

    it('rejects creation if user already belongs to a wedding with 409', async () => {
      const { app } = buildWeddingApp({
        createWedding: jest.fn(async () => {
          throw new AppError(
            409,
            'ALREADY_HAS_WEDDING',
            'You already belong to a wedding workspace.',
          );
        }),
      });

      const res = await request(app).post('/api/v1/wedding').set(validHeaders).send({
        title: 'Second Wedding Attempt',
        brideName: 'Aisha Rao',
        groomName: 'Rohan Sharma',
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_HAS_WEDDING');
    });
  });

  describe('GET /api/v1/wedding', () => {
    it('returns wedding workspace for authenticated member', async () => {
      const { app } = buildWeddingApp();
      const res = await request(app)
        .get('/api/v1/wedding')
        .set('Cookie', 'mmm_session=valid-session');

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe(mockWedding.title);
      expect(res.body.data.brideName).toBe('Aisha Rao');
    });

    it('returns 404 if user has no wedding', async () => {
      const { app } = buildWeddingApp({
        getWeddingByUserId: jest.fn(async () => {
          throw new AppError(404, 'NOT_FOUND', 'You do not belong to a wedding workspace.');
        }),
      });

      const res = await request(app)
        .get('/api/v1/wedding')
        .set('Cookie', 'mmm_session=valid-session');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/wedding', () => {
    it('updates wedding workspace details', async () => {
      const { app, weddingService } = buildWeddingApp();
      const res = await request(app).patch('/api/v1/wedding').set(validHeaders).send({
        title: 'Updated Title',
      });

      expect(res.status).toBe(200);
      expect(weddingService.updateWedding).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ title: 'Updated Title' }),
      );
    });

    it('rejects updates from non-admin members with 403', async () => {
      const { app } = buildWeddingApp({
        updateWedding: jest.fn(async () => {
          throw new AppError(
            403,
            'FORBIDDEN',
            'Only wedding administrators can modify wedding details.',
          );
        }),
      });

      const res = await request(app)
        .patch('/api/v1/wedding')
        .set(validHeaders)
        .send({ title: 'Unauthorized Modification' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/dashboard', () => {
    it('returns dashboard data with honest counts and countdown', async () => {
      const { app } = buildWeddingApp();
      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Cookie', 'mmm_session=valid-session');

      expect(res.status).toBe(200);
      expect(res.body.data.wedding.title).toBe(mockWedding.title);
      expect(res.body.data.countdown.daysRemaining).toBe(120);
      expect(res.body.data.summary.events).toBe(0);
      expect(res.body.data.summary.tasks.total).toBe(0);
      expect(res.body.data.summary.guests).toBe(0);
      expect(res.body.data.upcomingEvents).toEqual([]);
      expect(res.body.data.upcomingTasks).toEqual([]);
    });

    it('rejects unauthenticated requests with 401', async () => {
      const { app } = buildWeddingApp();
      const res = await request(app).get('/api/v1/dashboard');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('Helpers: slug and countdown calculation', () => {
    it('generates clean url-friendly slug', () => {
      const slug = generateWeddingSlug('Akshitha Rao', 'Prathap Kumar', '2025-11-14');
      expect(slug).toBe('akshitha-rao-prathap-kumar-14112025');
    });

    it('normalizes diacritics and accents in slug generation', () => {
      const slug = generateWeddingSlug('Renée Rao', 'Zoë Sharma', '2026-12-15');
      expect(slug).toBe('renee-rao-zoe-sharma-15122026');
    });

    it('calculates days remaining accurately', () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);
      const days = calculateDaysRemaining(future);
      expect(days).toBe(10);
    });

    it('calculates days remaining accurately from YYYY-MM-DD date strings', () => {
      const now = new Date();
      const future = new Date();
      future.setDate(now.getDate() + 5);
      const year = future.getFullYear();
      const month = String(future.getMonth() + 1).padStart(2, '0');
      const day = String(future.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const days = calculateDaysRemaining(dateStr);
      expect(days).toBe(5);
    });

    it('returns null days remaining if date is null', () => {
      expect(calculateDaysRemaining(null)).toBeNull();
    });
  });
});
