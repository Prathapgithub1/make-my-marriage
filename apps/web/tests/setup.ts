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
    if (url.includes('/events')) {
      const method = (init?.method ?? 'GET').toUpperCase();
      const sampleEvents = [
        {
          id: 'event-1',
          weddingId: 'test-wedding-id',
          name: 'Sangeet & Cocktail',
          description: 'An evening of music and dance',
          startsAt: '2026-12-10T18:00:00.000Z',
          endsAt: '2026-12-10T23:30:00.000Z',
          venueName: 'The Grand Palace',
          venueAddress: 'Palace Road, Jaipur',
          dressCode: 'Indo-Western Glamour',
          coverImageKey: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
          status: 'CONFIRMED',
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-01T10:00:00.000Z',
        },
        {
          id: 'event-2',
          weddingId: 'test-wedding-id',
          name: 'Wedding Ceremony',
          description: 'Auspicious wedding ceremony',
          startsAt: '2026-12-11T10:00:00.000Z',
          endsAt: '2026-12-11T14:00:00.000Z',
          venueName: 'The Royal Mandap',
          venueAddress: 'Fort Road, Jaipur',
          dressCode: 'Royal Traditional',
          coverImageKey: null,
          status: 'PLANNED',
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-01T10:00:00.000Z',
        },
      ];

      if (method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 'new-event-id',
              weddingId: 'test-wedding-id',
              name: body.name,
              description: body.description ?? null,
              startsAt: body.startsAt ?? null,
              endsAt: body.endsAt ?? null,
              venueName: body.venueName ?? null,
              venueAddress: body.venueAddress ?? null,
              dressCode: body.dressCode ?? null,
              coverImageKey: body.coverImageKey ?? null,
              status: body.status ?? 'PLANNED',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        } as Response;
      }

      if (method === 'PATCH') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              ...sampleEvents[0],
              ...body,
              updatedAt: new Date().toISOString(),
            },
          }),
        } as Response;
      }

      if (method === 'DELETE') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { success: true, id: 'event-1', message: 'Event deleted successfully.' },
          }),
        } as Response;
      }

      if (url.match(/\/events\/[a-zA-Z0-9-]+$/) && !url.includes('?')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: sampleEvents[0] }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            events: sampleEvents,
            metrics: {
              total: 2,
              upcoming: 2,
              completed: 0,
              cancelled: 0,
            },
            pagination: {
              page: 1,
              limit: 50,
              total: 2,
              totalPages: 1,
            },
          },
        }),
      } as Response;
    }
    if (url.includes('/tasks')) {
      const method = (init?.method ?? 'GET').toUpperCase();
      const sampleTasks = [
        {
          id: 'task-1',
          weddingId: 'test-wedding-id',
          title: 'Finalize floral palette & Mandap structure',
          description: 'Coordinate with wedding florist for marigold and jasmine selection.',
          status: 'TO_DO',
          priority: 'HIGH',
          dueDate: '2026-11-20T10:00:00.000Z',
          completedAt: null,
          eventId: 'event-1',
          event: { id: 'event-1', name: 'Sangeet & Cocktail' },
          assignedMemberId: 'member-1',
          assignedMember: {
            id: 'member-1',
            role: 'ADMIN',
            name: 'Akshitha Rao',
            email: 'akshitha@example.com',
          },
          createdByUserId: 'test-user',
          isOverdue: false,
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-01T10:00:00.000Z',
        },
        {
          id: 'task-2',
          weddingId: 'test-wedding-id',
          title: 'Confirm guest dietary requirements with catering',
          description: 'Ensure Jain and vegan food options are noted.',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          dueDate: '2026-11-25T10:00:00.000Z',
          completedAt: null,
          eventId: null,
          event: null,
          assignedMemberId: null,
          assignedMember: null,
          createdByUserId: 'test-user',
          isOverdue: false,
          createdAt: '2026-11-02T10:00:00.000Z',
          updatedAt: '2026-11-02T10:00:00.000Z',
        },
      ];

      if (method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 'task-new-1',
              weddingId: 'test-wedding-id',
              title: body.title,
              description: body.description ?? null,
              status: body.status ?? 'TO_DO',
              priority: body.priority ?? 'MEDIUM',
              dueDate: body.dueDate ?? null,
              completedAt: null,
              eventId: body.eventId ?? null,
              event: null,
              assignedMemberId: body.assignedMemberId ?? null,
              assignedMember: null,
              createdByUserId: 'test-user',
              isOverdue: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        } as Response;
      }

      if (method === 'PATCH') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              ...sampleTasks[0],
              ...body,
            },
          }),
        } as Response;
      }

      if (method === 'DELETE') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { success: true, id: 'task-1', message: 'Task deleted successfully.' },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: sampleTasks,
          pagination: {
            page: 1,
            limit: 15,
            total: 2,
            totalPages: 1,
          },
          summary: {
            total: 2,
            todo: 1,
            inProgress: 1,
            completed: 0,
            overdue: 0,
          },
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
