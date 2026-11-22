import { useState, useEffect, type FormEvent } from 'react';
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
} from '../../members/membersApi';

interface WorkspaceMembersSectionProps {
  currentUserId?: string;
  isAdmin: boolean;
  onMembersCountChange?: (count: number) => void;
}

export function WorkspaceMembersSection({
  currentUserId,
  isAdmin,
  onMembersCountChange,
}: WorkspaceMembersSectionProps) {
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [invitations, setInvitations] = useState<MemberInvitationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WeddingRole>('MANAGER');
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const membersData = await getMembers();
      setMembers(membersData);
      onMembersCountChange?.(membersData.length);

      if (isAdmin) {
        try {
          const invData = await getPendingInvitations();
          setInvitations(invData);
        } catch {
          // ignore if non-admin
        }
      }
    } catch {
      setError('Unable to load workspace members. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isAdmin]);

  const handleSendInvite = async (e: FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setCreatedInviteUrl(null);
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

      setCreatedInviteUrl(result.inviteUrl ?? null);
      setActionSuccess(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      await loadData();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send team invitation.');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdInviteUrl) return;
    void navigator.clipboard.writeText(createdInviteUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleRoleChange = async (memberId: string, newRole: WeddingRole) => {
    setActionLoadingId(memberId);
    setError(null);
    setActionSuccess(null);
    try {
      await updateMemberRole(memberId, newRole);
      setActionSuccess('Member role updated successfully.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change member role.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveMember = async (memberId: string, displayName: string) => {
    if (!confirm(`Are you sure you want to remove ${displayName} from this wedding workspace?`)) {
      return;
    }

    setActionLoadingId(memberId);
    setError(null);
    setActionSuccess(null);
    try {
      await removeMember(memberId);
      setActionSuccess(`Removed ${displayName} from workspace.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove team member.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    setActionLoadingId(invitationId);
    setError(null);
    setActionSuccess(null);
    try {
      await revokeInvitation(invitationId);
      setActionSuccess('Invitation revoked.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const adminCount = members.filter((m) => m.role === 'ADMIN').length;
  const managerCount = members.filter((m) => m.role === 'MANAGER').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-[#EAE4DC]">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-[#9A6218] uppercase">
            Section 02
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2C1810]">
            Workspace Members & Wedding Team
          </h2>
          <p className="text-xs sm:text-sm text-[#7C6659] mt-0.5">
            Manage family members, wedding planners, and co-hosts managing this wedding celebration.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7B341E] hover:bg-[#642917] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {/* Notifications / Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-[#EAF5EB] border border-[#CDE5D1] text-[#2F6B38] text-xs font-medium flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-[#2F6B38] font-bold">
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg bg-[#FBEAE8] border border-[#F5C2BC] text-[#C53030] text-xs font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[#C53030] font-bold">
            ×
          </button>
        </div>
      )}

      {/* Team Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-4">
          <div className="text-[11px] font-semibold text-[#8C7A70] uppercase">Total Members</div>
          <div className="text-2xl font-serif font-bold text-[#2C1810] mt-1">{members.length}</div>
        </div>
        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-4">
          <div className="text-[11px] font-semibold text-[#8C7A70] uppercase">Administrators</div>
          <div className="text-2xl font-serif font-bold text-[#7B341E] mt-1">{adminCount}</div>
        </div>
        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-4">
          <div className="text-[11px] font-semibold text-[#8C7A70] uppercase">Managers</div>
          <div className="text-2xl font-serif font-bold text-[#9A6218] mt-1">{managerCount}</div>
        </div>
        <div className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-xl p-4">
          <div className="text-[11px] font-semibold text-[#8C7A70] uppercase">Pending Invites</div>
          <div className="text-2xl font-serif font-bold text-[#5A453A] mt-1">{invitations.length}</div>
        </div>
      </div>

      {/* Active Team Roster */}
      <div className="bg-white border border-[#E8E2D8] rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-[#E8E2D8] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#2C1810]">Active Workspace Roster</h3>
          <span className="text-xs text-[#8C7A70]">{members.length} Confirmed Members</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#8C7A70]">Loading workspace members...</div>
        ) : (
          <div className="divide-y divide-[#EAE4DC]">
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const isSoleAdmin = member.role === 'ADMIN' && adminCount === 1;

              return (
                <div
                  key={member.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#F4EFEA] text-[#7B341E] font-bold text-xs flex items-center justify-center border border-[#E3DBD0]">
                      {member.user.displayName
                        ? member.user.displayName
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : member.user.email[0].toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#2C1810]">
                          {member.user.displayName || 'Team Member'}
                        </span>
                        {isCurrentUser && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EAE4DC] text-[#4A3B32]">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#7C6659]">{member.user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Role badge or dropdown */}
                    {isAdmin && !isCurrentUser ? (
                      <select
                        value={member.role}
                        disabled={actionLoadingId === member.id || isSoleAdmin}
                        onChange={(e) =>
                          handleRoleChange(member.id, e.target.value as WeddingRole)
                        }
                        className="px-2.5 py-1 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] text-[#2C1810] font-medium focus:outline-none focus:border-[#7B341E]"
                      >
                        <option value="ADMIN">Administrator</option>
                        <option value="MANAGER">Manager</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          member.role === 'ADMIN'
                            ? 'bg-[#FBEAE8] text-[#7B341E] border border-[#F5C2BC]'
                            : 'bg-[#FEF3E2] text-[#9A6218] border border-[#F6DDAE]'
                        }`}
                      >
                        {member.role === 'ADMIN' ? 'Administrator' : 'Manager'}
                      </span>
                    )}

                    {/* Remove button */}
                    {isAdmin && !isCurrentUser && (
                      <button
                        type="button"
                        disabled={actionLoadingId === member.id || isSoleAdmin}
                        onClick={() =>
                          handleRemoveMember(
                            member.id,
                            member.user.displayName || member.user.email,
                          )
                        }
                        title={
                          isSoleAdmin
                            ? 'Cannot remove the only administrator'
                            : 'Remove from workspace'
                        }
                        className="p-1.5 text-[#A13A28] hover:bg-[#FBEAE8] rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Invitations Table */}
      {isAdmin && invitations.length > 0 && (
        <div className="bg-white border border-[#E8E2D8] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 bg-[#FAF8F5] border-b border-[#E8E2D8] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#2C1810]">Pending Invitations</h3>
            <span className="text-xs text-[#8C7A70]">{invitations.length} Pending</span>
          </div>

          <div className="divide-y divide-[#EAE4DC]">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-[#2C1810]">{inv.email}</div>
                  <div className="text-[11px] text-[#7C6659]">
                    Invited as {inv.role} • Expires{' '}
                    {new Date(inv.expiresAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actionLoadingId === inv.id}
                    onClick={() => handleRevokeInvitation(inv.id)}
                    className="px-3 py-1 text-xs text-[#C53030] hover:bg-[#FBEAE8] rounded-lg transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Invitation Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-[#E8E2D8]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4DC]">
              <h3 className="text-base font-serif font-bold text-[#2C1810]">
                Invite Wedding Team Member
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setCreatedInviteUrl(null);
                }}
                className="p-1 rounded-lg text-[#8C7A70] hover:text-[#2C1810] hover:bg-[#F4EFEA]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {createdInviteUrl ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#EAF5EB] border border-[#CDE5D1] text-[#2F6B38] text-xs">
                  Invitation created successfully! Email has been dispatched, and you can also share this direct link:
                </div>

                <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#D5CCC0] text-xs font-mono text-[#2C1810] break-all select-all">
                  {createdInviteUrl}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex-1 py-2 rounded-lg bg-[#7B341E] text-white text-xs font-semibold shadow hover:bg-[#642917]"
                  >
                    {copiedUrl ? '✓ Link Copied!' : 'Copy Direct Link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setCreatedInviteUrl(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-[#D5CCC0] text-xs font-semibold text-[#5A453A] hover:bg-[#F3EFE9]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A453A] mb-1">
                    Email Address <span className="text-[#C53030]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="family.member@example.com"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A453A] mb-1">
                    Workspace Role <span className="text-[#C53030]">*</span>
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as WeddingRole)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B341E]/20 focus:border-[#7B341E] text-[#2C1810]"
                  >
                    <option value="MANAGER">Manager (Operational Planning)</option>
                    <option value="ADMIN">Administrator (Full Control)</option>
                  </select>
                  <p className="text-[11px] text-[#8C7A70] mt-1">
                    Administrators can manage settings and financial budgets. Managers can coordinate guests, events, and tasks.
                  </p>
                </div>

                {inviteError && (
                  <p className="text-xs text-[#C53030] font-medium">{inviteError}</p>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE4DC]">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg text-[#5A453A] hover:bg-[#F3EFE9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInvite}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#7B341E] text-white hover:bg-[#642917] disabled:opacity-50"
                  >
                    {submittingInvite ? 'Sending...' : 'Send Invitation'}
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
