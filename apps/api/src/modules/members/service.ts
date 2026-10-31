import { randomBytes } from 'node:crypto';
import type { PrismaClient } from '../../generated/prisma/client';
import { WeddingRole } from '../../generated/prisma/client';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../shared/app-error';
import { hashToken } from '../auth/security';
import type {
  InviteMemberInput,
  MemberInvitationSummary,
  MemberSummary,
  PublicInvitationSummary,
} from './schemas';

export interface EmailDeliveryResult {
  delivered: boolean;
  error?: string;
  resendMessageId?: string;
}

export interface MembersMailer {
  sendInvitationEmail(options: {
    toEmail: string;
    inviterName: string;
    weddingTitle: string;
    role: 'ADMIN' | 'MANAGER';
    inviteUrl: string;
  }): Promise<EmailDeliveryResult>;
}

export function createResendMembersMailer(): MembersMailer {
  const rawFromEmail = env.EMAIL_FROM ?? env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  const isPersonalDomain = /@(gmail|yahoo|hotmail|outlook)\.com$/i.test(rawFromEmail);
  const fromEmail = isPersonalDomain ? 'onboarding@resend.dev' : rawFromEmail;

  return {
    async sendInvitationEmail({
      toEmail,
      inviterName,
      weddingTitle,
      role,
      inviteUrl,
    }): Promise<EmailDeliveryResult> {
      if (!env.RESEND_API_KEY || !fromEmail) {
        logger.info(
          { toEmail, role, weddingTitle, inviteUrl },
          'Resend API key not configured. Logged wedding member invitation link in development.',
        );
        console.log('\n================================================================');
        console.log(`[INVITATION LINK - DEV MODE] Email: ${toEmail}`);
        console.log(`Link: ${inviteUrl}`);
        console.log('Notice: RESEND_API_KEY is not configured in .env.');
        console.log('================================================================\n');
        return {
          delivered: false,
          error: 'Resend API key not configured in environment.',
        };
      }

      try {
        const roleLabel = role === 'ADMIN' ? 'Co-Admin' : 'Manager';
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            subject: `You've been invited to help plan ${weddingTitle}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px 16px; color: #2e302d; line-height: 1.6;">
                <div style="margin-bottom: 24px; text-align: center;">
                  <span style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; background: #851321; color: #ffffff; font-weight: 700; font-size: 20px;">M</span>
                </div>
                <h2 style="font-size: 22px; font-weight: 600; color: #1c1d1b; text-align: center; margin: 0 0 12px 0;">Join the Wedding Team</h2>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #484b47;">
                  <strong>${inviterName}</strong> has invited you to join the wedding planning team for <strong>${weddingTitle}</strong> as a <strong>${roleLabel}</strong>.
                </p>
                <p style="margin: 0 0 24px 0; font-size: 15px; color: #484b47;">
                  As a team member, you'll be able to collaborate on events, guest lists, tasks, and wedding arrangements all in one place.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${inviteUrl}" style="background-color: #851321; color: #ffffff; padding: 13px 28px; border-radius: 9999px; text-decoration: none; font-weight: 500; font-size: 15px; display: inline-block; box-shadow: 0 2px 8px rgba(133, 19, 33, 0.25);">Accept Invitation</a>
                </div>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #767974; text-align: center;">
                  This invitation will expire in 7 days.
                </p>
                <p style="margin: 0; font-size: 12px; color: #a4a7a1; word-break: break-all; text-align: center;">
                  If the button doesn't work, copy and paste this link into your browser:<br/>
                  <a href="${inviteUrl}" style="color: #851321;">${inviteUrl}</a>
                </p>
              </div>
            `,
          }),
        });

        if (!response.ok) {
          const bodyText = await response.text();
          let parsedMessage = '';
          try {
            const parsed = JSON.parse(bodyText);
            parsedMessage = parsed.message || parsed.error || '';
          } catch {
            parsedMessage = bodyText;
          }

          logger.error(
            { status: response.status, body: bodyText },
            'Failed to deliver invitation email via Resend',
          );

          console.log('\n================================================================');
          console.log(`[INVITATION LINK CREATED] For: ${toEmail}`);
          console.log(`Link: ${inviteUrl}`);
          console.log(`Resend delivery note: ${parsedMessage || `HTTP ${response.status}`}`);
          console.log('================================================================\n');

          let friendlyError =
            parsedMessage || `Email service rejected the request (${response.status}).`;
          const lowerMsg = (parsedMessage || '').toLowerCase();
          if (
            response.status === 403 &&
            (lowerMsg.includes('testing') ||
              lowerMsg.includes('verify a domain') ||
              lowerMsg.includes('trial') ||
              lowerMsg.includes('only send'))
          ) {
            friendlyError =
              'Resend trial domain (onboarding@resend.dev) can only send testing emails to your registered account owner email. Verify a custom domain at resend.com to deliver to other email addresses.';
          }

          return {
            delivered: false,
            error: friendlyError,
          };
        }

        const data = (await response.json().catch(() => ({}))) as { id?: string };
        logger.info(
          { toEmail, resendId: data.id },
          'Wedding member invitation email delivered successfully via Resend',
        );
        return {
          delivered: true,
          resendMessageId: data.id,
        };
      } catch (err) {
        logger.error({ err }, 'Error delivering invitation email via Resend');
        let friendlyError =
          'Automated email service is temporarily unreachable. Please share the invitation link directly via WhatsApp or message.';
        if (err instanceof Error) {
          const lower = err.message.toLowerCase();
          if (
            lower.includes('fetch failed') ||
            lower.includes('timeout') ||
            lower.includes('abort') ||
            lower.includes('connect')
          ) {
            friendlyError =
              'Automated email delivery service timed out. Please share the invitation link directly via WhatsApp or message.';
          } else {
            friendlyError = err.message;
          }
        }
        return {
          delivered: false,
          error: friendlyError,
        };
      }
    },
  };
}

export interface MembersServiceOperations {
  getMembers(userId: string): Promise<MemberSummary[]>;
  inviteMember(userId: string, input: InviteMemberInput): Promise<MemberInvitationSummary>;
  getPendingInvitations(userId: string): Promise<MemberInvitationSummary[]>;
  revokeInvitation(userId: string, invitationId: string): Promise<{ success: true }>;
  updateMemberRole(
    userId: string,
    membershipId: string,
    newRole: 'ADMIN' | 'MANAGER',
  ): Promise<MemberSummary>;
  removeMember(userId: string, membershipId: string): Promise<{ success: true }>;
  getPublicInvitation(token: string): Promise<PublicInvitationSummary>;
  acceptInvitation(
    userId: string,
    token: string,
  ): Promise<{
    membership: { id: string; weddingId: string; role: 'ADMIN' | 'MANAGER'; joinedAt: string };
    wedding: { id: string; title: string; brideName: string; groomName: string };
  }>;
}

export function createMembersService(
  databaseClient?: PrismaClient,
  mailer: MembersMailer = createResendMembersMailer(),
): MembersServiceOperations {
  function getDb(): PrismaClient {
    if (!databaseClient) {
      throw new AppError(500, 'DATABASE_UNAVAILABLE', 'Database is not configured.');
    }
    return databaseClient;
  }

  async function requireMemberContext(userId: string) {
    const database = getDb();
    const membership = await database.weddingMembership.findUnique({
      where: { userId },
      include: {
        wedding: true,
      },
    });

    if (!membership) {
      throw new AppError(404, 'NOT_FOUND', 'You do not belong to an active wedding workspace.');
    }

    return { membership, wedding: membership.wedding };
  }

  function deriveStatus(inv: {
    acceptedAt: Date | null;
    revokedAt: Date | null;
    expiresAt: Date;
  }): 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED' {
    if (inv.acceptedAt) return 'ACCEPTED';
    if (inv.revokedAt) return 'REVOKED';
    if (inv.expiresAt.getTime() < Date.now()) return 'EXPIRED';
    return 'PENDING';
  }

  return {
    async getMembers(userId: string): Promise<MemberSummary[]> {
      const database = getDb();
      const { membership } = await requireMemberContext(userId);

      const members = await database.weddingMembership.findMany({
        where: { weddingId: membership.weddingId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      });

      return members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        user: {
          id: m.user.id,
          email: m.user.email,
          displayName: m.user.displayName,
        },
      }));
    },

    async inviteMember(userId: string, input: InviteMemberInput): Promise<MemberInvitationSummary> {
      const database = getDb();
      const { membership, wedding } = await requireMemberContext(userId);

      if (membership.role !== WeddingRole.ADMIN) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'Only wedding administrators can invite new members to the wedding workspace.',
        );
      }

      const normalizedEmail = input.email.trim().toLowerCase();

      // Check if user is already a member of this wedding
      const existingUser = await database.user.findUnique({
        where: { email: normalizedEmail },
        include: { weddingMembership: true },
      });

      if (existingUser?.weddingMembership?.weddingId === membership.weddingId) {
        throw new AppError(
          409,
          'CONFLICT',
          'A user with this email address is already a member of this wedding workspace.',
        );
      }

      // Check if there is an active pending invitation
      const pendingInvite = await database.memberInvitation.findFirst({
        where: {
          weddingId: membership.weddingId,
          email: normalizedEmail,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (pendingInvite) {
        throw new AppError(
          409,
          'CONFLICT',
          'An active invitation is already pending for this email address.',
        );
      }

      const rawToken = randomBytes(32).toString('base64url');
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await database.memberInvitation.create({
        data: {
          weddingId: membership.weddingId,
          email: normalizedEmail,
          role: input.role,
          tokenHash,
          invitedByUserId: userId,
          expiresAt,
        },
        include: {
          invitedByUser: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
      });

      const baseUrl = env.WEB_ORIGIN || 'http://localhost:1234';
      const inviteUrl = `${baseUrl}/invitations/members/${rawToken}`;

      const inviterName =
        invitation.invitedByUser.displayName ||
        invitation.invitedByUser.email ||
        'The Wedding Organizer';

      const emailDelivery = await mailer.sendInvitationEmail({
        toEmail: normalizedEmail,
        inviterName,
        weddingTitle: wedding.title,
        role: input.role,
        inviteUrl,
      });

      return {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: 'PENDING',
        expiresAt: invitation.expiresAt.toISOString(),
        createdAt: invitation.createdAt.toISOString(),
        invitedBy: {
          id: invitation.invitedByUser.id,
          displayName: invitation.invitedByUser.displayName,
          email: invitation.invitedByUser.email,
        },
        inviteUrl,
        emailDelivery: {
          delivered: emailDelivery.delivered,
          error: emailDelivery.error,
        },
      };
    },

    async getPendingInvitations(userId: string): Promise<MemberInvitationSummary[]> {
      const database = getDb();
      const { membership } = await requireMemberContext(userId);

      if (membership.role !== WeddingRole.ADMIN) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'Only wedding administrators can view pending invitations.',
        );
      }

      const invitations = await database.memberInvitation.findMany({
        where: {
          weddingId: membership.weddingId,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          invitedByUser: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: deriveStatus(inv),
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        invitedBy: {
          id: inv.invitedByUser.id,
          displayName: inv.invitedByUser.displayName,
          email: inv.invitedByUser.email,
        },
      }));
    },

    async revokeInvitation(userId: string, invitationId: string): Promise<{ success: true }> {
      const database = getDb();
      const { membership } = await requireMemberContext(userId);

      if (membership.role !== WeddingRole.ADMIN) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'Only wedding administrators can revoke member invitations.',
        );
      }

      const invitation = await database.memberInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation || invitation.weddingId !== membership.weddingId) {
        throw new AppError(404, 'NOT_FOUND', 'Invitation not found in your wedding workspace.');
      }

      if (invitation.acceptedAt) {
        throw new AppError(
          409,
          'CONFLICT',
          'Cannot revoke an invitation that has already been accepted.',
        );
      }

      if (invitation.revokedAt) {
        throw new AppError(409, 'CONFLICT', 'This invitation has already been revoked.');
      }

      await database.memberInvitation.update({
        where: { id: invitationId },
        data: { revokedAt: new Date() },
      });

      return { success: true };
    },

    async updateMemberRole(
      userId: string,
      targetMembershipId: string,
      newRole: 'ADMIN' | 'MANAGER',
    ): Promise<MemberSummary> {
      const database = getDb();
      const { membership } = await requireMemberContext(userId);

      if (membership.role !== WeddingRole.ADMIN) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'Only wedding administrators can change member roles.',
        );
      }

      const target = await database.weddingMembership.findUnique({
        where: { id: targetMembershipId },
      });

      if (!target || target.weddingId !== membership.weddingId) {
        throw new AppError(404, 'NOT_FOUND', 'Target member not found in your wedding workspace.');
      }

      // If demoting from ADMIN to MANAGER, ensure there is at least one other ADMIN
      if (target.role === WeddingRole.ADMIN && newRole === WeddingRole.MANAGER) {
        const adminCount = await database.weddingMembership.count({
          where: {
            weddingId: membership.weddingId,
            role: WeddingRole.ADMIN,
          },
        });

        if (adminCount <= 1) {
          throw new AppError(
            409,
            'LAST_ADMIN',
            'A wedding workspace must have at least one administrator. You cannot demote the last admin.',
          );
        }
      }

      const updated = await database.weddingMembership.update({
        where: { id: targetMembershipId },
        data: { role: newRole },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
            },
          },
        },
      });

      return {
        id: updated.id,
        userId: updated.userId,
        role: updated.role,
        joinedAt: updated.joinedAt.toISOString(),
        user: {
          id: updated.user.id,
          email: updated.user.email,
          displayName: updated.user.displayName,
        },
      };
    },

    async removeMember(userId: string, targetMembershipId: string): Promise<{ success: true }> {
      const database = getDb();
      const { membership } = await requireMemberContext(userId);

      if (membership.role !== WeddingRole.ADMIN) {
        throw new AppError(
          403,
          'FORBIDDEN',
          'Only wedding administrators can remove members from the workspace.',
        );
      }

      const target = await database.weddingMembership.findUnique({
        where: { id: targetMembershipId },
      });

      if (!target || target.weddingId !== membership.weddingId) {
        throw new AppError(404, 'NOT_FOUND', 'Target member not found in your wedding workspace.');
      }

      // If removing an ADMIN, ensure at least one other ADMIN remains
      if (target.role === WeddingRole.ADMIN) {
        const adminCount = await database.weddingMembership.count({
          where: {
            weddingId: membership.weddingId,
            role: WeddingRole.ADMIN,
          },
        });

        if (adminCount <= 1) {
          throw new AppError(
            409,
            'LAST_ADMIN',
            'Cannot remove the only administrator of the wedding workspace.',
          );
        }
      }

      await database.weddingMembership.delete({
        where: { id: targetMembershipId },
      });

      return { success: true };
    },

    async getPublicInvitation(token: string): Promise<PublicInvitationSummary> {
      const database = getDb();
      const tokenHash = hashToken(token);

      const invitation = await database.memberInvitation.findUnique({
        where: { tokenHash },
        include: {
          wedding: true,
          invitedByUser: {
            select: {
              displayName: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new AppError(404, 'NOT_FOUND', 'Invitation link is invalid or does not exist.');
      }

      if (invitation.revokedAt) {
        throw new AppError(400, 'INVALID_TOKEN', 'This wedding invitation has been revoked.');
      }

      if (invitation.acceptedAt) {
        throw new AppError(
          409,
          'INVITATION_ALREADY_ACCEPTED',
          'This wedding invitation has already been accepted.',
        );
      }

      if (invitation.expiresAt.getTime() < Date.now()) {
        throw new AppError(
          400,
          'TOKEN_EXPIRED',
          'This wedding invitation has expired. Please ask the organizer for a new invite link.',
        );
      }

      return {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
        wedding: {
          id: invitation.wedding.id,
          title: invitation.wedding.title,
          brideName: invitation.wedding.brideName,
          groomName: invitation.wedding.groomName,
          weddingDate: invitation.wedding.weddingDate
            ? invitation.wedding.weddingDate.toISOString().slice(0, 10)
            : null,
          location: invitation.wedding.location,
        },
        inviter: {
          displayName: invitation.invitedByUser.displayName,
        },
      };
    },

    async acceptInvitation(userId: string, token: string) {
      const database = getDb();
      const user = await database.user.findUnique({
        where: { id: userId },
        include: { weddingMembership: true },
      });

      if (!user) {
        throw new AppError(401, 'UNAUTHENTICATED', 'Sign in to accept this invitation.');
      }

      if (user.weddingMembership) {
        throw new AppError(
          409,
          'ALREADY_HAS_WEDDING',
          'You already belong to a wedding workspace. A user can only belong to one wedding in V1.',
        );
      }

      const tokenHash = hashToken(token);

      const invitation = await database.memberInvitation.findUnique({
        where: { tokenHash },
        include: { wedding: true },
      });

      if (!invitation) {
        throw new AppError(404, 'NOT_FOUND', 'Invitation link is invalid or does not exist.');
      }

      if (invitation.revokedAt) {
        throw new AppError(400, 'INVALID_TOKEN', 'This wedding invitation has been revoked.');
      }

      if (invitation.acceptedAt) {
        throw new AppError(
          409,
          'INVITATION_ALREADY_ACCEPTED',
          'This wedding invitation has already been accepted.',
        );
      }

      if (invitation.expiresAt.getTime() < Date.now()) {
        throw new AppError(400, 'TOKEN_EXPIRED', 'This wedding invitation has expired.');
      }

      // Check if the signed in user's email matches the invited email
      if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new AppError(
          403,
          'INVITATION_EMAIL_MISMATCH',
          `This invitation was sent to ${invitation.email}. You are currently signed in as ${user.email}. Please switch accounts to accept.`,
        );
      }

      const result = await database.$transaction(async (tx) => {
        const updateResult = await tx.memberInvitation.updateMany({
          where: {
            id: invitation.id,
            acceptedAt: null,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: { acceptedAt: new Date() },
        });

        if (updateResult.count === 0) {
          throw new AppError(
            409,
            'INVITATION_ALREADY_ACCEPTED',
            'This wedding invitation has already been accepted or is no longer valid.',
          );
        }

        const membership = await tx.weddingMembership.create({
          data: {
            weddingId: invitation.weddingId,
            userId: user.id,
            role: invitation.role,
          },
        });

        return { membership, wedding: invitation.wedding };
      });

      return {
        membership: {
          id: result.membership.id,
          weddingId: result.membership.weddingId,
          role: result.membership.role,
          joinedAt: result.membership.joinedAt.toISOString(),
        },
        wedding: {
          id: result.wedding.id,
          title: result.wedding.title,
          brideName: result.wedding.brideName,
          groomName: result.wedding.groomName,
        },
      };
    },
  };
}
