import { timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import type { RequestHandler } from 'express';
import { env } from '../../config/env';
import { prisma } from '../../infrastructure/database/pool';
import { AppError } from '../../shared/app-error';
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from './schemas';
import type { AuthContextResult, AuthResult, AuthUser, SignupResult } from './service';
import { createAuthService } from './service';
import {
  appendSetCookies,
  clearCookieHeader,
  cookieHeader,
  CSRF_COOKIE,
  parseCookies,
  SESSION_COOKIE,
  verifyCsrfToken,
  hashToken,
} from './security';

const SESSION_SECONDS = 7 * 24 * 60 * 60;
export const authService = createAuthService(prisma);

export interface AuthOperations {
  createCsrfToken(): string;
  signup(name: string, email: string, password: string, requestId?: string): Promise<SignupResult>;
  login(email: string, password: string): Promise<AuthResult>;
  authenticate(sessionToken: string | undefined): Promise<AuthUser | null>;
  getAuthContext?(sessionToken: string | undefined): Promise<AuthContextResult | null>;
  logout(sessionToken: string | undefined): Promise<void>;
  forgotPassword(email: string, requestId: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<'ok' | 'invalid' | 'expired'>;
  consumeRateLimit(key: string, limit: number, windowMs: number): Promise<boolean>;
}

export function createAuthRouter(service: AuthOperations = authService) {
  const router = Router();

  router.get('/csrf', (_req, res, next) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      const token = service.createCsrfToken();
      appendSetCookies(res, [cookieHeader(CSRF_COOKIE, token, false, SESSION_SECONDS)]);
      res.status(200).json({ data: { csrfToken: token } });
    } catch (error) {
      next(error);
    }
  });

  router.post('/signup', requireSameOrigin, requireCsrf, async (req, res, next) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success)
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Check your name, email, and password. Passwords must be at least 12 characters.',
        );
      await enforceRateLimit(service, req, 'signup', 5, 60 * 60 * 1000);
      const result = await service.signup(
        parsed.data.name,
        parsed.data.email,
        parsed.data.password,
        getRequestId(res),
      );
      setSessionCookie(res, result.sessionToken);
      res.status(201).json({
        data: {
          user: { id: result.user.id, email: result.user.email, name: result.user.displayName },
          hasWedding: false,
        },
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', requireSameOrigin, requireCsrf, async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success)
        throw new AppError(400, 'VALIDATION_ERROR', 'Enter a valid email and password.');
      await enforceRateLimit(service, req, 'login', 10, 15 * 60 * 1000);
      const result = await service.login(parsed.data.email, parsed.data.password);
      setSessionCookie(res, result.sessionToken);
      res.json({
        data: {
          user: { id: result.user.id, email: result.user.email, name: result.user.displayName },
          hasWedding: result.hasWedding,
        },
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', requireSameOrigin, requireCsrf, async (req, res, next) => {
    try {
      await service.logout(parseCookies(req.header('Cookie'))[SESSION_COOKIE]);
      appendSetCookies(res, [
        clearCookieHeader(SESSION_COOKIE, true),
        clearCookieHeader(CSRF_COOKIE, false),
      ]);
      res.json({ data: { success: true }, requestId: getRequestId(res) });
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', async (req, res, next) => {
    try {
      const sessionToken = parseCookies(req.header('Cookie'))[SESSION_COOKIE];
      const context = service.getAuthContext ? await service.getAuthContext(sessionToken) : null;

      if (!context) {
        const user = await service.authenticate(sessionToken);
        if (!user) {
          appendSetCookies(res, [clearCookieHeader(SESSION_COOKIE, true)]);
          throw new AppError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
        }
        res.json({
          data: {
            user: { id: user.id, email: user.email, name: user.displayName },
            hasWedding: false,
            membership: null,
            wedding: null,
          },
          requestId: getRequestId(res),
        });
        return;
      }

      res.json({
        data: {
          user: { id: context.user.id, email: context.user.email, name: context.user.displayName },
          hasWedding: context.hasWedding,
          membership: context.membership,
          wedding: context.wedding,
        },
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/forgot-password', requireSameOrigin, requireCsrf, async (req, res, next) => {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success)
        throw new AppError(400, 'VALIDATION_ERROR', 'Enter a valid email address.');
      await enforceRateLimit(service, req, 'forgot-password', 5, 15 * 60 * 1000);
      await service.forgotPassword(parsed.data.email, getRequestId(res));
      res.status(202).json({
        data: {
          message:
            'Request received. If an account exists, you may receive reset instructions. Your password has not been changed.',
        },
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/reset-password', requireSameOrigin, requireCsrf, async (req, res, next) => {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success)
        throw new AppError(400, 'VALIDATION_ERROR', 'The reset link or new password is invalid.');
      await enforceRateLimit(service, req, 'reset-password', 10, 15 * 60 * 1000);
      const result = await service.resetPassword(parsed.data.token, parsed.data.newPassword);
      if (result === 'expired')
        throw new AppError(400, 'TOKEN_EXPIRED', 'This password reset link has expired.');
      if (result !== 'ok')
        throw new AppError(
          400,
          'INVALID_TOKEN',
          'This password reset link is invalid or has already been used.',
        );
      appendSetCookies(res, [
        clearCookieHeader(SESSION_COOKIE, true),
        clearCookieHeader(CSRF_COOKIE, false),
      ]);
      res.json({ data: { success: true }, requestId: getRequestId(res) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export const requireSameOrigin: RequestHandler = (req, _res, next) => {
  const origin = req.header('Origin');
  const referer = req.header('Referer');
  let sourceOrigin = origin;
  if (!sourceOrigin && referer) {
    try {
      sourceOrigin = new URL(referer).origin;
    } catch {
      next(new AppError(403, 'CSRF_REJECTED', 'Request origin could not be verified.'));
      return;
    }
  }
  const apiOrigin = `${req.protocol}://${req.get('host')}`;
  const isLocalDev = env.NODE_ENV !== 'production';
  const isLocalhost = Boolean(
    sourceOrigin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(sourceOrigin),
  );
  if (
    sourceOrigin !== env.WEB_ORIGIN &&
    sourceOrigin !== apiOrigin &&
    !(isLocalDev && isLocalhost)
  ) {
    next(new AppError(403, 'CSRF_REJECTED', 'Request origin could not be verified.'));
    return;
  }
  next();
};

export const requireCsrf: RequestHandler = (req, _res, next) => {
  try {
    const cookieToken = parseCookies(req.header('Cookie'))[CSRF_COOKIE];
    const headerToken = req.header('X-CSRF-Token');
    if (
      !cookieToken ||
      !headerToken ||
      !sameValue(cookieToken, headerToken) ||
      !verifyCsrfToken(headerToken)
    ) {
      next(
        new AppError(
          403,
          'CSRF_REJECTED',
          'Request could not be verified. Refresh the page and try again.',
        ),
      );
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};

async function enforceRateLimit(
  service: AuthOperations,
  req: Parameters<RequestHandler>[0],
  action: string,
  limit: number,
  windowMs: number,
) {
  const key = hashToken(`${action}:${req.ip ?? 'unknown'}`);
  if (!(await service.consumeRateLimit(key, limit, windowMs))) {
    throw new AppError(429, 'RATE_LIMITED', 'Too many requests. Please wait and try again.');
  }
}

function setSessionCookie(res: Parameters<typeof appendSetCookies>[0], sessionToken: string) {
  appendSetCookies(res, [cookieHeader(SESSION_COOKIE, sessionToken, true, SESSION_SECONDS)]);
}

function sameValue(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export function getRequestId(res: {
  getHeader: (name: string) => number | string | string[] | undefined;
}) {
  return String(res.getHeader('X-Request-Id') ?? '');
}

export const authRouter = createAuthRouter();
