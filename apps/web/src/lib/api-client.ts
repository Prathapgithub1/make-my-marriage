const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3104/api/v1';
let csrfToken: string | undefined;
let csrfRequest: Promise<string> | undefined;

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

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
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

  if (needsCsrf && (resourcePath === 'auth/logout' || resourcePath === 'auth/reset-password')) {
    csrfToken = undefined;
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
  return match ? decodeURIComponent(match[1]) : undefined;
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const fromCookie = readCsrfCookie();
  if (fromCookie) {
    csrfToken = fromCookie;
    return csrfToken;
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
