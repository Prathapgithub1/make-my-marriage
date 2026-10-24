import { apiRequest } from '../../lib/api-client';

export type AuthUser = { id: string; email: string; name: string | null };
export type AuthAccount = {
  user: { id: string; email: string; name: string | null };
  hasWedding: boolean;
};
export type AuthSession = {
  user: AuthUser;
  hasWedding: boolean;
  membership: null | { role: string };
  wedding: null | { id: string; name: string };
};

type Envelope<T> = { data: T };

export function signIn(email: string, password: string) {
  return apiRequest<Envelope<AuthAccount>>('auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }).then((response) => response.data);
}

export function getCurrentSession() {
  return apiRequest<Envelope<AuthSession>>('auth/me').then((response) => response.data);
}

export function signOut() {
  return apiRequest<Envelope<{ success: boolean }>>('auth/logout', { method: 'POST' });
}

export function requestPasswordReset(email: string) {
  return apiRequest<Envelope<{ message: string }>>('auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }).then((response) => response.data);
}

export function resetPassword(token: string, newPassword: string) {
  return apiRequest<Envelope<{ success: boolean }>>('auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

export function signUp(name: string, email: string, password: string) {
  return apiRequest<Envelope<AuthAccount>>('auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  }).then((response) => response.data);
}
