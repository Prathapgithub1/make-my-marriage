import '@testing-library/jest-dom';
Object.assign((process as unknown as { env: Record<string, string> }).env, {
  AUTH_DEMO_MODE: 'false',
});

Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  value: jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/auth/csrf')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { csrfToken: 'test-csrf-token.signature' } }),
      } as Response;
    }
    if (url.endsWith('/auth/me')) {
      return {
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' } }),
      } as Response;
    }
    if (url.endsWith('/auth/signup')) {
      const body = JSON.parse(String(init?.body ?? '{}')) as {
        name: string;
        email: string;
        password: string;
      };
      if (body.email === 'existing@example.com') {
        return {
          ok: false,
          status: 409,
          json: async () => ({
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'An account with this email already exists.',
            },
          }),
        } as Response;
      }
      return {
        ok: true,
        status: 201,
        json: async () => ({
          data: {
            user: { id: 'test-user', email: body.email.toLowerCase(), name: body.name },
            hasWedding: false,
          },
        }),
      } as Response;
    }
    if (url.endsWith('/auth/login')) {
      const body = JSON.parse(String(init?.body ?? '{}')) as { email: string };
      if (body.email !== 'aisha@example.com') {
        return {
          ok: false,
          status: 401,
          json: async () => ({
            error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
          }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            user: { id: 'test-user', email: body.email, name: 'Aisha Rao' },
            hasWedding: false,
          },
        }),
      } as Response;
    }
    if (url.endsWith('/auth/forgot-password')) {
      const body = JSON.parse(String(init?.body ?? '{}')) as { email: string };
      if (body.email === 'unconfigured@example.com') {
        return {
          ok: false,
          status: 503,
          json: async () => ({
            error: {
              code: 'PASSWORD_RESET_UNAVAILABLE',
              message:
                'Password reset email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL in the API .env file, then restart the backend.',
            },
          }),
        } as Response;
      }
      return {
        ok: true,
        status: 202,
        json: async () => ({
          data: {
            message:
              'Request received. If an account exists, you may receive reset instructions. Your password has not been changed.',
          },
        }),
      } as Response;
    }
    if (url.endsWith('/wedding')) {
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}')) as {
          title?: string;
          brideName?: string;
          groomName?: string;
        };
        if (body.title === 'Conflict') {
          return {
            ok: false,
            status: 409,
            json: async () => ({
              error: {
                code: 'ALREADY_HAS_WEDDING',
                message: 'You already belong to a wedding workspace.',
              },
            }),
          } as Response;
        }
        if (!body.title || body.title.trim().length < 2) {
          return {
            ok: false,
            status: 400,
            json: async () => ({
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Check your wedding details and try again.',
                details: { title: 'Wedding name must be at least 2 characters' },
              },
            }),
          } as Response;
        }
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 'test-wedding-id',
              title: body.title,
              brideName: body.brideName ?? 'Akshitha Rao',
              groomName: body.groomName ?? 'Prathap Kumar',
              weddingDate: '2025-11-14',
              location: 'The Oberoi Udaivilas, Udaipur',
              website: { slug: 'akshitha-prathap-14112025', isPublished: false },
            },
          }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: 'test-wedding-id',
            title: "Prathap & Akshitha's Wedding",
            brideName: 'Akshitha Rao',
            groomName: 'Prathap Kumar',
            weddingDate: '2025-11-14',
            location: 'The Oberoi Udaivilas, Udaipur',
            website: { slug: 'akshitha-prathap-14112025', isPublished: false },
          },
        }),
      } as Response;
    }
    if (url.endsWith('/dashboard')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            wedding: {
              id: 'test-wedding-id',
              title: "Prathap & Akshitha's Wedding",
              brideName: 'Akshitha Rao',
              groomName: 'Prathap Kumar',
              weddingDate: '2025-11-14',
              location: 'The Oberoi Udaivilas, Udaipur',
            },
            countdown: { weddingDate: '2025-11-14', daysRemaining: 120 },
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
          },
        }),
      } as Response;
    }
    if (url.includes('/public/member-invitations')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: 'test-invitation-id',
            email: 'vikram@example.com',
            role: 'MANAGER',
            expiresAt: '2026-11-04T12:00:00.000Z',
            wedding: {
              id: 'test-wedding-id',
              title: "Prathap & Akshitha's Wedding",
              brideName: 'Akshitha Rao',
              groomName: 'Prathap Kumar',
              weddingDate: '2025-11-14',
              location: 'The Oberoi Udaivilas, Udaipur',
            },
            inviter: {
              displayName: 'Akshitha Rao',
            },
          },
        }),
      } as Response;
    }
    if (url.includes('/member-invitations') && url.endsWith('/accept')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            membership: {
              id: 'test-membership-id',
              weddingId: 'test-wedding-id',
              role: 'MANAGER',
              joinedAt: '2026-10-28T00:00:00.000Z',
            },
            wedding: {
              id: 'test-wedding-id',
              title: "Prathap & Akshitha's Wedding",
              brideName: 'Akshitha Rao',
              groomName: 'Prathap Kumar',
            },
          },
        }),
      } as Response;
    }
    if (url.includes('/members/invitations')) {
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body ?? '{}')) as { email: string; role: string };
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 'new-invitation-id',
              email: body.email,
              role: body.role,
              status: 'PENDING',
              expiresAt: '2026-11-04T12:00:00.000Z',
              createdAt: '2026-10-28T12:00:00.000Z',
              invitedBy: {
                id: 'test-user',
                displayName: 'Akshitha Rao',
                email: 'akshitha@example.com',
              },
              inviteUrl: 'http://localhost:1234/invitations/members/sample-token',
              emailDelivery: {
                delivered: true,
              },
            },
          }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 'pending-invitation-1',
              email: 'family@example.com',
              role: 'MANAGER',
              status: 'PENDING',
              expiresAt: '2026-11-04T12:00:00.000Z',
              createdAt: '2026-10-28T12:00:00.000Z',
              invitedBy: {
                id: 'test-user',
                displayName: 'Akshitha Rao',
                email: 'akshitha@example.com',
              },
            },
          ],
        }),
      } as Response;
    }
    if (url.endsWith('/members')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 'member-1',
              userId: 'test-user',
              role: 'ADMIN',
              joinedAt: '2026-10-25T00:00:00.000Z',
              user: {
                id: 'test-user',
                email: 'akshitha@example.com',
                displayName: 'Akshitha Rao',
              },
            },
            {
              id: 'member-2',
              userId: 'manager-user',
              role: 'MANAGER',
              joinedAt: '2026-10-26T00:00:00.000Z',
              user: {
                id: 'manager-user',
                email: 'manager@example.com',
                displayName: 'Rohan Sharma',
              },
            },
          ],
        }),
      } as Response;
    }
    return { ok: true, status: 200, json: async () => ({ data: { success: true } }) } as Response;
  }),
});

declare const require: (id: string) => { TextDecoder: unknown; TextEncoder: unknown };
const { TextDecoder, TextEncoder } = require('node:util');

// React Router's browser APIs expect these globals in Jest's jsdom environment.
Object.defineProperty(globalThis, 'TextDecoder', { configurable: true, value: TextDecoder });
Object.defineProperty(globalThis, 'TextEncoder', { configurable: true, value: TextEncoder });
