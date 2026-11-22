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
  createGuestSchema,
  updateGuestSchema,
  listGuestsQuerySchema,
  submitRsvpSchema,
  sendRemindersPayloadSchema,
} from './schemas';
import { createGuestsService, type GuestsServiceOperations } from './service';

const defaultGuestsService = createGuestsService(prisma);

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

export function createGuestsRouter(
  service: GuestsServiceOperations = defaultGuestsService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  // POST /api/v1/guests - Create guest
  router.post('/', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = createGuestSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const field = issue.path[0];
          if (typeof field === 'string') acc[field] = issue.message;
          return acc;
        }, {});
        throw new AppError(400, 'VALIDATION_ERROR', 'Check your guest details and try again.', details);
      }

      const guest = await service.createGuest(user.id, parsed.data);
      res.status(201).json({
        data: guest,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/v1/guests - List guests
  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const queryParsed = listGuestsQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        const details = queryParsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const field = issue.path[0];
          if (typeof field === 'string') acc[field] = issue.message;
          return acc;
        }, {});
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters.', details);
      }

      const result = await service.listGuests(user.id, queryParsed.data);
      res.json({
        data: result.data,
        pagination: result.pagination,
        metrics: result.metrics,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/v1/guests/dashboard - Summary stats
  router.get('/dashboard', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const metrics = await service.getGuestDashboard(user.id);
      res.json({
        data: metrics,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/guests/reminders/send - Send manual reminders
  router.post(
    '/reminders/send',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const parsed = sendRemindersPayloadSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Invalid reminder parameters.');
        }

        const result = await service.sendReminders(user.id, parsed.data);
        res.json({
          data: result,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // GET /api/v1/guests/:guestId - Read guest
  router.get('/:guestId', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const guestId = getParam(req.params.guestId);
      const guest = await service.getGuestById(user.id, guestId);
      res.json({
        data: guest,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // PATCH /api/v1/guests/:guestId - Update guest
  router.patch(
    '/:guestId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const guestId = getParam(req.params.guestId);
        const parsed = updateGuestSchema.safeParse(req.body);
        if (!parsed.success) {
          const details = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
            const field = issue.path[0];
            if (typeof field === 'string') acc[field] = issue.message;
            return acc;
          }, {});
          throw new AppError(400, 'VALIDATION_ERROR', 'Check your guest details and try again.', details);
        }

        const updated = await service.updateGuest(user.id, guestId, parsed.data);
        res.json({
          data: updated,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // DELETE /api/v1/guests/:guestId - Delete guest
  router.delete(
    '/:guestId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const guestId = getParam(req.params.guestId);
        const result = await service.deleteGuest(user.id, guestId);
        res.json({
          data: result,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // GET /api/v1/guests/:guestId/invitation-link - Get stable invitation URL
  router.get('/:guestId/invitation-link', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const guestId = getParam(req.params.guestId);
      const result = await service.getInvitationLink(user.id, guestId);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/guests/:guestId/invitation/send - Send invitation email
  router.post(
    '/:guestId/invitation/send',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const guestId = getParam(req.params.guestId);
        const result = await service.sendInvitation(user.id, guestId);
        res.json({
          data: result,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // POST /api/v1/guests/:guestId/invitation/resend - Resend invitation email
  router.post(
    '/:guestId/invitation/resend',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const guestId = getParam(req.params.guestId);
        const result = await service.resendInvitation(user.id, guestId);
        res.json({
          data: result,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // POST /api/v1/guests/:guestId/invitation/revoke - Revoke invitation
  router.post(
    '/:guestId/invitation/revoke',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const guestId = getParam(req.params.guestId);
        const result = await service.revokeInvitation(user.id, guestId);
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

export function createPublicInvitationsRouter(
  service: GuestsServiceOperations = defaultGuestsService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  // GET /api/v1/public/invitations/:token - View public invitation
  router.get('/:token', async (req: Request, res: Response, next) => {
    try {
      await enforceRateLimit(auth, req, 'public-invitation-view', 60, 60 * 1000);
      const token = getParam(req.params.token);
      const result = await service.getPublicInvitation(token);
      res.json({
        data: result,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/public/invitations/:token/rsvp - Submit or update RSVP
  router.post(
    '/:token/rsvp',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        await enforceRateLimit(auth, req, 'public-invitation-rsvp', 20, 15 * 60 * 1000);
        const token = getParam(req.params.token);
        const parsed = submitRsvpSchema.safeParse(req.body);
        if (!parsed.success) {
          const details = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
            const field = issue.path[0];
            if (typeof field === 'string') acc[field] = issue.message;
            return acc;
          }, {});
          throw new AppError(400, 'VALIDATION_ERROR', 'Check your RSVP response.', details);
        }

        const result = await service.submitPublicRsvp(token, parsed.data);
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

export const guestsRouter = createGuestsRouter();
export const publicInvitationsRouter = createPublicInvitationsRouter();

