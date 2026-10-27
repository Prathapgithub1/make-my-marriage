import express from 'express';
import request from 'supertest';
import { AppError } from '../src/shared/app-error';
import { createAuthRouter } from '../src/modules/auth/routes';
import type { AuthOperations } from '../src/modules/auth/routes';
import { createCsrfToken } from '../src/modules/auth/security';
import { signupSchema, resetPasswordSchema } from '../src/modules/auth/schemas';
import { createAuthService, createConsoleMailer } from '../src/modules/auth/service';
import type { PrismaClient } from '../src/generated/prisma/client';

const user = {
  id: '3a986e0b-9d8f-41b1-925a-5ad8d8137652',
  email: 'aisha@example.com',
  displayName: 'Aisha Rao',
};
const authResult = { user, hasWedding: false as const, sessionToken: 'session-token' };
const signupResult = { user, hasWedding: false as const, sessionToken: 'session-token' };

function buildAuthApp(overrides: Partial<AuthOperations> = {}) {
  const operations: AuthOperations = {
    createCsrfToken,
    signup: jest.fn(async () => signupResult),
    login: jest.fn(async () => authResult),
    authenticate: jest.fn(async (token) => (token === 'session-token' ? user : null)),
    logout: jest.fn(async () => undefined),
    forgotPassword: jest.fn(async () => undefined),
    resetPassword: jest.fn(async () => 'ok'),
    consumeRateLimit: jest.fn(async () => true),
    ...overrides,
  };
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', createAuthRouter(operations));
  app.use(
    (error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      void _next;
      const appError = error instanceof AppError ? error : undefined;
      res.status(appError?.statusCode ?? 500).json({
        error: { code: appError?.code ?? 'ERROR', message: appError?.message ?? 'Error' },
      });
    },
  );
  return { app, operations };
}

async function csrfHeaders(app: express.Express) {
  const response = await request(app).get('/api/v1/auth/csrf');
  return {
    token: response.body.data.csrfToken as string,
    cookie: `mmm_csrf=${encodeURIComponent(response.body.data.csrfToken)}`,
  };
}

function protectedPost(app: express.Express, path: string, token: string, cookie: string) {
  return request(app)
    .post(`/api/v1/auth/${path}`)
    .set('Origin', 'http://localhost:1234')
    .set('X-CSRF-Token', token)
    .set('Cookie', cookie);
}

describe('authentication routes', () => {
  it('creates an account, creates a session, and sets the session cookie on signup', async () => {
    const { app, operations } = buildAuthApp();
    const csrf = await csrfHeaders(app);
    const response = await protectedPost(app, 'signup', csrf.token, csrf.cookie).send({
      name: ' Aisha Rao ',
      email: ' Aisha@Example.com ',
      password: 'a sufficiently long password',
    });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({
      user: { id: user.id, email: user.email, name: user.displayName },
      hasWedding: false,
    });
    const cookies = response.headers['set-cookie'];
    const cookieHeader = Array.isArray(cookies) ? cookies.join(';') : (cookies ?? '');
    expect(cookieHeader).toContain('mmm_session=');
    expect(operations.signup).toHaveBeenCalledWith(
      'Aisha Rao',
      'aisha@example.com',
      'a sufficiently long password',
      expect.any(String),
    );
  });

  it('signs in with valid credentials and sets the session cookie', async () => {
    const { app, operations } = buildAuthApp();
    const csrf = await csrfHeaders(app);
    const response = await protectedPost(app, 'login', csrf.token, csrf.cookie).send({
      email: user.email,
      password: 'a sufficiently long password',
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      user: { id: user.id, email: user.email, name: user.displayName },
      hasWedding: false,
    });
    const cookies = response.headers['set-cookie'];
    const cookieHeader = Array.isArray(cookies) ? cookies.join(';') : (cookies ?? '');
    expect(cookieHeader).toContain('mmm_session=');
    expect(operations.login).toHaveBeenCalledWith(user.email, 'a sufficiently long password');
  });

  it('rejects a cross-site request and a missing CSRF token', async () => {
    const { app } = buildAuthApp();
    const csrf = await csrfHeaders(app);
    const rejectedOrigin = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'https://attacker.example')
      .set('X-CSRF-Token', csrf.token)
      .set('Cookie', csrf.cookie)
      .send({ email: user.email, password: 'password' });
    const missingToken = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:1234')
      .send({ email: user.email, password: 'password' });

    expect(rejectedOrigin.status).toBe(403);
    expect(missingToken.status).toBe(403);
  });

  it('allows same-origin API requests from the Swagger UI host', async () => {
    const { app } = buildAuthApp();
    const csrf = await csrfHeaders(app);
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Host', 'api-docs.example.test')
      .set('Origin', 'http://api-docs.example.test')
      .set('X-CSRF-Token', csrf.token)
      .set('Cookie', csrf.cookie)
      .send({ email: user.email, password: 'a sufficiently long password' });

    expect(response.status).toBe(200);
  });

  it('returns the same invalid-credentials response for an unknown email', async () => {
    const { app } = buildAuthApp({
      login: jest.fn(async () => {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
      }),
    });
    const csrf = await csrfHeaders(app);
    const response = await protectedPost(app, 'login', csrf.token, csrf.cookie).send({
      email: 'unknown@example.com',
      password: 'a sufficiently long password',
    });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid email or password.');
  });

  it('rejects duplicate email registration and applies the configured rate limit', async () => {
    const duplicateApp = buildAuthApp({
      signup: jest.fn(async () => {
        throw new AppError(
          409,
          'EMAIL_ALREADY_EXISTS',
          'An account with this email already exists.',
        );
      }),
    }).app;
    const duplicateCsrf = await csrfHeaders(duplicateApp);
    const duplicate = await protectedPost(
      duplicateApp,
      'signup',
      duplicateCsrf.token,
      duplicateCsrf.cookie,
    ).send({ name: 'Aisha Rao', email: user.email, password: 'a sufficiently long password' });

    const limitedApp = buildAuthApp({ consumeRateLimit: jest.fn(async () => false) }).app;
    const limitCsrf = await csrfHeaders(limitedApp);
    const limited = await protectedPost(
      limitedApp,
      'login',
      limitCsrf.token,
      limitCsrf.cookie,
    ).send({ name: 'Aisha Rao', email: user.email, password: 'a sufficiently long password' });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('RATE_LIMITED');
  });

  it('logs in, restores the session, and revokes it on logout', async () => {
    const { app, operations } = buildAuthApp();
    const csrf = await csrfHeaders(app);
    const login = await protectedPost(app, 'login', csrf.token, csrf.cookie).send({
      email: user.email,
      password: 'a sufficiently long password',
    });
    const cookies = login.headers['set-cookie'];
    const sessionCookie = (Array.isArray(cookies) ? cookies : [cookies]).find((cookie) =>
      cookie?.startsWith('mmm_session='),
    );
    const restored = await request(app).get('/api/v1/auth/me').set('Cookie', sessionCookie);
    const logout = await protectedPost(
      app,
      'logout',
      csrf.token,
      `${csrf.cookie}; mmm_session=session-token`,
    );

    expect(login.status).toBe(200);
    expect(restored.body.data.user).toEqual({
      id: user.id,
      email: user.email,
      name: user.displayName,
    });
    expect(restored.body.data).toMatchObject({
      hasWedding: false,
      membership: null,
      wedding: null,
    });
    expect(logout.body.data.success).toBe(true);
    expect(operations.logout).toHaveBeenCalledWith('session-token');
  });

  it('keeps forgot-password responses generic and handles invalid or expired reset links', async () => {
    const { app } = buildAuthApp({ resetPassword: jest.fn(async () => 'invalid') });
    const csrf = await csrfHeaders(app);
    const forgot = await protectedPost(app, 'forgot-password', csrf.token, csrf.cookie).send({
      email: user.email,
    });
    const invalid = await protectedPost(app, 'reset-password', csrf.token, csrf.cookie).send({
      token: 'a-valid-shape-reset-token-123456',
      newPassword: 'a sufficiently long password',
    });

    expect(forgot.status).toBe(202);
    expect(forgot.body.data.message).toMatch(/if an account exists/i);
    expect(forgot.body.data.message).toMatch(/password has not been changed/i);
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('INVALID_TOKEN');
  });

  it('reports unavailable reset email without pretending a request was completed', async () => {
    const { app } = buildAuthApp({
      forgotPassword: jest.fn(async () => {
        throw new AppError(
          503,
          'PASSWORD_RESET_UNAVAILABLE',
          'Password reset email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL in the API .env file, then restart the backend.',
        );
      }),
    });
    const csrf = await csrfHeaders(app);
    const response = await protectedPost(app, 'forgot-password', csrf.token, csrf.cookie).send({
      email: 'unknown@example.com',
    });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('PASSWORD_RESET_UNAVAILABLE');
  });

  it('reports expired reset links without accepting them', async () => {
    const { app } = buildAuthApp({ resetPassword: jest.fn(async () => 'expired') });
    const csrf = await csrfHeaders(app);
    const expired = await protectedPost(app, 'reset-password', csrf.token, csrf.cookie).send({
      token: 'a-valid-shape-reset-token-123456',
      newPassword: 'a sufficiently long password',
    });

    expect(expired.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('accepts a valid reset request and clears the current browser cookies', async () => {
    const { app, operations } = buildAuthApp();
    const csrf = await csrfHeaders(app);
    const response = await protectedPost(app, 'reset-password', csrf.token, csrf.cookie).send({
      token: 'a-valid-shape-reset-token-123456',
      newPassword: 'a sufficiently long password',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.success).toBe(true);
    expect(operations.resetPassword).toHaveBeenCalledWith(
      'a-valid-shape-reset-token-123456',
      'a sufficiently long password',
    );
    const cookies = response.headers['set-cookie'];
    expect(Array.isArray(cookies) ? cookies.join(';') : (cookies ?? '')).toContain('mmm_session=');
  });

  it('validates the approved password minimum and reset request shape', () => {
    expect(
      signupSchema.safeParse({ name: 'Aisha Rao', email: 'user@example.com', password: 'short' })
        .success,
    ).toBe(false);
    expect(
      signupSchema.safeParse({
        name: ' Aisha Rao ',
        email: ' USER@example.com ',
        password: 'at least twelve chars',
      }).data,
    ).toMatchObject({ name: 'Aisha Rao', email: 'user@example.com' });
    expect(
      signupSchema.safeParse({
        name: '   ',
        email: 'user@example.com',
        password: 'at least twelve chars',
      }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ token: 'reset-token', newPassword: 'valid password length' })
        .success,
    ).toBe(false);
  });

  it('outputs reset link via ConsoleMailer in development mode', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mailer = createConsoleMailer();
    await mailer.sendResetLink(
      'aisha@example.com',
      'http://localhost:1234/reset-password#token=test',
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DEV MODE] Password reset email for: aisha@example.com'),
    );
    expect(consoleSpy).toHaveBeenCalledWith('http://localhost:1234/reset-password#token=test');
    consoleSpy.mockRestore();
  });

  it('generates reset token and invokes mailer for an existing user', async () => {
    const mockMailer = { sendResetLink: jest.fn(async () => undefined) };
    const mockDb = {
      user: {
        findUnique: jest.fn(async () => ({ id: user.id, email: user.email })),
      },
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          passwordResetToken: {
            updateMany: jest.fn(async () => ({ count: 0 })),
            create: jest.fn(async () => ({ id: 'token-id' })),
          },
        };
        return callback(tx);
      }),
    } as unknown as PrismaClient;

    const authService = createAuthService(mockDb, mockMailer);
    await authService.forgotPassword(user.email, 'req-123');

    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: user.email },
      select: { id: true, email: true },
    });
    expect(mockMailer.sendResetLink).toHaveBeenCalledWith(
      user.email,
      expect.stringMatching(/\/reset-password#token=/),
    );
  });

  it('creates user and session in database on signup', async () => {
    const mockDb = {
      $transaction: jest.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          user: {
            create: jest.fn(async () => ({
              id: user.id,
              email: user.email,
              displayName: user.displayName,
            })),
          },
          session: {
            create: jest.fn(async () => ({ id: 'session-id' })),
          },
        };
        return callback(tx);
      }),
    } as unknown as PrismaClient;

    const authService = createAuthService(mockDb);
    const result = await authService.signup(
      'Aisha Rao',
      'aisha@example.com',
      'a sufficiently long password',
    );

    expect(result.hasWedding).toBe(false);
    expect(result.user.email).toBe('aisha@example.com');
    expect(result.sessionToken).toBeDefined();
  });
});
