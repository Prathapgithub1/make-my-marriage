import { z } from 'zod';

export const weddingRoleSchema = z.enum(['ADMIN', 'MANAGER']);

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address')
    .max(320, 'Email address cannot exceed 320 characters'),
  role: weddingRoleSchema.default('MANAGER'),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: weddingRoleSchema,
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

export type MemberSummary = {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MANAGER';
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
  role: 'ADMIN' | 'MANAGER';
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
  role: 'ADMIN' | 'MANAGER';
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
