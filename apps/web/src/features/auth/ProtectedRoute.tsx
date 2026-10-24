import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({
  children,
  requireWedding,
}: PropsWithChildren<{ requireWedding?: boolean }>) {
  const { session, isLoading, error } = useAuth();
  if (isLoading)
    return (
      <main
        className="grid min-h-screen place-items-center bg-canvas text-muted"
        aria-live="polite"
      >
        Checking your session...
      </main>
    );
  if (error)
    return (
      <main className="grid min-h-screen place-items-center bg-canvas p-6 text-center text-ink">
        <div>
          <h1 className="font-serif text-3xl">We couldn't check your session</h1>
          <p className="mt-3 text-muted">Check that the API is running, then refresh this page.</p>
        </div>
      </main>
    );
  if (!session) return <Navigate replace to="/login" />;
  if (requireWedding === true && !session.hasWedding)
    return <Navigate replace to="/wedding/setup" />;
  if (requireWedding === false && session.hasWedding) return <Navigate replace to="/dashboard" />;
  return children;
}
