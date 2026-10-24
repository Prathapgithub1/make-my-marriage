import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env';
import { AppError } from '../../shared/app-error';

export const SESSION_COOKIE = 'mmm_session';
export const CSRF_COOKIE = 'mmm_csrf';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function requireSecret(kind: 'session' | 'csrf'): string {
  const secret = kind === 'session' ? env.SESSION_SECRET : env.CSRF_SECRET;
  if (!secret) throw new AppError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured.');
  return secret;
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string, secret = requireSecret('session')): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}

export function createCsrfToken(): string {
  const value = createOpaqueToken();
  const signature = createHmac('sha256', requireSecret('csrf')).update(value).digest('base64url');
  return `${value}.${signature}`;
}

export function verifyCsrfToken(token: string): boolean {
  const [value, signature, extra] = token.split('.');
  if (!value || !signature || extra) return false;
  const expected = createHmac('sha256', requireSecret('csrf')).update(value).digest('base64url');
  const receivedBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  return (
    receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes)
  );
}

export function parseCookies(header = ''): Record<string, string> {
  return Object.fromEntries(
    header.split(';').flatMap((part) => {
      const separator = part.indexOf('=');
      if (separator < 1) return [];
      const key = part.slice(0, separator).trim();
      try {
        return [[key, decodeURIComponent(part.slice(separator + 1).trim())]];
      } catch {
        return [];
      }
    }),
  );
}

export function cookieHeader(
  name: string,
  value: string,
  httpOnly: boolean,
  maxAgeSeconds: number,
) {
  const secure = env.NODE_ENV === 'production' ? '; Secure' : '';
  const httpOnlyFlag = httpOnly ? '; HttpOnly' : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${httpOnlyFlag}${secure}`;
}

export function clearCookieHeader(name: string, httpOnly: boolean) {
  const secure = env.NODE_ENV === 'production' ? '; Secure' : '';
  const httpOnlyFlag = httpOnly ? '; HttpOnly' : '';
  return `${name}=; Path=/; SameSite=Lax; Max-Age=0${httpOnlyFlag}${secure}`;
}

export function appendSetCookies(
  res: { append: (field: string, value: string) => unknown },
  values: string[],
) {
  for (const value of values) res.append('Set-Cookie', value);
}
