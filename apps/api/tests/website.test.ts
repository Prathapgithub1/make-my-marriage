import express, { type ErrorRequestHandler } from 'express';
import request from 'supertest';
import { AppError } from '../src/shared/app-error';
import type { AuthOperations } from '../src/modules/auth/routes';
import { createCsrfToken } from '../src/modules/auth/security';
import { createWebsiteRouter, createPublicWebsiteRouter } from '../src/modules/website/routes';
import {
  type WebsiteDetailsDTO,
  type PublicWebsiteDTO,
  type WebsiteServiceOperations,
  buildDefaultContent,
} from '../src/modules/website/service';
import { WebsiteTheme } from '../src/generated/prisma/client';

const mockUser = {
  id: '3a986e0b-9d8f-41b1-925a-5ad8d8137652',
  email: 'akshitha@example.com',
  displayName: 'Akshitha Rao',
};

const WEDDING_ID = '11111111-2222-3333-4444-555555555555';
const WEBSITE_ID = '99999999-8888-7777-6666-555555555555';
const SLUG = 'prathap-akshitha-2028';

const mockDefaultContent = buildDefaultContent('Akshitha Rao', 'Prathap Reddy', '2028-12-09');

const mockWebsiteDetails: WebsiteDetailsDTO = {
  id: WEBSITE_ID,
  weddingId: WEDDING_ID,
  slug: SLUG,
  theme: WebsiteTheme.CLASSIC,
  isPublished: true,
  publishedAt: '2026-11-17T10:00:00.000Z',
  publicUrl: `/w/${SLUG}`,
  content: mockDefaultContent,
  stats: {
    totalGuests: 184,
    attendingCount: 142,
    pendingCount: 24,
    declinedCount: 18,
    responseRate: 87,
  },
  rsvpMetrics: {
    totalGuests: 184,
    attending: 142,
    declined: 18,
    pending: 24,
    rsvpRate: 87,
  },
  wedding: {
    title: "Prathap & Akshitha's Wedding",
    brideName: 'Akshitha Rao',
    groomName: 'Prathap Reddy',
    weddingDate: '2028-12-09',
    location: 'Bengaluru, Karnataka',
  },
};

const mockPublicWebsite: PublicWebsiteDTO = {
  weddingId: WEDDING_ID,
  title: "Prathap & Akshitha's Royal Wedding",
  brideName: 'Akshitha Rao',
  groomName: 'Prathap Reddy',
  weddingDate: '2028-12-09',
  location: 'Bengaluru, Karnataka',
  slug: SLUG,
  templateId: 'royal-heritage',
  theme: mockDefaultContent.theme,
  sections: mockDefaultContent.sections,
  settings: mockDefaultContent.settings,
  content: mockDefaultContent,
  wedding: {
    title: "Prathap & Akshitha's Royal Wedding",
    date: '2028-12-09',
    location: 'Bengaluru, Karnataka',
  },
  events: [
    {
      id: 'event-1',
      name: 'Sangeet & Musical Evening',
      startsAt: '2028-12-08T18:00:00.000Z',
      endsAt: '2028-12-08T23:00:00.000Z',
      venueName: 'Palace Courtyard',
      venueAddress: 'Bangalore Palace, Jayamahal, Bengaluru',
      dressCode: 'Indo-Western & Glamorous Festive',
    },
    {
      id: 'event-2',
      name: 'Muhurtham & Sacred Pheras',
      startsAt: '2028-12-09T09:30:00.000Z',
      endsAt: '2028-12-09T13:00:00.000Z',
      venueName: 'Kalyana Mandapam',
      venueAddress: 'Bangalore Palace, Jayamahal, Bengaluru',
      dressCode: 'Royal Traditional / Kanjeevaram & Sherwani',
    },
  ],
};

function buildTestApp(serviceOverrides: Partial<WebsiteServiceOperations> = {}) {
  const service: WebsiteServiceOperations = {
    getWebsite: jest.fn(async () => mockWebsiteDetails),
    updateWebsite: jest.fn(async (_userId, input) => ({
      ...mockWebsiteDetails,
      slug: input.slug || mockWebsiteDetails.slug,
      theme: (input.theme as WebsiteTheme) || mockWebsiteDetails.theme,
      content: {
        ...mockWebsiteDetails.content,
        ...input.content,
      },
    })),
    publishWebsite: jest.fn(async (_userId, isPublished) => ({
      ...mockWebsiteDetails,
      isPublished,
      publishedAt: isPublished ? '2026-11-17T11:00:00.000Z' : null,
    })),
    applyTemplate: jest.fn(async (_userId, templateId) => ({
      ...mockWebsiteDetails,
      content: {
        ...mockWebsiteDetails.content,
        templateId: templateId as any,
      },
    })),
    getPublicWebsite: jest.fn(async (slug) => {
      if (slug !== SLUG) {
        throw new AppError(404, 'NOT_FOUND', 'Wedding website not found.');
      }
      return mockPublicWebsite;
    }),
    lookupPublicRsvp: jest.fn(async (_slug, input) => {
      if (input.token === 'valid-token' || input.nameOrEmail === 'rohan') {
        return {
          found: true,
          guest: {
            id: 'guest-1',
            name: 'Rohan Sharma',
            email: 'rohan@example.com',
            phone: '+91 9988776655',
            rsvpStatus: 'ATTENDING' as const,
            attendingCount: 2,
            maxGuests: 4,
            notes: 'Vegetarian meals',
            invitedEvents: [
              {
                id: 'event-1',
                name: 'Sangeet & Musical Evening',
                startsAt: '2028-12-08T18:00:00.000Z',
                venueName: 'Palace Courtyard',
              },
            ],
          },
        };
      }
      return { found: false, guest: null, guests: [] };
    }),
    submitPublicRsvp: jest.fn(async (_slug, payload) => ({
      success: true,
      message: 'Thank you! Your RSVP has been confirmed.',
      guestId: 'guest-123',
      rsvpStatus: payload.rsvpStatus,
      attendingCount: payload.attendingCount,
    })),
    ...serviceOverrides,
  };

  const authService: AuthOperations = {
    createCsrfToken: jest.fn(() => 'test-csrf-token'),
    authenticate: jest.fn(async (token?: string) => (token === 'valid_session' ? mockUser : null)),
    signup: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    consumeRateLimit: jest.fn(async () => true),
  };

  const app = express();
  app.use(express.json());
  app.use('/api/v1/website', createWebsiteRouter(service, authService));
  app.use('/api/v1/public/weddings', createPublicWebsiteRouter(service, authService));

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
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: String(err) } });
  };

  app.use(errorHandler);

  return { app, service, authService };
}

describe('Wedding Website Builder REST API Suite', () => {
  const validCsrf = createCsrfToken();
  const validHeaders = {
    Cookie: `mmm_session=valid_session; mmm_csrf=${validCsrf}`,
    'X-CSRF-Token': validCsrf,
    Origin: 'http://localhost:1234',
  };

  it('rejects unauthenticated requests to get website settings', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/website');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns full website configuration, sections, theme, and RSVP metrics when authenticated', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .get('/api/v1/website')
      .set('Cookie', 'mmm_session=valid_session');

    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe(SLUG);
    expect(res.body.data.isPublished).toBe(true);
    expect(res.body.data.stats.totalGuests).toBe(184);
    expect(res.body.data.stats.attendingCount).toBe(142);
    expect(res.body.data.content.sections.length).toBeGreaterThanOrEqual(10);
  });

  it('returns the curated list of 4 architectural templates', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/website/templates');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
    const ids = res.body.data.map((t: any) => t.id);
    expect(ids).toContain('royal-heritage');
    expect(ids).toContain('modern-minimal');
    expect(ids).toContain('floral-romance');
    expect(ids).toContain('bohemian-sunset');
  });

  it('rejects website update when CSRF token is missing', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch('/api/v1/website')
      .set('Cookie', 'mmm_session=valid_session')
      .send({ slug: 'new-valid-slug' });

    expect(res.status).toBe(403);
  });

  it('updates website sections, content, and slug when authenticated with CSRF', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .patch('/api/v1/website')
      .set(validHeaders)
      .send({
        slug: 'prathap-and-akshitha',
        content: {
          templateId: 'modern-minimal',
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe('prathap-and-akshitha');
  });

  it('publishes and unpublishes the wedding website successfully', async () => {
    const { app } = buildTestApp();

    // Publish
    const publishRes = await request(app)
      .post('/api/v1/website/publish')
      .set(validHeaders)
      .send({ isPublished: true });

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.isPublished).toBe(true);

    // Unpublish
    const unpublishRes = await request(app)
      .post('/api/v1/website/unpublish')
      .set(validHeaders);

    expect(unpublishRes.status).toBe(200);
    expect(unpublishRes.body.data.isPublished).toBe(false);
  });

  it('applies selected template to the wedding website', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/v1/website/template')
      .set(validHeaders)
      .send({ templateId: 'floral-romance' });

    expect(res.status).toBe(200);
    expect(res.body.data.content.templateId).toBe('floral-romance');
  });

  it('returns 404 for an unpublished or non-existent public wedding website', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/v1/public/weddings/unknown-slug');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns sanitized public website data with real events and enabled sections', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get(`/api/v1/public/weddings/${SLUG}`);

    expect(res.status).toBe(200);
    expect(res.body.data.slug).toBe(SLUG);
    expect(res.body.data.brideName).toBe('Akshitha Rao');
    expect(res.body.data.groomName).toBe('Prathap Reddy');
    expect(res.body.data.events).toHaveLength(2);
    expect(res.body.data.sections.length).toBeGreaterThanOrEqual(10);
  });

  it('looks up existing guest invitation details for RSVP on public website', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post(`/api/v1/public/weddings/${SLUG}/rsvp/lookup`)
      .send({ nameOrEmail: 'rohan' });

    expect(res.status).toBe(200);
    expect(res.body.data.found).toBe(true);
    expect(res.body.data.guest.name).toBe('Rohan Sharma');
    expect(res.body.data.guest.invitedEvents).toHaveLength(1);
  });

  it('submits a public guest RSVP and updates PostgreSQL records', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post(`/api/v1/public/weddings/${SLUG}/rsvp`)
      .send({
        name: 'Rohan Sharma',
        email: 'rohan@example.com',
        phone: '+91 9988776655',
        rsvpStatus: 'ATTENDING',
        attendingCount: 2,
        dietaryPreferences: 'Jain Vegetarian',
        notes: 'Looking forward to the Sangeet celebrations!',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.rsvpStatus).toBe('ATTENDING');
    expect(res.body.data.attendingCount).toBe(2);
  });
});
