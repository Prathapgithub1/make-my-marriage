import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './AuthProvider';

export function WeddingSetupPlaceholder() {
  return (
    <WorkspaceFrame
      title="Set up your wedding"
      description="Your account is ready. Wedding creation will be added in the next feature step."
      action="Continue to wedding setup"
    />
  );
}

export function DashboardPlaceholder() {
  return (
    <WorkspaceFrame
      title="Wedding dashboard"
      description="Your wedding workspace will appear here when wedding setup is available."
      action="Open dashboard"
    />
  );
}

function WorkspaceFrame({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: string;
}) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  async function handleLogout() {
    setError('');
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setError('We could not sign you out. Please try again.');
    }
  }

  return (
    <main className="min-h-screen bg-canvas px-5 py-8 text-ink sm:px-8">
      <section
        className="mx-auto max-w-3xl rounded-2xl border border-outline bg-surface p-7 shadow-sm sm:p-10"
        aria-labelledby="workspace-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted">Signed in as {session?.user.email}</p>
          <button
            className="rounded-lg border border-outline px-4 py-2 text-sm font-semibold text-primary"
            onClick={handleLogout}
            type="button"
          >
            Sign out
          </button>
        </div>
        {error && (
          <p className="mt-5 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <h1 className="mt-10 font-serif text-4xl tracking-tight" id="workspace-title">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-muted">{description}</p>
        <p className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-primary px-5 font-semibold text-white">
          {action}
        </p>
        <p className="mt-5 text-xs text-muted">
          Placeholder page. Wedding data is not available yet.
        </p>
      </section>
    </main>
  );
}
