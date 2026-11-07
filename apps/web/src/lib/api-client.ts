const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3104/api/v1';
let csrfToken: string | undefined;
let csrfRequest: Promise<string> | undefined;

export function clearCsrfToken(): void {
  csrfToken = undefined;
  if (typeof document !== 'undefined') {
    document.cookie = 'mmm_csrf=; Path=/; Max-Age=0; SameSite=Lax';
  }
}

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string>;
  };
  requestId?: string;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const resourcePath = path.replace(/^\//, '');
  const headers = new Headers(init.headers);
  const method = (init.method ?? 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (needsCsrf) headers.set('X-CSRF-Token', await getCsrfToken());

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}/${resourcePath}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  const responseBody: unknown = await response.json().catch(() => undefined);

  // If a request requiring CSRF is rejected due to token invalidation or mismatch,
  // clear stale CSRF state, fetch a fresh CSRF token from the server, and retry once.
  if (
    !response.ok &&
    needsCsrf &&
    !isRetry &&
    response.status === 403 &&
    Boolean(
      (responseBody as ApiErrorBody)?.error?.code === 'CSRF_REJECTED' ||
      (responseBody as ApiErrorBody)?.error?.message
        ?.toLowerCase()
        .includes('could not be verified'),
    )
  ) {
    clearCsrfToken();
    const freshToken = await getCsrfToken(true);
    headers.set('X-CSRF-Token', freshToken);
    return apiRequest<T>(path, { ...init, headers }, true);
  }

  if (needsCsrf && (resourcePath === 'auth/logout' || resourcePath === 'auth/reset-password')) {
    clearCsrfToken();
  }

  if (!response.ok) {
    const errorBody = responseBody as ApiErrorBody;
    throw new ApiRequestError(
      errorBody.error?.message ?? `API request failed (${response.status})`,
      response.status,
      errorBody.error?.code,
      errorBody.error?.details,
    );
  }

  return responseBody as T;
}

function readCsrfCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|;\s*)mmm_csrf=([^;]+)/);
  if (!match) return undefined;
  let val = decodeURIComponent(match[1].trim());
  if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
    val = val.slice(1, -1);
  }
  return val;
}

export async function getCsrfToken(forceFresh = false): Promise<string> {
  if (!forceFresh && csrfToken) return csrfToken;
  if (!forceFresh) {
    const fromCookie = readCsrfCookie();
    if (fromCookie) {
      csrfToken = fromCookie;
      return csrfToken;
    }
  }

  if (!csrfRequest) {
    const baseUrl = API_BASE_URL.replace(/\/$/, '');
    csrfRequest = fetch(`${baseUrl}/auth/csrf`, {
      credentials: 'include',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as {
          data?: { csrfToken?: string };
        } | null;
        const token = body?.data?.csrfToken ?? readCsrfCookie();
        if (!token) throw new ApiRequestError('Could not verify this request.', response.status);
        csrfToken = token;
        return csrfToken;
      })
      .finally(() => {
        csrfRequest = undefined;
      });
  }
  return csrfRequest;
}

/**
 * Validates and sanitizes a redirect URL to prevent Open Redirect (CWE-601) vulnerabilities.
 * Only relative local pathname targets starting with '/' (and not '//' or '/\') are permitted.
 */
export function sanitizeRedirectUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('\\')
  ) {
    return trimmed;
  }
  return null;
}
