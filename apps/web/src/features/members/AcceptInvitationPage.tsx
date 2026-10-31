import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { queryClient } from '../../app/providers';
import { useAuth } from '../auth/AuthProvider';
import { ApiRequestError } from '../../lib/api-client';
import { BrandMark } from '../../components/BrandMark';
import { getPublicInvitation, acceptInvitation, type PublicInvitationSummary } from './membersApi';

export function AcceptInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  const [invitation, setInvitation] = useState<PublicInvitationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link.');
      setLoading(false);
      return;
    }

    getPublicInvitation(token)
      .then((data) => {
        setInvitation(data);
      })
      .catch((err) => {
        if (err instanceof ApiRequestError) {
          setError(err.message);
        } else {
          setError('Failed to load invitation. The link may have expired or been revoked.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setAcceptError(null);

    try {
      const result = await acceptInvitation(token);

      // Immediately update session query cache so ProtectedRoute allows /dashboard access
      if (session) {
        queryClient.setQueryData(['auth', 'me'], {
          ...session,
          hasWedding: true,
          membership: { role: result.membership.role },
          wedding: result.wedding,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });

      // Successfully accepted invitation! Navigate to workspace dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setAcceptError(err.message);
      } else {
        setAcceptError('Failed to accept invitation. Please try again.');
      }
    } finally {
      setAccepting(false);
    }
  };

  const isUserLoggedIn = Boolean(session?.user);
  const isEmailMatching =
    isUserLoggedIn &&
    invitation &&
    session?.user?.email.toLowerCase() === invitation.email.toLowerCase();
  const userHasExistingWedding = Boolean(session?.hasWedding);

  return (
    <div className="min-h-screen bg-[#fafaf5] text-[#2c2d2a] font-sans antialiased flex flex-col justify-between">
      {/* Header */}
      <header className="w-full bg-[#fafaf5]/90 border-b border-[#e5e3dc] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark compact />
            <div className="flex flex-col">
              <span className="font-serif font-bold text-base text-[#1c1d1b] leading-tight">
                Make My Marriage
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-[#851321] uppercase">
                Accept Wedding Invitation
              </span>
            </div>
          </Link>

          {isUserLoggedIn && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#7a7c77] hidden sm:inline">
                Signed in as <strong>{session?.user?.email}</strong>
              </span>
              <button
                onClick={() => void logout()}
                className="text-xs text-[#851321] hover:underline font-medium"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#e5e3dc] shadow-sm p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Subtle Top Decorative Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#851321] via-[#d4af37] to-[#851321]" />

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-[#7a7c77]">
              <div className="w-10 h-10 border-2 border-[#851321] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm">Retrieving wedding invitation...</p>
            </div>
          ) : error ? (
            <div className="py-10">
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#1c1d1b] mb-2">
                Invitation Unavailable
              </h2>
              <p className="text-sm text-[#5c5d59] mb-6">{error}</p>
              <Link
                to="/"
                className="inline-flex px-5 py-2.5 rounded-xl bg-[#851321] text-white text-sm font-medium hover:bg-[#6c0f1b] transition-colors"
              >
                Return to Homepage
              </Link>
            </div>
          ) : invitation ? (
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#851321]/10 text-[#851321] text-xs font-semibold uppercase tracking-wider mb-3">
                Team Invitation
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1c1d1b] leading-tight mb-2">
                {invitation.wedding.title}
              </h2>

              <p className="text-xs sm:text-sm text-[#7a7c77] mb-6">
                <strong>{invitation.inviter.displayName || 'The Wedding Organizer'}</strong> has
                invited you to join the wedding planning team.
              </p>

              {/* Wedding Details Box */}
              <div className="bg-[#fafaf7] rounded-2xl border border-[#eceae3] p-4 sm:p-5 text-left mb-6 space-y-2.5 text-xs text-[#5c5d59]">
                <div className="flex items-center justify-between">
                  <span className="text-[#8a8d86] uppercase font-semibold text-[10px] tracking-wider">
                    Assigned Role
                  </span>
                  <span className="font-semibold text-[#851321] px-2 py-0.5 rounded bg-[#851321]/10">
                    {invitation.role}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8a8d86] uppercase font-semibold text-[10px] tracking-wider">
                    Invited Email
                  </span>
                  <span className="font-medium text-[#1c1d1b]">{invitation.email}</span>
                </div>

                {invitation.wedding.weddingDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#8a8d86] uppercase font-semibold text-[10px] tracking-wider">
                      Wedding Date
                    </span>
                    <span className="font-medium text-[#1c1d1b]">
                      {new Date(invitation.wedding.weddingDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {invitation.wedding.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#8a8d86] uppercase font-semibold text-[10px] tracking-wider">
                      Location
                    </span>
                    <span className="font-medium text-[#1c1d1b] truncate max-w-[200px]">
                      {invitation.wedding.location}
                    </span>
                  </div>
                )}
              </div>

              {acceptError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-left">
                  {acceptError}
                </div>
              )}

              {/* Action Buttons depending on user status */}
              {!isUserLoggedIn ? (
                <div className="space-y-3">
                  <p className="text-xs text-[#7a7c77]">
                    Please sign in or create an account with <strong>{invitation.email}</strong> to
                    join the team.
                  </p>

                  <Link
                    to={`/login?redirect=${encodeURIComponent(window.location.pathname)}&email=${encodeURIComponent(invitation.email)}`}
                    className="w-full flex items-center justify-center px-5 py-3 rounded-xl bg-[#851321] hover:bg-[#6c0f1b] text-white font-medium text-sm transition-colors shadow-sm"
                  >
                    Sign In to Accept
                  </Link>

                  <Link
                    to={`/signup?redirect=${encodeURIComponent(window.location.pathname)}&email=${encodeURIComponent(invitation.email)}`}
                    className="w-full flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#fafaf7] hover:bg-[#f0ede6] text-[#2c2d2a] border border-[#d8d5cb] font-medium text-sm transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              ) : isEmailMatching ? (
                userHasExistingWedding ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left">
                    <p className="font-semibold mb-1">Already in a Wedding</p>
                    <p>
                      You already belong to a wedding workspace. In Make My Marriage V1, an account
                      can belong to only one wedding.
                    </p>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={() => void handleAccept()}
                      disabled={accepting}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#851321] hover:bg-[#6c0f1b] text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                    >
                      {accepting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Joining Wedding Team...</span>
                        </>
                      ) : (
                        <span>Accept Invitation & Join Team</span>
                      )}
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-3 text-left">
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <p className="font-semibold mb-1">Different Account Signed In</p>
                    <p>
                      You are signed in as <strong>{session?.user?.email}</strong>, but this
                      invitation was sent to <strong>{invitation.email}</strong>.
                    </p>
                  </div>

                  <button
                    onClick={() => void logout()}
                    className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#fafaf7] hover:bg-[#f0ede6] text-[#851321] border border-[#d8d5cb] font-medium text-xs transition-colors"
                  >
                    Switch Account to Accept
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-[#8a8d86]">
        Make My Marriage &copy; {new Date().getFullYear()}. Secure Wedding Planning Platform.
      </footer>
    </div>
  );
}
