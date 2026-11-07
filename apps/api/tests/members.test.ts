import express from 'express';
import request from 'supertest';
import { AppError } from '../src/shared/app-error';
import type { AuthOperations } from '../src/modules/auth/routes';
import {
  createMembersRouter,
  createPublicMemberInvitationsRouter,
  createMemberInvitationsRouter,
} from '../src/modules/members/routes';
import type { MembersServiceOperations } from '../src/modules/members/service';
import type {
  MemberSummary,
  MemberInvitationSummary,
  PublicInvitationSummary,
} from '../src/modules/members/schemas';
import { createCsrfToken } from '../src/modules/auth/security';

const mockAdminUser = {
  id: 'user-admin-1',
  email: 'admin@example.com',
  displayName: 'Priya Sharma',
};

const mockManagerUser = {
  id: 'user-manager-2',
  email: 'manager@example.com',
  displayName: 'Rahul Verma',
};

const mockMembersList: MemberSummary[] = [
  {
    id: 'membership-1',
    userId: mockAdminUser.id,
    role: 'ADMIN',
    joinedAt: '2026-10-25T10:00:00.000Z',
    user: {
      id: mockAdminUser.id,
      email: mockAdminUser.email,
      displayName: mockAdminUser.displayName,
    },
  },
  {
    id: 'membership-2',
    userId: mockManagerUser.id,
    role: 'MANAGER',
    joinedAt: '2026-10-26T14:30:00.000Z',
    user: {
      id: mockManagerUser.id,
      email: mockManagerUser.email,
      displayName: mockManagerUser.displayName,
    },
  },
];

const mockInvitation: MemberInvitationSummary = {
  id: 'invitation-1',
  email: 'vikram@example.com',
  role: 'MANAGER',
  status: 'PENDING',
  expiresAt: '2026-11-04T12:00:00.000Z',
  createdAt: '2026-10-28T12:00:00.000Z',
  invitedBy: {
    id: mockAdminUser.id,
    displayName: mockAdminUser.displayName,
    email: mockAdminUser.email,
  },
  inviteUrl: 'http://localhost:1234/invitations/members/sample-token-123',
};

const mockPublicInvitation: PublicInvitationSummary = {
  id: 'invitation-1',
  email: 'vikram@example.com',
  role: 'MANAGER',
  expiresAt: '2026-11-04T12:00:00.000Z',
  wedding: {
    id: 'wedding-1',
    title: "Priya & Rohan's Wedding",
    brideName: 'Priya Sharma',
    groomName: 'Rohan Gupta',
    weddingDate: '2027-02-14',
    location: 'Jaipur, Rajasthan',
  },
  inviter: {
    displayName: 'Priya Sharma',
  },
};

function buildMembersApp(
  serviceOverrides: Partial<MembersServiceOperations> = {},
  authOverrides: Partial<AuthOperations> = {},
) {
  const membersService: MembersServiceOperations = {
    getMembers: jest.fn(async () => mockMembersList),
    inviteMember: jest.fn(async () => mockInvitation),
    getPendingInvitations: jest.fn(async () => [mockInvitation]),
    revokeInvitation: jest.fn(async () => ({ success: true as const })),
    updateMemberRole: jest.fn(async (_userId, membershipId, role) => ({
      ...mockMembersList[1],
      id: membershipId,
      role,
    })),
    removeMember: jest.fn(async () => ({ success: true as const })),
    getPublicInvitation: jest.fn(async () => mockPublicInvitation),
    acceptInvitation: jest.fn(async () => ({
      membership: {
        id: 'new-membership-3',
        weddingId: 'wedding-1',
        role: 'MANAGER' as const,
        joinedAt: '2026-10-28T15:00:00.000Z',
      },
      wedding: {
        id: 'wedding-1',
        title: "Priya & Rohan's Wedding",
        brideName: 'Priya Sharma',
        groomName: 'Rohan Gupta',
      },
    })),
    ...serviceOverrides,
  };

  const authService: AuthOperations = {
    createCsrfToken,
    signup: jest.fn(),
    login: jest.fn(),
    authenticate: jest.fn(async (token) => {
      if (token === 'admin-session') return mockAdminUser;
      if (token === 'manager-session') return mockManagerUser;
      return null;
    }),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    consumeRateLimit: jest.fn(async () => true),
    ...authOverrides,
  };

  const app = express();
  app.use(express.json());
  app.use('/api/v1/members', createMembersRouter(membersService, authService));
  app.use('/api/v1/public/member-invitations', createPublicMemberInvitationsRouter(membersService));
  app.use('/api/v1/member-invitations', createMemberInvitationsRouter(membersService, authService));

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

  return { app, membersService, authService };
}

describe('Wedding Member Management & Team Invitations API', () => {
  const validCsrf = createCsrfToken();
  const adminHeaders = {
    Origin: 'http://localhost:1234',
    Cookie: `mmm_session=admin-session; mmm_csrf=${validCsrf}`,
    'X-CSRF-Token': validCsrf,
  };
  const managerHeaders = {
    Origin: 'http://localhost:1234',
    Cookie: `mmm_session=manager-session; mmm_csrf=${validCsrf}`,
    'X-CSRF-Token': validCsrf,
  };

  describe('GET /api/v1/members', () => {
    it('returns 401 when unauthenticated', async () => {
      const { app } = buildMembersApp();
      const res = await request(app).get('/api/v1/members');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 200 with members list for authenticated member', async () => {
      const { app, membersService } = buildMembersApp();
      const res = await request(app).get('/api/v1/members').set(adminHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].role).toBe('ADMIN');
      expect(res.body.data[1].role).toBe('MANAGER');
      expect(membersService.getMembers).toHaveBeenCalledWith(mockAdminUser.id);
    });
  });

  describe('POST /api/v1/members/invitations', () => {
    it('returns 401 when unauthenticated', async () => {
      const { app } = buildMembersApp();
      const res = await request(app)
        .post('/api/v1/members/invitations')
        .set('Origin', 'http://localhost:1234')
        .set('Cookie', `mmm_csrf=${validCsrf}`)
        .set('X-CSRF-Token', validCsrf)
        .send({ email: 'vikram@example.com', role: 'MANAGER' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('validates email format and role input', async () => {
      const { app } = buildMembersApp();
      const res = await request(app)
        .post('/api/v1/members/invitations')
        .set(adminHeaders)
        .send({ email: 'invalid-email', role: 'SUPERUSER' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('creates an invitation and returns 201 for Admin', async () => {
      const { app, membersService } = buildMembersApp();
      const res = await request(app)
        .post('/api/v1/members/invitations')
        .set(adminHeaders)
        .send({ email: 'vikram@example.com', role: 'MANAGER' });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('vikram@example.com');
      expect(res.body.data.status).toBe('PENDING');
      expect(membersService.inviteMember).toHaveBeenCalledWith(mockAdminUser.id, {
        email: 'vikram@example.com',
        role: 'MANAGER',
      });
    });

    it('returns 403 when a non-admin Manager attempts to invite', async () => {
      const { app } = buildMembersApp({
        inviteMember: jest.fn(async () => {
          throw new AppError(
            403,
            'FORBIDDEN',
            'Only wedding administrators can invite new members.',
          );
        }),
      });

      const res = await request(app)
        .post('/api/v1/members/invitations')
        .set(managerHeaders)
        .send({ email: 'new@example.com', role: 'MANAGER' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 409 when user is already a member', async () => {
      const { app } = buildMembersApp({
        inviteMember: jest.fn(async () => {
          throw new AppError(
            409,
            'CONFLICT',
            'User is already a member of this wedding workspace.',
          );
        }),
      });

      const res = await request(app)
        .post('/api/v1/members/invitations')
        .set(adminHeaders)
        .send({ email: 'existing@example.com', role: 'MANAGER' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('GET /api/v1/members/invitations', () => {
    it('returns 200 with pending invitations for Admin', async () => {
      const { app, membersService } = buildMembersApp();
      const res = await request(app).get('/api/v1/members/invitations').set(adminHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].email).toBe('vikram@example.com');
      expect(membersService.getPendingInvitations).toHaveBeenCalledWith(mockAdminUser.id);
    });
  });

  describe('DELETE /api/v1/members/invitations/:invitationId', () => {
    it('returns 200 when Admin revokes invitation', async () => {
      const { app, membersService } = buildMembersApp();
      const res = await request(app)
        .delete('/api/v1/members/invitations/invitation-1')
        .set(adminHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(membersService.revokeInvitation).toHaveBeenCalledWith(
        mockAdminUser.id,
        'invitation-1',
      );
    });
  });

  describe('PATCH /api/v1/members/:membershipId', () => {
    it('updates role successfully to ADMIN', async () => {
      const { app, membersService } = buildMembersApp();
      const res = await request(app)
        .patch('/api/v1/members/membership-2')
        .set(adminHeaders)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('ADMIN');
      expect(membersService.updateMemberRole).toHaveBeenCalledWith(
        mockAdminUser.id,
        'membership-2',
        'ADMIN',
      );
    });

    it('returns 409 LAST_ADMIN when demoting the only admin', async () => {
      const { app } = buildMembersApp({
        updateMemberRole: jest.fn(async () => {
          throw new AppError(
            409,
            'LAST_ADMIN',
            'A wedding workspace must have at least one administrator.',
          );
        }),
      });

      const res = await request(app)
        .patch('/api/v1/members/membership-1')
        .set(adminHeaders)
        .send({ role: 'MANAGER' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('LAST_ADMIN');
    });
  });

  describe('DELETE /api/v1/members/:membershipId', () => {
    it('removes member successfully', async () => {
      const { app, membersService } = buildMembersApp();
      const res = await request(app).delete('/api/v1/members/membership-2').set(adminHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(membersService.removeMember).toHaveBeenCalledWith(mockAdminUser.id, 'membership-2');
    });

    it('returns 409 LAST_ADMIN when attempting to remove the only admin', async () => {
      const { app } = buildMembersApp({
        removeMember: jest.fn(async () => {
          throw new AppError(
            409,
            'LAST_ADMIN',
            'Cannot remove the only administrator of the wedding workspace.',
          );
        }),
      });

      const res = await request(app).delete('/api/v1/members/membership-1').set(adminHeaders);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('LAST_ADMIN');
    });
  });

  describe('GET /api/v1/public/member-invitations/:token', () => {
    it('returns public invitation preview without authentication', async () => {
      const { app, membersService } = buildMembersApp();
      const res = await request(app).get('/api/v1/public/member-invitations/sample-token-123');

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('vikram@example.com');
      expect(res.body.data.wedding.title).toBe("Priya & Rohan's Wedding");
      expect(membersService.getPublicInvitation).toHaveBeenCalledWith('sample-token-123');
    });

    it('returns 404 when invitation token does not exist', async () => {
      const { app } = buildMembersApp({
        getPublicInvitation: jest.fn(async () => {
          throw new AppError(404, 'NOT_FOUND', 'Invitation link is invalid.');
        }),
      });

      const res = await request(app).get('/api/v1/public/member-invitations/unknown-token');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/v1/member-invitations/:token/accept', () => {
    it('returns 401 when unauthenticated', async () => {
      const { app } = buildMembersApp();
      const res = await request(app)
        .post('/api/v1/member-invitations/sample-token-123/accept')
        .set('Origin', 'http://localhost:1234')
        .set('Cookie', `mmm_csrf=${validCsrf}`)
        .set('X-CSRF-Token', validCsrf);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('returns 403 INVITATION_EMAIL_MISMATCH when signed in user email does not match', async () => {
      const { app } = buildMembersApp({
        acceptInvitation: jest.fn(async () => {
          throw new AppError(
            403,
            'INVITATION_EMAIL_MISMATCH',
            'This invitation was sent to a different email address.',
          );
        }),
      });

      const res = await request(app)
        .post('/api/v1/member-invitations/sample-token-123/accept')
        .set(adminHeaders);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('INVITATION_EMAIL_MISMATCH');
    });

    it('accepts invitation and returns 200 with membership data', async () => {
      const { app, membersService } = buildMembersApp();
      const res = await request(app)
        .post('/api/v1/member-invitations/sample-token-123/accept')
        .set(adminHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.membership.role).toBe('MANAGER');
      expect(res.body.data.wedding.title).toBe("Priya & Rohan's Wedding");
      expect(membersService.acceptInvitation).toHaveBeenCalledWith(
        mockAdminUser.id,
        'sample-token-123',
      );
    });
  });
});
