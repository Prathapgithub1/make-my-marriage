const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001/api/v1';

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
  requestId?: string;
};

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const resourcePath = path.replace(/^\//, '');
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}/${resourcePath}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  const responseBody: unknown = await response.json();

  if (!response.ok) {
    const errorBody = responseBody as ApiErrorBody;
    throw new Error(errorBody.error?.message ?? `API request failed (${response.status})`);
  }

  return responseBody as T;
}
