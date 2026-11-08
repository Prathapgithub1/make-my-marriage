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
import { createEventSchema, updateEventSchema, listEventsQuerySchema } from './schemas';
import { createEventsService, type EventsServiceOperations } from './service';

const defaultEventsService = createEventsService(prisma);

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

export function createEventsRouter(
  service: EventsServiceOperations = defaultEventsService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  // POST /api/v1/events - Create an event
  router.post('/', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = createEventSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const field = issue.path[0];
          if (typeof field === 'string') acc[field] = issue.message;
          return acc;
        }, {});
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Check your event details and try again.',
          details,
        );
      }

      const event = await service.createEvent(user.id, parsed.data);
      res.status(201).json({
        data: event,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/v1/events - List events
  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const queryParsed = listEventsQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        const details = queryParsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const field = issue.path[0];
          if (typeof field === 'string') acc[field] = issue.message;
          return acc;
        }, {});
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters.', details);
      }

      const result = await service.listEvents(user.id, queryParsed.data);
      res.json({
        data: result.events,
        metrics: result.metrics,
        pagination: result.pagination,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/v1/events/:eventId - Get event details
  router.get('/:eventId', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const eventId = getParam(req.params.eventId);
      const event = await service.getEventById(user.id, eventId);
      res.json({
        data: event,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // PATCH /api/v1/events/:eventId - Update event
  router.patch(
    '/:eventId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const eventId = getParam(req.params.eventId);
        const parsed = updateEventSchema.safeParse(req.body);
        if (!parsed.success) {
          const details = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
            const field = issue.path[0];
            if (typeof field === 'string') acc[field] = issue.message;
            return acc;
          }, {});
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Check your event updates and try again.',
            details,
          );
        }

        const updated = await service.updateEvent(user.id, eventId, parsed.data);
        res.json({
          data: updated,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // DELETE /api/v1/events/:eventId - Delete event
  router.delete(
    '/:eventId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const eventId = getParam(req.params.eventId);
        const result = await service.deleteEvent(user.id, eventId);
        res.json({
          data: result,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

export const eventsRouter = createEventsRouter();
