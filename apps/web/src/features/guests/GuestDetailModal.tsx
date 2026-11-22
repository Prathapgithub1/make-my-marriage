import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type GuestSummary,
  RSVP_STATUS_LABELS,
  RSVP_STATUS_STYLES,
  getInvitationLink,
  sendGuestInvitation,
  getWhatsAppShareUrl,
} from './guestsApi';

export interface GuestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: GuestSummary | null;
  weddingTitle?: string;
  onEdit: (guest: GuestSummary) => void;
  onDelete: (guestId: string) => void;
}

export function GuestDetailModal({
  isOpen,
  onClose,
  guest,
  weddingTitle = 'Our Wedding',
  onEdit,
  onDelete,
}: GuestDetailModalProps) {
  const queryClient = useQueryClient();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const sendInvitationMutation = useMutation({
    mutationFn: (guestId: string) => sendGuestInvitation(guestId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      if (data.delivered) {
        setActionSuccess('Invitation email sent successfully.');
      } else {
        setActionError(data.error || 'Invitation generated, but email delivery was not configured.');
      }
    },
    onError: (err: Error) => {
      setActionError(err.message || 'Failed to dispatch invitation email.');
    },
  });

  if (!isOpen || !guest) return null;

  const statusStyle = RSVP_STATUS_STYLES[guest.rsvpStatus];
  const statusLabel = RSVP_STATUS_LABELS[guest.rsvpStatus];

  const handleCopyLink = async () => {
    try {
      setActionError(null);
      const linkData = await getInvitationLink(guest.id);
      const inviteUrl = linkData.url || `${window.location.origin}/invite/${linkData.token}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopyFeedback('Link copied to clipboard!');
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch {
      setActionError('Could not copy link to clipboard.');
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      setActionError(null);
      const linkData = await getInvitationLink(guest.id);
      const inviteUrl = linkData.url || `${window.location.origin}/invite/${linkData.token}`;
      const waUrl = getWhatsAppShareUrl(guest.name, weddingTitle, inviteUrl);
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setActionError('Could not generate WhatsApp share link.');
    }
  };

  const handleSendEmail = () => {
    setActionError(null);
    setActionSuccess(null);
    sendInvitationMutation.mutate(guest.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-xl bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#EBE4DC] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#EBE4DC] bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 id="guest-detail-title" className="font-serif text-2xl font-bold text-[#1A1C18]">
                {guest.name}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-[#86736D]">
              Invited party capacity: <strong className="text-[#1A1C18] font-semibold">{guest.maxGuests} guest{guest.maxGuests > 1 ? 's' : ''}</strong>
              {guest.rsvpStatus === 'ATTENDING' && (
                <span className="ml-2 text-[#2E7D32]">
                  ({guest.attendingCount} attending)
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#86736D] hover:text-[#1A1C18] hover:bg-[#F3ECE4] rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {actionError && (
            <div className="p-3 bg-[#FEF0F0] border border-[#FADBD8] rounded-xl text-xs text-[#C0392B] flex items-center justify-between">
              <span>{actionError}</span>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-[#C0392B] hover:opacity-80 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 bg-[#EDF7EE] border border-[#C8E6C9] rounded-xl text-xs text-[#2E7D32] flex items-center justify-between">
              <span>{actionSuccess}</span>
              <button
                type="button"
                onClick={() => setActionSuccess(null)}
                className="text-[#2E7D32] hover:opacity-80 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Contact Details */}
          <div className="bg-white p-4 rounded-xl border border-[#EBE4DC] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#86736D]">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-[#86736D] block">Email</span>
                {guest.email ? (
                  <a
                    href={`mailto:${guest.email}`}
                    className="font-medium text-[#8D493A] hover:underline break-all"
                  >
                    {guest.email}
                  </a>
                ) : (
                  <span className="text-[#86736D] italic">Not provided</span>
                )}
              </div>
              <div>
                <span className="text-xs text-[#86736D] block">Phone / WhatsApp</span>
                {guest.phone ? (
                  <a
                    href={`tel:${guest.phone}`}
                    className="font-medium text-[#1A1C18] hover:text-[#8D493A]"
                  >
                    {guest.phone}
                  </a>
                ) : (
                  <span className="text-[#86736D] italic">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Invited Ceremonies */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#86736D]">
              Invited Ceremonies ({guest.invitedEvents?.length ?? 0})
            </h3>
            {guest.invitedEvents && guest.invitedEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {guest.invitedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 bg-white rounded-xl border border-[#EBE4DC] flex flex-col justify-between"
                  >
                    <div className="font-semibold text-sm text-[#1A1C18]">{event.name}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-[#86736D]">
                      {event.startsAt && (
                        <span>
                          {new Date(event.startsAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      {event.venueName && (
                        <>
                          <span>•</span>
                          <span className="truncate">{event.venueName}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#86736D] italic bg-white p-3 rounded-xl border border-[#EBE4DC]">
                Invited to all general celebrations.
              </p>
            )}
          </div>

          {/* Invitation & Dispatch Sharing Options */}
          <div className="bg-[#F4EFEA] p-4 rounded-xl border border-[#E2D8CE] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D493A]">
                Shareable Invitation & RSVP Link
              </h3>
              {copyFeedback && (
                <span className="text-xs font-medium text-[#2E7D32] bg-[#EDF7EE] px-2 py-0.5 rounded border border-[#C8E6C9] animate-in fade-in">
                  {copyFeedback}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B5E59]">
              Every guest receives a personal invitation link that opens their customized schedule and RSVP response form.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-[#1A1C18] border border-[#D5C9BE] hover:bg-[#F3ECE4] transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4 text-[#8D493A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#25D366] text-white hover:bg-[#20BD5A] transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.303c-.087.087-.177.182-.076.356.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086.159.058 1.011.477 1.184.564.173.087.289.13.332.202.043.073.043.419-.101.824z" />
                </svg>
                Share on WhatsApp
              </button>

              {guest.email && (
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={sendInvitationMutation.isPending}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#8D493A] text-white hover:bg-[#72382B] disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {sendInvitationMutation.isPending
                    ? 'Sending...'
                    : guest.invitationSentAt
                      ? 'Resend Email'
                      : 'Send Invitation Email'}
                </button>
              )}
            </div>

            {guest.invitationSentAt && (
              <p className="text-[11px] text-[#86736D]">
                Last sent: {new Date(guest.invitationSentAt).toLocaleString()}
                {guest.reminderCount > 0 && ` (${guest.reminderCount} reminder${guest.reminderCount > 1 ? 's' : ''} sent)`}
              </p>
            )}
          </div>

          {/* Notes */}
          {guest.notes && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#86736D]">Organizer Notes</h3>
              <div className="p-3 bg-white rounded-xl border border-[#EBE4DC] text-xs text-[#554C47] whitespace-pre-wrap leading-relaxed">
                {guest.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#EBE4DC] bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Are you sure you want to remove ${guest.name} from the guest list?`)) {
                onDelete(guest.id);
                onClose();
              }
            }}
            className="px-3.5 py-2 text-xs font-semibold text-[#C0392B] hover:bg-[#FEF0F0] rounded-lg transition-colors cursor-pointer"
          >
            Delete Guest
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#86736D] hover:bg-[#F3ECE4] rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onEdit(guest);
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#556251] hover:bg-[#434F3F] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

