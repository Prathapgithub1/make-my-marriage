import { Router, type Request, type Response } from 'express';
import { prisma } from '../../infrastructure/database/pool';
import { AppError } from '../../shared/app-error';
import { parseCookies, SESSION_COOKIE } from '../auth/security';
import {
  authService as defaultAuthService,
  enforceRateLimit,
  getRequestId,
  requireCsrf,
  requireSameOrigin,
  type AuthOperations,
} from '../auth/routes';
import {
  applyTemplateSchema,
  lookupRsvpSchema,
  publicRsvpSubmissionSchema,
  publishWebsiteSchema,
  updateWebsiteSchema,
} from './schemas';
import type { PrismaClient } from '../../generated/prisma/client';
import {
  createWebsiteService,
  TEMPLATE_PRESETS,
  type WebsiteServiceOperations,
} from './service';

const defaultWebsiteService = createWebsiteService(prisma as PrismaClient);

async function requireAuthUser(req: Request, auth: AuthOperations) {
  const sessionToken = parseCookies(req.header('Cookie'))[SESSION_COOKIE];
  const user = await auth.authenticate(sessionToken);
  if (!user) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  }
  return user;
}

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

function formatZodDetails(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return issues.reduce<Record<string, string>>((acc, issue) => {
    const field = issue.path[0];
    if (typeof field === 'string') {
      acc[field] = issue.message;
    }
    return acc;
  }, {});
}

export function createWebsiteRouter(
  service: WebsiteServiceOperations = defaultWebsiteService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  // 1. Get website settings, content, theme & RSVP metrics
  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const website = await service.getWebsite(user.id);
      res.json({
        data: website,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 2. List available website templates
  router.get('/templates', async (_req: Request, res: Response, next) => {
    try {
      const templates = Object.entries(TEMPLATE_PRESETS).map(([id, info]) => ({
        id,
        name: info.name,
        category: info.category,
        theme: info.theme,
      }));
      res.json({
        data: templates,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 3. Update website content, theme, or slug
  router.patch('/', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = updateWebsiteSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Check your website changes and try again.',
          formatZodDetails(parsed.error.issues),
        );
      }

      const updated = await service.updateWebsite(user.id, parsed.data);
      res.json({
        data: updated,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 4. Publish website
  router.post('/publish', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = publishWebsiteSchema.safeParse(req.body);
      const isPublished = parsed.success ? parsed.data.isPublished : true;
      const result = await service.publishWebsite(user.id, isPublished);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 5. Unpublish website
  router.post('/unpublish', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const result = await service.publishWebsite(user.id, false);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 6. Apply template
  router.post('/template', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = applyTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid template ID.',
          formatZodDetails(parsed.error.issues),
        );
      }

      const result = await service.applyTemplate(user.id, parsed.data.templateId);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function createPublicWebsiteRouter(
  service: WebsiteServiceOperations = defaultWebsiteService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  // 1. Get public website by slug
  router.get('/:slug', async (req: Request, res: Response, next) => {
    try {
      await enforceRateLimit(auth, req, 'public-wedding-view', 120, 60 * 1000);
      const slug = getParam(req.params.slug);
      const website = await service.getPublicWebsite(slug);
      res.json({
        data: website,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 2. Lookup RSVP by guest name/email/token
  router.post('/:slug/rsvp/lookup', async (req: Request, res: Response, next) => {
    try {
      await enforceRateLimit(auth, req, 'public-wedding-rsvp-lookup', 30, 60 * 1000);
      const slug = getParam(req.params.slug);
      const parsed = lookupRsvpSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid lookup parameters.', formatZodDetails(parsed.error.issues));
      }

      const result = await service.lookupPublicRsvp(slug, parsed.data);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // 3. Submit public RSVP
  router.post('/:slug/rsvp', async (req: Request, res: Response, next) => {
    try {
      await enforceRateLimit(auth, req, 'public-wedding-rsvp-submit', 20, 15 * 60 * 1000);
      const slug = getParam(req.params.slug);
      const parsed = publicRsvpSubmissionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Check your RSVP details and try again.',
          formatZodDetails(parsed.error.issues),
        );
      }

      const result = await service.submitPublicRsvp(slug, parsed.data);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export const websiteRouter = createWebsiteRouter();
export const publicWebsiteRouter = createPublicWebsiteRouter();
