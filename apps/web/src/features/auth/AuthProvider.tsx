import { createContext, useContext, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiRequestError } from '../../lib/api-client';
import { getCurrentSession, signOut } from './authApi';
import type { AuthSession } from './authApi';

type AuthContextValue = {
  session: AuthSession | null;
  isLoading: boolean;
  error: Error | null;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const sessionQueryKey = ['auth', 'me'];

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: sessionQueryKey,
    queryFn: async () => {
      try {
        return await getCurrentSession();
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      session: sessionQuery.data ?? null,
      isLoading: sessionQuery.isPending,
      error: sessionQuery.error,
      logout: async () => {
        await signOut();
        queryClient.setQueryData(sessionQueryKey, null);
      },
    }),
    [queryClient, sessionQuery.data, sessionQuery.error, sessionQuery.isPending],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider.');
  return value;
}

export function setAuthenticatedSession(
  queryClient: ReturnType<typeof useQueryClient>,
  hasWedding: boolean,
  user: AuthSession['user'],
) {
  queryClient.setQueryData(sessionQueryKey, {
    user,
    hasWedding,
    membership: null,
    wedding: null,
  } satisfies AuthSession);
}
