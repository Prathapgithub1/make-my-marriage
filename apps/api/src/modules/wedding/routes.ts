import { Router, type Request, type Response } from 'express';
import { prisma } from '../../infrastructure/database/pool';
import { AppError } from '../../shared/app-error';
import { parseCookies, SESSION_COOKIE } from '../auth/security';
import {
  authService as defaultAuthService,
  getRequestId,
  requireCsrf,
  requireSameOrigin,
  type AuthOperations,
} from '../auth/routes';
import { createWeddingSchema, updateWeddingSchema } from './schemas';
import { createWeddingService, type WeddingServiceOperations } from './service';

const defaultWeddingService = createWeddingService(prisma);

async function requireAuthUser(req: Request, auth: AuthOperations) {
  const sessionToken = parseCookies(req.header('Cookie'))[SESSION_COOKIE];
  const user = await auth.authenticate(sessionToken);
  if (!user) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  }
  return user;
}

export function createWeddingRouter(
  service: WeddingServiceOperations = defaultWeddingService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  router.post('/', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = createWeddingSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const field = issue.path[0];
          if (typeof field === 'string') acc[field] = issue.message;
          return acc;
        }, {});
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Check your wedding details and try again.',
          details,
        );
      }

      const result = await service.createWedding(user.id, parsed.data);
      res.status(201).json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const result = await service.getWeddingByUserId(user.id);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = updateWeddingSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const field = issue.path[0];
          if (typeof field === 'string') acc[field] = issue.message;
          return acc;
        }, {});
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Check your wedding details and try again.',
          details,
        );
      }

      const result = await service.updateWedding(user.id, parsed.data);
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

export function createDashboardRouter(
  service: WeddingServiceOperations = defaultWeddingService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const result = await service.getDashboard(user.id);
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

export const weddingRouter = createWeddingRouter();
export const dashboardRouter = createDashboardRouter();
