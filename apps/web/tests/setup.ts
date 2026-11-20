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
    if (url.includes('/guests')) {
      const method = (init?.method ?? 'GET').toUpperCase();
      const sampleGuests = [
        {
          id: 'guest-1',
          weddingId: 'test-wedding-id',
          name: 'Aarav Sharma',
          email: 'aarav@example.com',
          phone: '+91 98765 43210',
          maxGuests: 2,
          rsvpStatus: 'ATTENDING',
          attendingCount: 2,
          rsvpRespondedAt: '2026-11-05T10:00:00.000Z',
          invitationToken: 'test-invite-token-1',
          invitationSentAt: '2026-11-01T10:00:00.000Z',
          lastReminderSentAt: null,
          reminderCount: 0,
          notes: 'Close college friend',
          invitedEvents: [
            {
              id: 'event-1',
              name: 'Sangeet & Cocktail',
              startsAt: '2026-12-10T18:00:00.000Z',
              venueName: 'The Grand Palace',
            },
          ],
          createdAt: '2026-11-01T10:00:00.000Z',
          updatedAt: '2026-11-05T10:00:00.000Z',
        },
        {
          id: 'guest-2',
          weddingId: 'test-wedding-id',
          name: 'Pooja Verma',
          email: 'pooja@example.com',
          phone: null,
          maxGuests: 1,
          rsvpStatus: 'PENDING',
          attendingCount: 0,
          rsvpRespondedAt: null,
          invitationToken: 'test-invite-token-2',
          invitationSentAt: null,
          lastReminderSentAt: null,
          reminderCount: 0,
          notes: null,
          invitedEvents: [],
          createdAt: '2026-11-02T10:00:00.000Z',
          updatedAt: '2026-11-02T10:00:00.000Z',
        },
      ];

      if (url.includes('/invitation-link')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              url: 'http://localhost:1234/invite/test-invite-token-1',
              token: 'test-invite-token-1',
              guestId: 'guest-1',
              guestName: 'Aarav Sharma',
            },
          }),
        } as Response;
      }

      if (url.includes('/invitation/send') || url.includes('/invitation/resend')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { success: true, delivered: true },
          }),
        } as Response;
      }

      if (url.includes('/reminders/send')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: { totalEligible: 1, totalSent: 1, totalFailed: 0 },
          }),
        } as Response;
      }

      if (method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}'));
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 'guest-new-1',
              weddingId: 'test-wedding-id',
              name: body.name,
              email: body.email ?? null,
              phone: body.phone ?? null,
              maxGuests: body.maxGuests ?? 1,
              rsvpStatus: 'PENDING',
              attendingCount: 0,
              rsvpRespondedAt: null,
              invitationToken: 'token-new-1',
              invitationSentAt: null,
              lastReminderSentAt: null,
              reminderCount: 0,
              notes: body.notes ?? null,
              invitedEvents: [],
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
              ...sampleGuests[0],
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
            data: { success: true, id: 'guest-1' },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: sampleGuests,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
          },
          metrics: {
            totalGuests: 2,
            pendingRsvps: 1,
            attendingGuests: 1,
            notAttendingGuests: 0,
            expectedAttendeeCount: 2,
            invitationsSentCount: 1,
          },
        }),
      } as Response;
    }

    if (url.includes('/public/invitations')) {
      const publicData = {
        guest: {
          name: 'Aarav Sharma',
          maxGuests: 2,
          rsvpStatus: 'PENDING',
          attendingCount: 0,
          rsvpRespondedAt: null,
        },
        wedding: {
          id: 'test-wedding-id',
          title: "Prathap & Akshitha's Wedding",
          brideName: 'Akshitha',
          groomName: 'Prathap',
          weddingDate: '2026-12-12',
          location: 'The Oberoi Rajvilas',
          city: 'Jaipur',
          state: 'Rajasthan',
          description: 'A celebration of love, friendship, and family.',
        },
        invitedEvents: [
          {
            id: 'event-1',
            name: 'Sangeet & Cocktail',
            description: 'Music, dancing and dinner',
            startsAt: '2026-12-11T18:00:00.000Z',
            endsAt: '2026-12-11T23:00:00.000Z',
            venueName: 'The Grand Ballroom',
            venueAddress: 'Jaipur, Rajasthan',
            dressCode: 'Indo-Western Festive',
          },
          {
            id: 'event-2',
            name: 'Wedding Ceremony',
            description: 'Holy nuptials and Pheras',
            startsAt: '2026-12-12T10:00:00.000Z',
            endsAt: '2026-12-12T14:00:00.000Z',
            venueName: 'The Royal Mandap',
            venueAddress: 'Jaipur, Rajasthan',
            dressCode: 'Traditional Royal',
          },
        ],
      };

      if (url.includes('/rsvp')) {
        const body = JSON.parse(String(init?.body ?? '{}'));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              ...publicData,
              guest: {
                ...publicData.guest,
                rsvpStatus: body.rsvpStatus,
                attendingCount: body.attendingCount,
                rsvpRespondedAt: new Date().toISOString(),
              },
            },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: publicData,
        }),
      } as Response;
    }

    if (url.includes('/expenses/budget/events/')) {
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'DELETE') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: { deleted: true } }),
        } as Response;
      }
      const body = JSON.parse(String(init?.body ?? '{}')) as {
        allocatedBudget?: string | number;
        notes?: string | null;
      };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            eventId: 'event-1',
            eventName: 'Sangeet Night',
            startsAt: '2026-12-11T18:00:00.000Z',
            eventStatus: 'PLANNED',
            allocatedBudget: Number(body.allocatedBudget ?? 600000).toFixed(2),
            hasAllocatedBudget: true,
            spentAmount: '250000.00',
            paidAmount: '100000.00',
            pendingAmount: '150000.00',
            remainingBudget: (Number(body.allocatedBudget ?? 600000) - 250000).toFixed(2),
            utilizationPercent: 41.7,
            isOverBudget: false,
            expenseCount: 1,
            notes: body.notes ?? null,
          },
        }),
      } as Response;
    }

    if (url.includes('/expenses/budget')) {
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'PUT') {
        const body = JSON.parse(String(init?.body ?? '{}')) as {
          totalBudget?: string | number;
          notes?: string | null;
        };
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              weddingId: 'test-wedding-id',
              totalBudget: Number(body.totalBudget ?? 2500000).toFixed(2),
              currency: 'INR',
              notes: body.notes ?? null,
              hasBudgetConfigured: true,
              updatedAt: '2026-11-12T10:00:00.000Z',
            },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            weddingBudget: {
              weddingId: 'test-wedding-id',
              totalBudget: '2500000.00',
              currency: 'INR',
              notes: 'Master celebration budget',
              hasBudgetConfigured: true,
              updatedAt: '2026-11-12T10:00:00.000Z',
            },
            summary: {
              totalBudget: '2500000.00',
              totalAllocatedToEvents: '600000.00',
              unallocatedBudget: '1900000.00',
              totalSpent: '250000.00',
              totalPaid: '100000.00',
              totalPending: '150000.00',
              remainingBudget: '2250000.00',
              budgetUtilizationPercent: 10,
              paymentCompletionPercent: 40,
              isOverBudget: false,
              overBudgetAmount: '0.00',
              expenseCount: 1,
              totalRecordCount: 1,
              cancelledCount: 0,
              cancelledAmount: '0.00',
              overdueCount: 0,
              overdueAmount: '0.00',
            },
            eventBudgets: [
              {
                eventId: 'event-1',
                eventName: 'Sangeet Night',
                startsAt: '2026-12-11T18:00:00.000Z',
                eventStatus: 'PLANNED',
                allocatedBudget: '600000.00',
                hasAllocatedBudget: true,
                spentAmount: '250000.00',
                paidAmount: '100000.00',
                pendingAmount: '150000.00',
                remainingBudget: '350000.00',
                utilizationPercent: 41.7,
                isOverBudget: false,
                expenseCount: 1,
                notes: 'Sound and stage lighting',
              },
            ],
            unassignedEventExpenses: {
              spentAmount: '0.00',
              paidAmount: '0.00',
              pendingAmount: '0.00',
              expenseCount: 0,
            },
          },
        }),
      } as Response;
    }

    if (url.includes('/expenses/analytics') || url.includes('/expenses/summary')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            summary: {
              totalBudget: '2500000.00',
              totalAllocatedToEvents: '600000.00',
              unallocatedBudget: '1900000.00',
              totalSpent: '250000.00',
              totalPaid: '100000.00',
              totalPending: '150000.00',
              remainingBudget: '2250000.00',
              budgetUtilizationPercent: 10,
              paymentCompletionPercent: 40,
              isOverBudget: false,
              overBudgetAmount: '0.00',
              expenseCount: 1,
              totalRecordCount: 1,
              cancelledCount: 0,
              cancelledAmount: '0.00',
              overdueCount: 0,
              overdueAmount: '0.00',
              hasBudgetConfigured: true,
              currency: 'INR',
              vendorCount: 1,
            },
            byCategory: [
              {
                category: 'CATERING',
                count: 1,
                totalAmount: '250000.00',
                paidAmount: '100000.00',
                pendingAmount: '150000.00',
                sharePercent: 100,
              },
            ],
            byEvent: [
              {
                eventId: 'event-1',
                eventName: 'Sangeet Night',
                startsAt: '2026-12-11T18:00:00.000Z',
                eventStatus: 'PLANNED',
                allocatedBudget: '600000.00',
                hasAllocatedBudget: true,
                spentAmount: '250000.00',
                paidAmount: '100000.00',
                pendingAmount: '150000.00',
                remainingBudget: '350000.00',
                utilizationPercent: 41.7,
                isOverBudget: false,
                expenseCount: 1,
                notes: null,
              },
            ],
            unassignedEventExpenses: {
              spentAmount: '0.00',
              paidAmount: '0.00',
              pendingAmount: '0.00',
              expenseCount: 0,
            },
            byPaymentStatus: [
              {
                paymentStatus: 'PARTIAL',
                count: 1,
                totalAmount: '250000.00',
                paidAmount: '100000.00',
              },
            ],
            byPaymentMethod: [
              {
                paymentMethod: 'BANK_TRANSFER',
                count: 1,
                totalAmount: '250000.00',
                paidAmount: '100000.00',
              },
            ],
            byVendor: [
              {
                vendorId: 'vendor-1',
                vendorName: 'Royal Heritage Catering',
                count: 1,
                totalAmount: '250000.00',
                paidAmount: '100000.00',
              },
            ],
            monthlyTrend: [
              {
                month: '2026-11',
                label: 'Nov 2026',
                count: 1,
                totalAmount: '250000.00',
                paidAmount: '100000.00',
              },
            ],
          },
        }),
      } as Response;
    }

    if (url.includes('/expenses')) {
      const method = (init?.method ?? 'GET').toUpperCase();
      const baseExpense = {
        id: 'expense-1',
        weddingId: 'test-wedding-id',
        eventId: 'event-1',
        eventName: 'Sangeet Night',
        vendorId: 'vendor-1',
        vendorName: 'Royal Heritage Catering',
        vendorCategory: 'CATERING',
        createdByUserId: 'test-user',
        createdByName: 'Aisha Rao',
        title: 'Sangeet Chaat & Live Counters',
        category: 'CATERING',
        amount: '250000.00',
        paidAmount: '100000.00',
        remainingAmount: '150000.00',
        currency: 'INR',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'BANK_TRANSFER',
        spentAt: '2026-11-10',
        dueDate: '2026-12-01',
        paidBy: 'Aisha Rao',
        referenceNumber: 'NEFT-1001',
        notes: 'Initial token deposit',
        createdAt: '2026-11-10T10:00:00.000Z',
        updatedAt: '2026-11-10T10:00:00.000Z',
      };

      if (method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
        const amt = Number(body.amount ?? 50000);
        const paid = Number(body.paidAmount ?? 0);
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              ...baseExpense,
              id: 'expense-new',
              title: String(body.title ?? 'New Expense'),
              category: String(body.category ?? 'OTHER'),
              amount: amt.toFixed(2),
              paidAmount: paid.toFixed(2),
              remainingAmount: Math.max(0, amt - paid).toFixed(2),
              paymentStatus: String(body.paymentStatus ?? 'PENDING'),
            },
          }),
        } as Response;
      }

      if (method === 'PATCH') {
        const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              ...baseExpense,
              ...body,
              paidAmount: Number(body.paidAmount ?? baseExpense.amount).toFixed(2),
              remainingAmount: '0.00',
              paymentStatus: 'PAID',
            },
          }),
        } as Response;
      }

      if (method === 'DELETE') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: { deleted: true } }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [baseExpense],
          pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
          totals: {
            filteredAmount: '250000.00',
            filteredPaidAmount: '100000.00',
            filteredRemainingAmount: '150000.00',
          },
        }),
      } as Response;
    }

    if (url.includes('/vendors/dashboard')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            kpis: {
              totalVendors: 16,
              categoriesCount: 8,
              confirmedVendors: 11,
              confirmedPercentage: 68.8,
              shortlistedVendors: 4,
              negotiatingVendors: 2,
              pendingSignatures: 2,
              vendorBudgetCap: '3250000.00',
              totalAllocated: '2680000.00',
              totalAmountPaid: '1980000.00',
              paidPercentage: 60.9,
              remainingBalance: '1270000.00',
              upcoming14Days: '320000.00',
            },
            pipelineFunnel: [
              { stage: 'SHORTLISTED', label: '1. Shortlisted', count: 4, percentage: 25 },
              { stage: 'CONTACTED', label: '2. Initial Contact & Quoting', count: 3, percentage: 18.8 },
              { stage: 'NEGOTIATING', label: '3. Contract Negotiation', count: 2, percentage: 12.5 },
              { stage: 'CONFIRMED', label: '4. Confirmed & Retainer Paid', count: 11, percentage: 68.8 },
              { stage: 'COMPLETED', label: '5. Event Executed & Settled', count: 0, percentage: 0 },
            ],
            budgetByTier: [
              { category: 'VENUE', label: 'Venues & Palaces', allocated: '1500000.00', paid: '1500000.00', vendorsCount: 2, sharePercent: 46.2 },
              { category: 'DECORATION', label: 'Mandap & Florals', allocated: '650000.00', paid: '260000.00', vendorsCount: 1, sharePercent: 20 },
              { category: 'PHOTOGRAPHY', label: 'Photo & Cinema', allocated: '450000.00', paid: '225000.00', vendorsCount: 1, sharePercent: 13.8 },
              { category: 'CATERING', label: 'Royal Catering', allocated: '380000.00', paid: '0.00', vendorsCount: 1, sharePercent: 11.7 },
            ],
            upcomingMilestones: [
              {
                id: 'm-1',
                title: 'Sangeet Acoustic Soundcheck & Stage Rigging',
                vendorName: 'Royal Lotus Decorators',
                category: 'DECORATION',
                ceremonyName: 'Sangeet Musical',
                serviceDate: '2026-11-20T10:00:00.000Z',
                status: 'CONFIRMED',
              },
            ],
            recentActivity: [
              {
                id: 'act-1',
                type: 'BOOKING_CREATED',
                title: 'Design Approval',
                vendorName: 'Royal Lotus Decorators',
                timestamp: '2026-11-14T08:00:00.000Z',
                details: 'Stage 2 mandap CAD rendering approved by Akshitha.',
              },
            ],
          },
        }),
      } as Response;
    }

    if (url.includes('/vendors/bookings')) {
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 'booking-new',
              weddingId: 'test-wedding-id',
              vendorId: 'vendor-1',
              vendorName: 'Royal Heritage Catering',
              category: 'CATERING',
              eventId: (body.eventId as string | null) ?? null,
              eventName: 'Reception & Grand Banquet',
              expenseId: 'exp-sync-1',
              serviceName: String(body.serviceName ?? 'Grand Buffet'),
              status: 'CONFIRMED',
              bookingDate: '2026-11-14',
              serviceDate: '2026-12-09',
              agreedAmount: String(body.agreedAmount ?? '1250000.00'),
              advancePayment: String(body.advancePayment ?? '500000.00'),
              paidAmount: String(body.advancePayment ?? '500000.00'),
              balanceDue: '750000.00',
              contractUrl: null,
              contractRef: 'RHC-2026-001',
              notes: null,
              createdAt: '2026-11-14T10:00:00.000Z',
              updatedAt: '2026-11-14T10:00:00.000Z',
              paymentsCount: 1,
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
              id: 'booking-1',
              weddingId: 'test-wedding-id',
              vendorId: 'vendor-1',
              vendorName: 'Royal Heritage Catering',
              category: 'CATERING',
              eventId: 'event-1',
              eventName: 'Reception & Grand Banquet',
              expenseId: 'exp-1',
              serviceName: 'Grand Royal Buffet',
              status: 'CONFIRMED',
              bookingDate: '2026-11-01',
              serviceDate: '2026-12-09',
              agreedAmount: '1250000.00',
              advancePayment: '500000.00',
              paidAmount: '500000.00',
              balanceDue: '750000.00',
              contractUrl: null,
              contractRef: 'RHC-2026-001',
              notes: 'Full catering setup included',
              createdAt: '2026-11-01T10:00:00.000Z',
              updatedAt: '2026-11-01T10:00:00.000Z',
              paymentsCount: 1,
            },
          ],
        }),
      } as Response;
    }

    if (url.includes('/vendors/payments')) {
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 'pay-new',
              weddingId: 'test-wedding-id',
              bookingId: 'booking-1',
              vendorId: 'vendor-1',
              vendorName: 'Royal Heritage Catering',
              expenseId: 'exp-1',
              amount: String(body.amount ?? '250000.00'),
              paymentDate: String(body.paymentDate ?? '2026-11-14'),
              paymentStatus: 'PAID',
              paymentMethod: String(body.paymentMethod ?? 'BANK_TRANSFER'),
              paidBy: (body.paidBy as string | null) ?? 'Host',
              referenceNumber: (body.referenceNumber as string | null) ?? 'TXN123456',
              notes: null,
              createdAt: '2026-11-14T10:00:00.000Z',
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
              id: 'pay-1',
              weddingId: 'test-wedding-id',
              bookingId: 'booking-1',
              vendorId: 'vendor-1',
              vendorName: 'Royal Heritage Catering',
              expenseId: 'exp-1',
              amount: '500000.00',
              paymentDate: '2026-11-01',
              paymentStatus: 'PAID',
              paymentMethod: 'BANK_TRANSFER',
              paidBy: 'Akshitha Rao',
              referenceNumber: 'NEFT88991122',
              notes: 'Initial booking retainer',
              createdAt: '2026-11-01T10:00:00.000Z',
            },
          ],
        }),
      } as Response;
    }

    if (url.includes('/vendors/calendar')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 'cal-1',
              type: 'SERVICE',
              date: '2026-12-09T18:00:00.000Z',
              vendorId: 'vendor-1',
              vendorName: 'Royal Heritage Catering',
              category: 'CATERING',
              title: 'Dinner Service & Live Chaat Counters',
              amount: '1250000.00',
              status: 'CONFIRMED',
              ceremonyName: 'Reception & Grand Banquet',
            },
          ],
        }),
      } as Response;
    }

    if (url.includes('/vendors/comparison')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 'vendor-1',
              weddingId: 'test-wedding-id',
              name: 'Royal Heritage Catering',
              category: 'CATERING',
              contactName: 'Vikram Singh',
              phone: '+91 9876543210',
              email: 'vikram@catering.example.com',
              website: 'https://royalheritage.com',
              address: 'Palace Road, Bengaluru',
              city: 'Bengaluru',
              state: 'Karnataka',
              coverImageUrl: null,
              description: 'Specializing in royal Awadhi and Rajasthani wedding feasts.',
              pricing: '₹2,500 per plate',
              priceRange: 'PREMIUM',
              rating: 4.9,
              status: 'CONFIRMED',
              isFavorite: true,
              notes: 'Provide 3 tasting menus',
              services: [
                {
                  id: 'svc-1',
                  name: 'Royal Buffet Feast',
                  description: 'Multi-course luxury spread for 500 guests',
                  price: '1250000.00',
                  isIncluded: true,
                },
              ],
              events: [{ id: 'event-1', name: 'Reception & Grand Banquet' }],
              bookingsCount: 1,
              totalAgreed: '1250000.00',
              totalPaid: '500000.00',
              balanceDue: '750000.00',
              createdAt: '2026-11-01T10:00:00.000Z',
              updatedAt: '2026-11-01T10:00:00.000Z',
            },
          ],
        }),
      } as Response;
    }

    if (url.includes('/vendors')) {
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'POST') {
        const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
        return {
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: 'vendor-new',
              weddingId: 'test-wedding-id',
              name: String(body.name ?? 'New Vendor'),
              category: String(body.category ?? 'OTHER'),
              contactName: (body.contactName as string | null) ?? null,
              phone: (body.phone as string | null) ?? null,
              email: (body.email as string | null) ?? null,
              website: (body.website as string | null) ?? null,
              address: null,
              city: 'Bengaluru',
              state: 'Karnataka',
              coverImageUrl: null,
              description: null,
              pricing: null,
              priceRange: 'PREMIUM',
              rating: 4.8,
              status: 'SHORTLISTED',
              isFavorite: false,
              notes: null,
              services: [],
              events: [],
              bookingsCount: 0,
              totalAgreed: '0.00',
              totalPaid: '0.00',
              balanceDue: '0.00',
              createdAt: '2026-11-12T10:00:00.000Z',
              updatedAt: '2026-11-12T10:00:00.000Z',
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
              id: 'vendor-1',
              weddingId: 'test-wedding-id',
              name: 'Royal Heritage Catering',
              category: 'CATERING',
              contactName: 'Vikram Singh',
              phone: '+91 9876543210',
              email: 'vikram@catering.example.com',
              website: 'https://royalheritage.com',
              address: 'Palace Road, Bengaluru',
              city: 'Bengaluru',
              state: 'Karnataka',
              coverImageUrl: null,
              description: 'Specializing in royal Awadhi and Rajasthani wedding feasts.',
              pricing: '₹2,500 per plate',
              priceRange: 'PREMIUM',
              rating: 4.9,
              status: 'CONFIRMED',
              isFavorite: true,
              notes: 'Provide 3 tasting menus',
              services: [
                {
                  id: 'svc-1',
                  name: 'Royal Buffet Feast',
                  description: 'Multi-course luxury spread for 500 guests',
                  price: '1250000.00',
                  isIncluded: true,
                },
              ],
              events: [{ id: 'event-1', name: 'Reception & Grand Banquet' }],
              bookingsCount: 1,
              totalAgreed: '1250000.00',
              totalPaid: '500000.00',
              balanceDue: '750000.00',
              createdAt: '2026-11-01T10:00:00.000Z',
              updatedAt: '2026-11-01T10:00:00.000Z',
            },
          ],
          pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
        }),
      } as Response;
    }

    if (url.includes('/website/templates')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { id: 'royal-heritage', name: 'Royal Heritage', category: 'TRADITIONAL & PALACE', theme: 'CLASSIC' },
            { id: 'modern-minimal', name: 'Modern Minimal', category: 'CONTEMPORARY & URBAN', theme: 'MINIMAL' },
            { id: 'floral-romance', name: 'Floral Romance', category: 'GARDEN & BOTANICAL', theme: 'MODERN' },
            { id: 'bohemian-sunset', name: 'Bohemian Sunset', category: 'DESTINATION & COASTAL', theme: 'MODERN' },
          ],
        }),
      } as Response;
    }

    if (url.includes('/website/publish')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: 'ws-123',
            slug: 'prathap-and-akshitha',
            isPublished: true,
            publishedAt: '2026-11-17T10:00:00.000Z',
            publicUrl: '/w/prathap-and-akshitha',
          },
        }),
      } as Response;
    }

    if (url.includes('/website/unpublish')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: 'ws-123',
            slug: 'prathap-and-akshitha',
            isPublished: false,
            publishedAt: null,
            publicUrl: '/w/prathap-and-akshitha',
          },
        }),
      } as Response;
    }

    if (url.includes('/public/weddings') && url.includes('/rsvp/lookup')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            found: true,
            guest: {
              id: 'guest-1',
              firstName: 'Rohith',
              lastName: 'Sharma',
              email: 'rohith@example.com',
              phone: '+91 9999999999',
              rsvpStatus: 'ATTENDING',
              plusOnes: 1,
              dietaryRestrictions: 'Vegetarian',
            },
            events: [],
          },
        }),
      } as Response;
    }

    if (url.includes('/public/weddings') && url.includes('/rsvp')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            success: true,
            message: 'RSVP confirmed! We look forward to celebrating together.',
            guestId: 'guest-1',
          },
        }),
      } as Response;
    }

    if (url.includes('/public/weddings/')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: 'ws-123',
            slug: 'prathap-and-akshitha',
            isPublished: true,
            publishedAt: '2026-11-17T10:00:00.000Z',
            wedding: {
              title: "Prathap & Akshitha's Wedding",
              date: '2025-11-24',
              location: 'Bangalore Palace, Bengaluru',
            },
            content: {
              templateId: 'royal-heritage',
              sections: [
                {
                  id: 'sec-hero',
                  type: 'HERO',
                  title: 'Hero Welcome',
                  isEnabled: true,
                  order: 0,
                  data: {
                    headline: 'We are getting married!',
                    subtitle: 'Two souls, one heart, together forever.',
                    showCountdown: true,
                    primaryButtonText: 'RSVP Now',
                    secondaryButtonText: 'View Schedule',
                  },
                },
                {
                  id: 'sec-couple',
                  type: 'COUPLE',
                  title: 'The Couple',
                  isEnabled: true,
                  order: 1,
                  data: {
                    subheading: 'Meet the Bride & Groom',
                    groom: { name: 'Prathap Reddy', title: 'The Groom', bio: 'Architect & traveler.' },
                    bride: { name: 'Akshitha Rao', title: 'The Bride', bio: 'Painter & dancer.' },
                  },
                },
                {
                  id: 'sec-events',
                  type: 'EVENTS',
                  title: 'Ceremony Schedule',
                  isEnabled: true,
                  order: 2,
                  data: {
                    headline: 'Ceremonies & Celebrations',
                    subtitle: 'Join us across three days of celebrations.',
                  },
                },
              ],
              theme: {
                palette: {
                  primary: '#883A32',
                  secondary: '#4C654D',
                  background: '#FAF7F2',
                  card: '#FFFFFF',
                  text: '#1E1B18',
                  accent: '#C29B38',
                },
                typography: {
                  headingFont: 'Playfair Display, serif',
                  bodyFont: 'Plus Jakarta Sans, sans-serif',
                },
                buttonStyle: { shape: 'pill', variant: 'filled' },
                cardStyle: { borderRadius: 'lg', elevation: 'ambient' },
              },
              settings: {
                title: "Prathap & Akshitha's Wedding",
                visibility: 'PUBLIC',
                allowOpenRsvp: true,
                showCountdown: true,
              },
            },
            events: [
              {
                id: 'ev-1',
                name: 'Traditional Muhurtham',
                type: 'WEDDING',
                startTime: '2025-11-24T09:30:00Z',
                endTime: '2025-11-24T13:30:00Z',
                venueName: 'Bangalore Palace',
                venueAddress: 'Bengaluru',
                dressCode: 'Traditional Silk',
                description: 'Sacred ceremony',
              },
            ],
          },
        }),
      } as Response;
    }

    if (url.match(/\/website(?:\?.*)?$/)) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: 'ws-123',
            weddingId: 'test-wedding-id',
            slug: 'prathap-and-akshitha',
            theme: 'CLASSIC',
            isPublished: false,
            publishedAt: null,
            content: {
              templateId: 'royal-heritage',
              sections: [
                {
                  id: 'sec-hero',
                  type: 'HERO',
                  title: 'Hero Welcome',
                  isEnabled: true,
                  order: 0,
                  data: {
                    headline: 'We are getting married!',
                    subtitle: 'Two souls, one heart, together forever.',
                    showCountdown: true,
                    primaryButtonText: 'RSVP Now',
                    secondaryButtonText: 'View Schedule',
                  },
                },
                {
                  id: 'sec-couple',
                  type: 'COUPLE',
                  title: 'The Couple',
                  isEnabled: true,
                  order: 1,
                  data: {
                    subheading: 'Meet the Bride & Groom',
                    groom: { name: 'Prathap Reddy', title: 'The Groom', bio: 'Architect' },
                    bride: { name: 'Akshitha Rao', title: 'The Bride', bio: 'Painter' },
                  },
                },
                {
                  id: 'sec-story',
                  type: 'STORY',
                  title: 'Our Story',
                  isEnabled: true,
                  order: 2,
                  data: {
                    title: 'How Our Story Began',
                    intro: 'From coffee to forever',
                    milestones: [
                      { year: '2021', title: 'First Meeting', description: 'Met at coffee shop' },
                    ],
                  },
                },
                {
                  id: 'sec-events',
                  type: 'EVENTS',
                  title: 'Ceremony Schedule',
                  isEnabled: true,
                  order: 3,
                  data: {
                    headline: 'Ceremonies & Celebrations',
                    subtitle: 'Schedule of rituals',
                  },
                },
                {
                  id: 'sec-venue',
                  type: 'VENUE',
                  title: 'Venue & Destination',
                  isEnabled: true,
                  order: 4,
                  data: {
                    venueName: 'The Leela Palace',
                    address: 'Bengaluru',
                  },
                },
                {
                  id: 'sec-gallery',
                  type: 'GALLERY',
                  title: 'Photo Gallery',
                  isEnabled: true,
                  order: 5,
                  data: {
                    title: 'Memories',
                    images: [],
                  },
                },
                {
                  id: 'sec-family',
                  type: 'FAMILY',
                  title: 'Families & Entourage',
                  isEnabled: true,
                  order: 6,
                  data: {
                    members: [],
                  },
                },
                {
                  id: 'sec-travel',
                  type: 'TRAVEL',
                  title: 'Travel & Accommodations',
                  isEnabled: true,
                  order: 7,
                  data: {
                    hotels: [],
                  },
                },
                {
                  id: 'sec-rsvp',
                  type: 'RSVP',
                  title: 'Guest RSVP',
                  isEnabled: true,
                  order: 8,
                  data: {
                    headline: 'Kindly Respond',
                  },
                },
                {
                  id: 'sec-contact',
                  type: 'CONTACT',
                  title: 'Wedding Concierge',
                  isEnabled: true,
                  order: 9,
                  data: {
                    headline: 'Need Assistance?',
                    phone: '+91 9876543210',
                  },
                },
                {
                  id: 'sec-footer',
                  type: 'FOOTER',
                  title: 'Closing & Hashtag',
                  isEnabled: true,
                  order: 10,
                  data: {
                    hashtag: '#PrathapWedsAkshitha',
                  },
                },
              ],
              theme: {
                palette: {
                  primary: '#883A32',
                  secondary: '#4C654D',
                  background: '#FAF7F2',
                  card: '#FFFFFF',
                  text: '#1E1B18',
                  accent: '#C29B38',
                },
                typography: {
                  headingFont: 'Playfair Display, serif',
                  bodyFont: 'Plus Jakarta Sans, sans-serif',
                },
                buttonStyle: { shape: 'pill', variant: 'filled' },
                cardStyle: { borderRadius: 'lg', elevation: 'ambient' },
              },
              settings: {
                title: "Prathap & Akshitha's Wedding",
                visibility: 'PUBLIC',
                allowOpenRsvp: true,
                showCountdown: true,
              },
            },
            publicUrl: '/w/prathap-and-akshitha',
            rsvpMetrics: {
              totalGuests: 184,
              attending: 142,
              declined: 18,
              pending: 24,
              rsvpRate: 87,
            },
            createdAt: '2026-11-01T10:00:00.000Z',
            updatedAt: '2026-11-01T10:00:00.000Z',
          },
        }),
      } as Response;
    }

    if (url.includes('/gallery/summary')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            totalPhotos: 24,
            totalVideos: 4,
            totalAlbums: 3,
            storageBytesUsed: 157286400,
            storageFormatted: '150 MB',
            recentMedia: [],
          },
        }),
      } as Response;
    }

    if (url.includes('/gallery/albums')) {
      if (init?.method === 'POST') {
        const body = JSON.parse(String(init.body || '{}'));
        return {
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: {
              id: 'new-alb-id',
              weddingId: 'test-wedding-id',
              name: body.name || 'New Album',
              description: body.description || null,
              eventId: body.eventId || null,
              eventName: 'Haldi',
              coverImageKey: null,
              coverImageUrl: null,
              mediaCount: 0,
              createdAt: '2026-11-17T10:00:00.000Z',
              updatedAt: '2026-11-17T10:00:00.000Z',
            },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [
            {
              id: 'alb-1',
              weddingId: 'test-wedding-id',
              name: 'Mehendi & Sangeet',
              description: 'Vibrant celebration with flowers and music',
              eventId: 'evt-1',
              eventName: 'Mehendi',
              coverImageKey: 'cover.jpg',
              coverImageUrl: 'https://example.com/cover1.jpg',
              mediaCount: 16,
              createdAt: '2026-11-10T10:00:00.000Z',
              updatedAt: '2026-11-10T10:00:00.000Z',
            },
            {
              id: 'alb-2',
              weddingId: 'test-wedding-id',
              name: 'Haldi Ceremony',
              description: 'Yellow hues and turmeric rituals',
              eventId: 'evt-2',
              eventName: 'Haldi',
              coverImageKey: null,
              coverImageUrl: null,
              mediaCount: 8,
              createdAt: '2026-11-11T10:00:00.000Z',
              updatedAt: '2026-11-11T10:00:00.000Z',
            },
          ],
        }),
      } as Response;
    }

    if (url.includes('/gallery/media')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            media: [
              {
                id: 'med-1',
                weddingId: 'test-wedding-id',
                albumId: 'alb-1',
                albumName: 'Mehendi & Sangeet',
                eventId: 'evt-1',
                eventName: 'Mehendi',
                uploadedByUserId: 'test-user',
                s3ObjectKey: 'weddings/test/gallery/photo1.jpg',
                originalFileName: 'bride_mehndi_hands.jpg',
                mimeType: 'image/jpeg',
                sizeBytes: 2048576,
                mediaType: 'IMAGE',
                uploadStatus: 'UPLOADED',
                caption: 'Intricate bridal henna design',
                width: 1920,
                height: 1080,
                durationSeconds: null,
                viewUrl: 'https://example.com/photo1.jpg',
                downloadUrl: 'https://example.com/photo1.jpg?download=bride_mehndi_hands.jpg',
                createdAt: '2026-11-10T11:00:00.000Z',
                uploadedAt: '2026-11-10T11:01:00.000Z',
              },
              {
                id: 'med-2',
                weddingId: 'test-wedding-id',
                albumId: 'alb-1',
                albumName: 'Mehendi & Sangeet',
                eventId: 'evt-1',
                eventName: 'Mehendi',
                uploadedByUserId: 'test-user',
                s3ObjectKey: 'weddings/test/gallery/video1.mp4',
                originalFileName: 'sangeet_dance_clip.mp4',
                mimeType: 'video/mp4',
                sizeBytes: 15485760,
                mediaType: 'VIDEO',
                uploadStatus: 'UPLOADED',
                caption: 'Family flash mob dance performance',
                width: 1920,
                height: 1080,
                durationSeconds: 45,
                viewUrl: 'https://example.com/video1.mp4',
                downloadUrl: 'https://example.com/video1.mp4?download=sangeet_dance_clip.mp4',
                createdAt: '2026-11-10T12:00:00.000Z',
                uploadedAt: '2026-11-10T12:02:00.000Z',
              },
            ],
            pagination: {
              page: 1,
              limit: 30,
              total: 2,
              totalPages: 1,
            },
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
