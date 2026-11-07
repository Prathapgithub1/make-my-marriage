import { apiRequest } from '../../lib/api-client';

export type WeddingRole = 'ADMIN' | 'MANAGER';

export type MemberSummary = {
  id: string;
  userId: string;
  role: WeddingRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
};

export type MemberInvitationSummary = {
  id: string;
  email: string;
  role: WeddingRole;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    id: string;
    displayName: string | null;
    email: string;
  };
  inviteUrl?: string;
  emailDelivery?: {
    delivered: boolean;
    error?: string;
  };
};

export type PublicInvitationSummary = {
  id: string;
  email: string;
  role: WeddingRole;
  expiresAt: string;
  wedding: {
    id: string;
    title: string;
    brideName: string;
    groomName: string;
    weddingDate: string | null;
    location: string | null;
  };
  inviter: {
    displayName: string | null;
  };
};

export type AcceptInvitationResult = {
  membership: {
    id: string;
    weddingId: string;
    role: WeddingRole;
    joinedAt: string;
  };
  wedding: {
    id: string;
    title: string;
    brideName: string;
    groomName: string;
  };
};

type Envelope<T> = { data: T; requestId?: string };

export function getMembers(): Promise<MemberSummary[]> {
  return apiRequest<Envelope<MemberSummary[]>>('members').then((res) => res.data);
}

export function inviteMember(input: {
  email: string;
  role: WeddingRole;
}): Promise<MemberInvitationSummary> {
  return apiRequest<Envelope<MemberInvitationSummary>>('members/invitations', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((res) => res.data);
}

export function getPendingInvitations(): Promise<MemberInvitationSummary[]> {
  return apiRequest<Envelope<MemberInvitationSummary[]>>('members/invitations').then(
    (res) => res.data,
  );
}

export function revokeInvitation(invitationId: string): Promise<{ success: true }> {
  return apiRequest<Envelope<{ success: true }>>(`members/invitations/${invitationId}`, {
    method: 'DELETE',
  }).then((res) => res.data);
}

export function updateMemberRole(membershipId: string, role: WeddingRole): Promise<MemberSummary> {
  return apiRequest<Envelope<MemberSummary>>(`members/${membershipId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }).then((res) => res.data);
}

export function removeMember(membershipId: string): Promise<{ success: true }> {
  return apiRequest<Envelope<{ success: true }>>(`members/${membershipId}`, {
    method: 'DELETE',
  }).then((res) => res.data);
}

export function getPublicInvitation(token: string): Promise<PublicInvitationSummary> {
  return apiRequest<Envelope<PublicInvitationSummary>>(
    `public/member-invitations/${encodeURIComponent(token)}`,
  ).then((res) => res.data);
}

export function acceptInvitation(token: string): Promise<AcceptInvitationResult> {
  return apiRequest<Envelope<AcceptInvitationResult>>(
    `member-invitations/${encodeURIComponent(token)}/accept`,
    {
      method: 'POST',
    },
  ).then((res) => res.data);
}
