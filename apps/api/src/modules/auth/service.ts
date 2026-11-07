import argon2 from 'argon2';
import { Prisma } from '../../generated/prisma/client';
import type { PrismaClient } from '../../generated/prisma/client';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/app-error';
import { createCsrfToken, createOpaqueToken, hashToken, SESSION_TTL_MS } from './security';

const RESET_TTL_MS = 30 * 60 * 1000;

export type AuthUser = { id: string; email: string; displayName: string | null };
export type AuthResult = {
  user: AuthUser;
  hasWedding: boolean;
  sessionToken: string;
  membership?: AuthMembership | null;
  wedding?: AuthWeddingSummary | null;
};
export type SignupResult = { user: AuthUser; hasWedding: boolean; sessionToken: string };

export type AuthMembership = {
  role: 'ADMIN' | 'MANAGER';
};

export type AuthWeddingSummary = {
  id: string;
  title: string;
  brideName: string;
  groomName: string;
  weddingDate: string | null;
  location: string | null;
};

export type AuthContextResult = {
  user: AuthUser;
  hasWedding: boolean;
  membership: AuthMembership | null;
  wedding: AuthWeddingSummary | null;
};

export interface AuthMailer {
  sendResetLink(email: string, link: string): Promise<void>;
}

export type FullAuthMailer = Required<AuthMailer>;
export type ResetMailer = AuthMailer;

export function createResendMailer(): AuthMailer {
  const rawFromEmail = env.EMAIL_FROM ?? env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  const isPersonalDomain = /@(gmail|yahoo|hotmail|outlook)\.com$/i.test(rawFromEmail);
  const fromEmail = isPersonalDomain ? 'onboarding@resend.dev' : rawFromEmail;
  return {
    async sendResetLink(email: string, link: string) {
      if (!env.RESEND_API_KEY || !fromEmail) return;
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Reset your Make My Marriage password',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px 16px; color: #2e302d; line-height: 1.6;">
              <h2 style="color: #1a1c19; font-size: 22px; margin-bottom: 16px;">Make My Marriage</h2>
              <p style="margin-bottom: 16px;">You requested to reset your password. Use the link below to choose a new password. It expires in 30 minutes.</p>
              <p style="margin-bottom: 24px;">
                <a href="${link}" style="display: inline-block; background-color: #6a4030; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                  Reset password
                </a>
              </p>
              <p style="font-size: 13px; color: #74776f; margin-bottom: 8px;">If you did not request this, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #e2e4dc; margin: 24px 0;" />
              <p style="font-size: 11px; color: #8c8e87; word-break: break-all;">Link: ${link}</p>
            </div>
          `,
        }),
      });
      if (!response.ok) throw new Error(`Resend rejected the request (${response.status}).`);
      const data = (await response.json().catch(() => null)) as { id?: string } | null;
      if (!data?.id) throw new Error('Resend response did not include a message id.');
    },
  };
}

export function createConsoleMailer(): AuthMailer {
  return {
    async sendResetLink(email: string, link: string) {
      console.log('\n================================================================');
      console.log(`[DEV MODE] Password reset email for: ${email}`);
      console.log('Resend is not configured; using local development console mailer.');
      console.log('Open this link in your browser to reset your password:');
      console.log(link);
      console.log('================================================================\n');
    },
  };
}

export function createDefaultMailer(): AuthMailer {
  const fromEmail = env.EMAIL_FROM ?? env.RESEND_FROM_EMAIL;
  if (env.RESEND_API_KEY && fromEmail) {
    return createResendMailer();
  }
  return createConsoleMailer();
}

export function createAuthService(
  db: PrismaClient | undefined,
  mailer: AuthMailer = createDefaultMailer(),
) {
  function requireDatabase(): PrismaClient {
    if (!db) {
      throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database connection is unavailable.');
    }
    return db;
  }

  async function signup(name: string, email: string, password: string): Promise<SignupResult> {
    const database = requireDatabase();
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const sessionToken = createOpaqueToken();

    try {
      const user = await database.$transaction(async (transaction) => {
        const created = await transaction.user.create({
          data: { email, passwordHash, displayName: name },
          select: { id: true, email: true, displayName: true },
        });
        await transaction.session.create({
          data: {
            userId: created.id,
            tokenHash: hashToken(sessionToken),
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
          },
        });
        return created;
      });

      return { user, hasWedding: false, sessionToken };
    } catch (error) {
      if (isPrismaCode(error, 'P2002'))
        throw new AppError(
          409,
          'EMAIL_ALREADY_EXISTS',
          'An account with this email already exists.',
        );
      throw error;
    }
  }

  async function login(email: string, password: string): Promise<AuthResult> {
    const database = requireDatabase();
    const user = await database.user.findUnique({
      where: { email },
      include: {
        weddingMembership: {
          include: {
            wedding: true,
          },
        },
      },
    });
    const validPassword = user
      ? await argon2.verify(user.passwordHash, password).catch(() => false)
      : false;
    if (!user) await argon2.hash(password, { type: argon2.argon2id });
    if (!user || !validPassword)
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');

    const sessionToken = createOpaqueToken();
    await database.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(sessionToken),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });

    const membership = user.weddingMembership;
    return {
      user: { id: user.id, email: user.email, displayName: user.displayName },
      hasWedding: Boolean(membership),
      membership: membership ? { role: membership.role } : null,
      wedding: membership?.wedding
        ? {
            id: membership.wedding.id,
            title: membership.wedding.title,
            brideName: membership.wedding.brideName,
            groomName: membership.wedding.groomName,
            weddingDate: membership.wedding.weddingDate
              ? membership.wedding.weddingDate.toISOString().slice(0, 10)
              : null,
            location: membership.wedding.location,
          }
        : null,
      sessionToken,
    };
  }

  async function getAuthContext(
    sessionToken: string | undefined,
  ): Promise<AuthContextResult | null> {
    if (!sessionToken) return null;
    const session = await requireDatabase().session.findFirst({
      where: {
        tokenHash: hashToken(sessionToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            weddingMembership: {
              select: {
                id: true,
                weddingId: true,
                role: true,
                wedding: {
                  select: {
                    id: true,
                    title: true,
                    brideName: true,
                    groomName: true,
                    weddingDate: true,
                    location: true,
                    city: true,
                    state: true,
                    country: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session?.user) return null;
    const membership = session.user.weddingMembership;
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName,
      },
      hasWedding: Boolean(membership),
      membership: membership ? { role: membership.role } : null,
      wedding: membership?.wedding
        ? {
            id: membership.wedding.id,
            title: membership.wedding.title,
            brideName: membership.wedding.brideName,
            groomName: membership.wedding.groomName,
            weddingDate: membership.wedding.weddingDate
              ? membership.wedding.weddingDate.toISOString().slice(0, 10)
              : null,
            location: membership.wedding.location,
          }
        : null,
    };
  }

  async function authenticate(sessionToken: string | undefined): Promise<AuthUser | null> {
    if (!sessionToken) return null;
    const session = await requireDatabase().session.findFirst({
      where: {
        tokenHash: hashToken(sessionToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { user: { select: { id: true, email: true, displayName: true } } },
    });
    return session?.user ?? null;
  }

  async function logout(sessionToken: string | undefined): Promise<void> {
    if (!sessionToken) return;
    await requireDatabase().session.updateMany({
      where: { tokenHash: hashToken(sessionToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async function forgotPassword(email: string, requestId: string): Promise<void> {
    const database = requireDatabase();
    const fromEmail = env.EMAIL_FROM ?? env.RESEND_FROM_EMAIL;
    const isResendConfigured = Boolean(env.RESEND_API_KEY && fromEmail);

    if (!isResendConfigured && env.NODE_ENV === 'production') {
      logger.warn({ requestId }, 'Password reset email is not configured in production');
      throw new AppError(
        503,
        'PASSWORD_RESET_UNAVAILABLE',
        'Password reset is temporarily unavailable. Please try again later.',
      );
    }

    if (!isResendConfigured && (env.RESEND_API_KEY || fromEmail)) {
      logger.warn(
        { requestId },
        'Partial Resend configuration. Both RESEND_API_KEY and EMAIL_FROM (or RESEND_FROM_EMAIL) are required to send emails via Resend.',
      );
    }

    const user = await database.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (!user) return;

    const token = createOpaqueToken();
    const now = new Date();
    await database.$transaction(async (transaction) => {
      await transaction.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      });
      await transaction.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(now.getTime() + RESET_TTL_MS),
        },
      });
    });

    const origin = env.APP_BASE_URL ?? env.WEB_ORIGIN;
    const resetLink = `${origin.replace(/\/$/, '')}/reset-password#token=${encodeURIComponent(token)}`;
    try {
      await mailer.sendResetLink(user.email, resetLink);
    } catch (error) {
      const statusCode =
        error instanceof Error
          ? Number(error.message.match(/\((\d{3})\)/)?.[1]) || undefined
          : undefined;
      logger.warn(
        { requestId, provider: isResendConfigured ? 'resend' : 'console', statusCode },
        'Password reset email could not be sent',
      );
    }
  }

  async function resetPassword(
    token: string,
    newPassword: string,
  ): Promise<'ok' | 'invalid' | 'expired'> {
    const database = requireDatabase();
    const tokenHash = hashToken(token);
    const now = new Date();
    const reset = await database.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });
    if (!reset || reset.usedAt) return 'invalid';
    if (reset.expiresAt <= now) return 'expired';

    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    const redeemed = await database.$transaction(async (transaction) => {
      const consumed = await transaction.passwordResetToken.updateMany({
        where: { id: reset.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (consumed.count !== 1) return false;
      await transaction.user.update({
        where: { id: reset.userId },
        data: { passwordHash, emailVerifiedAt: now },
      });
      await transaction.session.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      return true;
    });
    return redeemed ? 'ok' : 'invalid';
  }

  async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
    const database = requireDatabase();
    const now = new Date();
    const cutoff = new Date(now.getTime() - windowMs);
    const expiry = new Date(now.getTime() + windowMs);
    const rows = await database.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      INSERT INTO auth_rate_limits (key, count, window_started_at, expires_at)
      VALUES (${key}, 1, ${now}, ${expiry})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE WHEN auth_rate_limits.window_started_at <= ${cutoff} THEN 1 ELSE auth_rate_limits.count + 1 END,
        window_started_at = CASE WHEN auth_rate_limits.window_started_at <= ${cutoff} THEN ${now} ELSE auth_rate_limits.window_started_at END,
        expires_at = CASE WHEN auth_rate_limits.window_started_at <= ${cutoff} THEN ${expiry} ELSE auth_rate_limits.expires_at END
      RETURNING count
    `);
    return (rows[0]?.count ?? 0) <= limit;
  }

  return {
    createCsrfToken,
    signup,
    login,
    authenticate,
    getAuthContext,
    logout,
    forgotPassword,
    resetPassword,
    consumeRateLimit,
  };
}

export type AuthService = ReturnType<typeof createAuthService>;

function isPrismaCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}
