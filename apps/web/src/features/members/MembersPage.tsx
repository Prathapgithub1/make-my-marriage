import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { ApiRequestError } from '../../lib/api-client';
import { BrandMark } from '../../components/BrandMark';
import {
  getMembers,
  getPendingInvitations,
  inviteMember,
  revokeInvitation,
  updateMemberRole,
  removeMember,
  type MemberSummary,
  type MemberInvitationSummary,
  type WeddingRole,
} from './membersApi';

export function MembersPage() {
  const { session, logout } = useAuth();

  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [invitations, setInvitations] = useState<MemberInvitationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Derive admin status from session membership OR directly from the active roster
  const currentUserMember = members.find((m) => m.userId === session?.user?.id);
  const isAdmin = session?.membership?.role === 'ADMIN' || currentUserMember?.role === 'ADMIN';

  // Invite modal / state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WeddingRole>('MANAGER');
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [latestInvite, setLatestInvite] = useState<MemberInvitationSummary | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Modifying member state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const weddingTitle = session?.wedding?.title || 'Your Wedding Workspace';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const membersData = await getMembers();
      setMembers(membersData);

      const userIsAdmin =
        session?.membership?.role === 'ADMIN' ||
        membersData.find((m) => m.userId === session?.user?.id)?.role === 'ADMIN';

      if (userIsAdmin) {
        try {
          const invData = await getPendingInvitations();
          setInvitations(invData);
        } catch {
          // Managers cannot view pending invitations; handled silently
        }
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Failed to load wedding team members. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [session?.user?.id, session?.membership?.role]);

  const handleSendInvite = async (e: FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setCreatedInviteUrl(null);
    setLatestInvite(null);
    setCopiedUrl(false);

    if (!inviteEmail.trim()) {
      setInviteError('Please enter an email address.');
      return;
    }

    setSubmittingInvite(true);
    try {
      const result = await inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      setLatestInvite(result);
      if (result.inviteUrl) {
        setCreatedInviteUrl(result.inviteUrl);
      }
      setInviteEmail('');
      if (result.emailDelivery?.delivered) {
        setActionSuccess(`Invitation email dispatched to ${result.email}!`);
      } else {
        setActionSuccess(`Invitation link generated for ${result.email}!`);
      }
      void loadData();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setInviteError(err.message);
      } else {
        setInviteError('Failed to send invitation. Please try again.');
      }
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!window.confirm('Are you sure you want to revoke this invitation?')) return;

    setActionLoadingId(invitationId);
    setError(null);
    try {
      await revokeInvitation(invitationId);
      setActionSuccess('Invitation revoked successfully.');
      void loadData();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Failed to revoke invitation.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleChange = async (member: MemberSummary, newRole: WeddingRole) => {
    if (member.role === newRole) return;

    setActionLoadingId(member.id);
    setError(null);
    setActionSuccess(null);
    try {
      await updateMemberRole(member.id, newRole);
      setActionSuccess(
        `Updated ${member.user.displayName || member.user.email}'s role to ${newRole}.`,
      );
      void loadData();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Failed to change member role.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (member: MemberSummary) => {
    const name = member.user.displayName || member.user.email;
    if (
      !window.confirm(
        `Are you sure you want to remove ${name} from ${weddingTitle}? They will lose access immediately.`,
      )
    ) {
      return;
    }

    setActionLoadingId(member.id);
    setError(null);
    setActionSuccess(null);
    try {
      await removeMember(member.id);
      setActionSuccess(`Removed ${name} from the wedding team.`);
      void loadData();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError('Failed to remove member.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!createdInviteUrl) return;
    const shareMessage = `You've been invited to join the wedding planning team for ${weddingTitle}! Accept your invitation here:\n${createdInviteUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const adminCount = members.filter((m) => m.role === 'ADMIN').length;

  return (
    <div className="min-h-screen bg-[#fafaf5] text-[#2c2d2a] font-sans antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#fafaf5]/90 backdrop-blur-md border-b border-[#e5e3dc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#851321] rounded-lg p-1"
            >
              <BrandMark compact />
              <div className="flex flex-col">
                <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-[#1c1d1b] leading-tight">
                  Make My Marriage
                </span>
                <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-[#851321] uppercase">
                  Wedding Team & Members
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#5c5d59] hover:text-[#1c1d1b] px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to Dashboard</span>
            </Link>

            <button
              onClick={() => void logout()}
              className="text-xs sm:text-sm text-[#7a7c77] hover:text-[#851321] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#851321]/10 text-[#851321] text-xs font-semibold uppercase tracking-wider mb-2">
              Team Collaboration
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#1c1d1b] tracking-tight">
              Wedding Team & Family
            </h1>
            <p className="text-sm sm:text-base text-[#5c5d59] mt-1 max-w-2xl">
              Invite family members, planners, and co-hosts to collaborate on {weddingTitle}.
            </p>
          </div>

          {isAdmin ? (
            <button
              onClick={() => {
                setShowInviteModal(true);
                setInviteError(null);
                setCreatedInviteUrl(null);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#851321] hover:bg-[#6c0f1b] text-white font-medium text-sm shadow-sm hover:shadow transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Invite Family / Organizer</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#edebe4] text-[#5c5d59] text-xs font-medium border border-[#ddd9d0]">
              <svg
                className="w-4 h-4 text-[#8a8d86]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Manager view (Admins manage team members)</span>
            </div>
          )}
        </div>

        {/* Global Alert Banners */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-emerald-600 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-600 hover:text-emerald-800 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section 1: Active Team Members */}
        <section className="bg-white rounded-2xl border border-[#e5e3dc] shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between border-b border-[#f0eee9] pb-4 mb-6">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1d1b]">
                Active Members ({members.length})
              </h2>
              <p className="text-xs sm:text-sm text-[#7a7c77] mt-0.5">
                Everyone who currently has access to organize this wedding.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#7a7c77]">
              <div className="w-8 h-8 border-2 border-[#851321] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading team members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="py-12 text-center text-[#7a7c77]">
              <p className="text-sm">No members found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#f0eee9] text-[11px] font-semibold text-[#8a8d86] uppercase tracking-wider">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Joined On</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f7f6f2] text-sm">
                  {members.map((member) => {
                    const isSelf = member.userId === session?.user?.id;
                    const isLastAdmin = member.role === 'ADMIN' && adminCount <= 1;

                    return (
                      <tr key={member.id} className="hover:bg-[#fafaf7] transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#f4efe6] border border-[#e5e0d5] text-[#851321] font-semibold flex items-center justify-center shrink-0">
                              {(member.user.displayName || member.user.email || 'M')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-[#1c1d1b] flex items-center gap-2">
                                <span>{member.user.displayName || 'Family Member'}</span>
                                {isSelf && (
                                  <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#7a7c77]">{member.user.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {member.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2a2624] text-[#f2e3c6] border border-[#4a433e]">
                              <svg
                                className="w-3 h-3 text-[#d4af37]"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 011.393 1.134l-1.02 5.099A6 6 0 0110 16a6 6 0 01-6.926-4.662l-1.02-5.1A1 1 0 013.447 5.1l1.6.8L9 4.324V3a1 1 0 011-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>Admin</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f3f2ee] text-[#555753] border border-[#e2e0d8]">
                              <span>Manager</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-xs text-[#7a7c77]">
                          {new Date(member.joinedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        {isAdmin && (
                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              {/* Role Selector / Changer */}
                              {isLastAdmin ? (
                                <span
                                  className="text-[11px] text-[#9a9c96] italic"
                                  title="Cannot demote or remove the sole admin of the wedding."
                                >
                                  Sole Admin
                                </span>
                              ) : (
                                <>
                                  <select
                                    disabled={actionLoadingId === member.id}
                                    value={member.role}
                                    onChange={(e) =>
                                      void handleRoleChange(member, e.target.value as WeddingRole)
                                    }
                                    className="text-xs bg-[#fafaf7] border border-[#d8d5cb] rounded-lg px-2 py-1 text-[#3c3e3a] focus:ring-1 focus:ring-[#851321] focus:outline-none"
                                  >
                                    <option value="ADMIN">Admin</option>
                                    <option value="MANAGER">Manager</option>
                                  </select>

                                  <button
                                    disabled={actionLoadingId === member.id}
                                    onClick={() => void handleRemoveMember(member)}
                                    className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                    title="Remove from workspace"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 2: Pending Invitations (Admins only) */}
        {isAdmin && (
          <section className="bg-white rounded-2xl border border-[#e5e3dc] shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-[#f0eee9] pb-4 mb-6">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1d1b]">
                  Pending Invitations ({invitations.length})
                </h2>
                <p className="text-xs sm:text-sm text-[#7a7c77] mt-0.5">
                  Invitations waiting to be accepted by family members or planners.
                </p>
              </div>
            </div>

            {invitations.length === 0 ? (
              <div className="py-8 text-center text-[#7a7c77]">
                <p className="text-sm">No pending invitations right now.</p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="mt-3 text-xs text-[#851321] font-medium hover:underline inline-flex items-center gap-1"
                >
                  <span>Invite someone now</span> →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 sm:mx-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#f0eee9] text-[11px] font-semibold text-[#8a8d86] uppercase tracking-wider">
                      <th className="py-3 px-4">Invited Email</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4">Invited By</th>
                      <th className="py-3 px-4">Expires In</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f7f6f2] text-sm">
                    {invitations.map((inv) => {
                      const daysLeft = Math.max(
                        0,
                        Math.ceil(
                          (new Date(inv.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                        ),
                      );

                      return (
                        <tr key={inv.id} className="hover:bg-[#fafaf7] transition-colors">
                          <td className="py-4 px-4 font-medium text-[#1c1d1b]">{inv.email}</td>
                          <td className="py-4 px-4">
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-[#faf7f2] text-[#851321] border border-[#ebdccf]">
                              {inv.role}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs text-[#7a7c77]">
                            {inv.invitedBy.displayName || inv.invitedBy.email}
                          </td>
                          <td className="py-4 px-4 text-xs text-[#7a7c77]">
                            {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              disabled={actionLoadingId === inv.id}
                              onClick={() => void handleRevokeInvitation(inv.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#e5e3dc] shadow-xl max-w-lg w-full p-6 sm:p-8 relative">
            <button
              onClick={() => {
                setShowInviteModal(false);
                setCreatedInviteUrl(null);
                setLatestInvite(null);
                setInviteError(null);
              }}
              className="absolute top-5 right-5 text-[#8a8d86] hover:text-[#1c1d1b] font-bold text-lg"
            >
              ✕
            </button>

            <div className="mb-6">
              <span className="text-[11px] font-semibold text-[#851321] uppercase tracking-wider">
                Invite Team Member
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#1c1d1b] mt-1">
                Add Family or Organizer
              </h3>
              <p className="text-xs sm:text-sm text-[#7a7c77] mt-1">
                Send an invitation to join the wedding planning team for {weddingTitle}.
              </p>
            </div>

            {createdInviteUrl ? (
              <div className="space-y-4">
                {latestInvite?.emailDelivery?.delivered ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#14532d] text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[#16a34a] font-bold text-base">✓</span>
                      <p className="font-bold text-[#14532d] text-base">
                        Invitation created successfully!
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm mt-2 text-[#15803d] leading-relaxed">
                      <strong className="font-semibold text-[#14532d]">Email Dispatched:</strong> An
                      automated email was sent to{' '}
                      <strong className="font-semibold text-[#14532d]">{latestInvite.email}</strong>{' '}
                      via Resend.
                    </p>
                    <p className="text-xs sm:text-sm mt-1.5 text-[#15803d] leading-relaxed">
                      You can also copy and share the link below directly via WhatsApp or message:
                    </p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#fffdf5] border border-[#fde68a] text-[#78350f] text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[#d97706] text-lg font-bold">⚠️</span>
                      <p className="font-bold text-[#92400e] text-base">
                        Invitation created successfully!
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm mt-2.5 text-[#92400e] leading-relaxed">
                      <strong className="font-bold text-[#78350f]">Email Delivery Notice:</strong>{' '}
                      {latestInvite?.emailDelivery?.error &&
                      !latestInvite.emailDelivery.error.toLowerCase().includes('fetch failed')
                        ? latestInvite.emailDelivery.error
                        : 'Automated email service could not deliver the email.'}
                    </p>
                    <p className="text-xs sm:text-sm mt-2 text-[#92400e] leading-relaxed">
                      Please copy and share the link below directly with{' '}
                      <strong className="font-semibold text-[#78350f]">
                        {latestInvite?.email || 'the member'}
                      </strong>{' '}
                      via WhatsApp or message:
                    </p>
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-bold text-[#7a7c77] uppercase tracking-wider">
                    Invitation Link (Expires in 7 days)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={createdInviteUrl}
                      className="flex-1 text-xs sm:text-sm bg-[#f8f7f4] border border-[#d8d5cb] rounded-xl px-3 py-2.5 sm:py-3 text-[#3c3e3a] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdInviteUrl)}
                      className="px-5 py-2.5 sm:py-3 bg-[#851321] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#6c0f1b] shrink-0 transition-colors"
                    >
                      {copiedUrl ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-sm transition-colors cursor-pointer mt-2"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.586-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.076-1.93-.46-1.577-.655-2.593-2.261-2.671-2.366-.079-.104-.645-.859-.645-1.637 0-.779.407-1.162.551-1.32.145-.157.316-.197.421-.197.106 0 .211.002.303.006.098.005.228-.037.357.272.132.316.452 1.103.491 1.183.04.08.067.172.013.277-.053.105-.08.171-.158.263-.079.092-.165.205-.236.276-.079.079-.161.165-.069.323.092.158.408.673.874 1.088.6.534 1.106.699 1.264.778.158.079.251.066.343-.04.092-.106.395-.461.5-.619.106-.158.211-.132.356-.079.145.053.921.434 1.079.513.158.079.263.118.303.184.04.066.04.382-.104.787z" />
                  </svg>
                  <span>Share Invitation on WhatsApp</span>
                </button>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setCreatedInviteUrl(null);
                      setLatestInvite(null);
                    }}
                    className="px-5 py-2 rounded-xl text-sm font-medium text-[#5c5d59] hover:text-[#1c1d1b] hover:bg-stone-100 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSendInvite(e)} className="space-y-5">
                {inviteError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    {inviteError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c5d59] mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. brother@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#d8d5cb] focus:border-[#851321] focus:ring-1 focus:ring-[#851321] focus:outline-none bg-[#fafaf7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5c5d59] mb-1.5">
                    Team Role <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInviteRole('MANAGER')}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        inviteRole === 'MANAGER'
                          ? 'border-[#851321] bg-[#faf5f2] ring-1 ring-[#851321]'
                          : 'border-[#e0ded6] bg-[#fafaf7] hover:border-[#cbc8bd]'
                      }`}
                    >
                      <div className="font-semibold text-sm text-[#1c1d1b]">Manager</div>
                      <div className="text-[11px] text-[#7a7c77] mt-1 leading-snug">
                        Can organize tasks, events, guests, vendors, and expenses.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInviteRole('ADMIN')}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        inviteRole === 'ADMIN'
                          ? 'border-[#851321] bg-[#faf5f2] ring-1 ring-[#851321]'
                          : 'border-[#e0ded6] bg-[#fafaf7] hover:border-[#cbc8bd]'
                      }`}
                    >
                      <div className="font-semibold text-sm text-[#1c1d1b]">Admin</div>
                      <div className="text-[11px] text-[#7a7c77] mt-1 leading-snug">
                        Full access plus ability to invite and manage team members.
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-[#5c5d59] hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInvite}
                    className="px-5 py-2.5 rounded-xl bg-[#851321] hover:bg-[#6c0f1b] text-white font-medium text-sm disabled:opacity-50"
                  >
                    {submittingInvite ? 'Sending Invite...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
