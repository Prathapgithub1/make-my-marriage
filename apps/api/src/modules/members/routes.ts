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
import { inviteMemberSchema, updateMemberRoleSchema } from './schemas';
import { createMembersService, type MembersServiceOperations } from './service';

const defaultMembersService = createMembersService(prisma);

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

export function createMembersRouter(
  service: MembersServiceOperations = defaultMembersService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  // GET /api/v1/members - List members
  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const members = await service.getMembers(user.id);
      res.json({
        data: members,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/members/invitations - Invite a new member (Admin only)
  router.post(
    '/invitations',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        await enforceRateLimit(auth, req, 'member-invitation', 15, 15 * 60 * 1000);
        const parsed = inviteMemberSchema.safeParse(req.body);
        if (!parsed.success) {
          const details = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
            const field = issue.path[0];
            if (typeof field === 'string') acc[field] = issue.message;
            return acc;
          }, {});
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Please provide a valid email and role.',
            details,
          );
        }

        const invitation = await service.inviteMember(user.id, parsed.data);
        res.status(201).json({
          data: invitation,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // GET /api/v1/members/invitations - List pending invitations (Admin only)
  router.get('/invitations', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const invitations = await service.getPendingInvitations(user.id);
      res.json({
        data: invitations,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // DELETE /api/v1/members/invitations/:invitationId - Revoke an invitation (Admin only)
  router.delete(
    '/invitations/:invitationId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const invitationId = getParam(req.params.invitationId);
        const result = await service.revokeInvitation(user.id, invitationId);
        res.json({
          data: result,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // PATCH /api/v1/members/:membershipId - Update role (Admin only)
  router.patch(
    '/:membershipId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const membershipId = getParam(req.params.membershipId);
        const parsed = updateMemberRoleSchema.safeParse(req.body);
        if (!parsed.success) {
          const details = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
            const field = issue.path[0];
            if (typeof field === 'string') acc[field] = issue.message;
            return acc;
          }, {});
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Please select a valid role (ADMIN or MANAGER).',
            details,
          );
        }

        const updated = await service.updateMemberRole(user.id, membershipId, parsed.data.role);
        res.json({
          data: updated,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // DELETE /api/v1/members/:membershipId - Remove member (Admin only)
  router.delete(
    '/:membershipId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const membershipId = getParam(req.params.membershipId);
        const result = await service.removeMember(user.id, membershipId);
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

export function createPublicMemberInvitationsRouter(
  service: MembersServiceOperations = defaultMembersService,
) {
  const router = Router();

  // GET /api/v1/public/member-invitations/:token - Public invitation preview
  router.get('/:token', async (req: Request, res: Response, next) => {
    try {
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

  return router;
}

export function createMemberInvitationsRouter(
  service: MembersServiceOperations = defaultMembersService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  // POST /api/v1/member-invitations/:token/accept - Accept invitation
  router.post(
    '/:token/accept',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        await enforceRateLimit(auth, req, 'member-invitation-accept', 20, 15 * 60 * 1000);
        const token = getParam(req.params.token);
        const result = await service.acceptInvitation(user.id, token);
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

export const membersRouter = createMembersRouter();
export const publicMemberInvitationsRouter = createPublicMemberInvitationsRouter();
export const memberInvitationsRouter = createMemberInvitationsRouter();
