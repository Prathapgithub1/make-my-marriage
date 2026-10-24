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
    return { ok: true, status: 200, json: async () => ({ data: { success: true } }) } as Response;
  }),
});

declare const require: (id: string) => { TextDecoder: unknown; TextEncoder: unknown };
const { TextDecoder, TextEncoder } = require('node:util');

// React Router's browser APIs expect these globals in Jest's jsdom environment.
Object.defineProperty(globalThis, 'TextDecoder', { configurable: true, value: TextDecoder });
Object.defineProperty(globalThis, 'TextEncoder', { configurable: true, value: TextEncoder });
