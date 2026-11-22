import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendGuestReminders } from './guestsApi';

export interface SendRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingGuestsCount: number;
}

export function SendRemindersModal({
  isOpen,
  onClose,
  pendingGuestsCount,
}: SendRemindersModalProps) {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<{
    totalEligible: number;
    totalSent: number;
    totalFailed: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => sendGuestReminders({ scope: 'ALL_PENDING' }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to dispatch reminder emails.');
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setResult(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminders-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#EBE4DC] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#EBE4DC] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FEF6E6] flex items-center justify-center text-[#B7791F]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 id="reminders-title" className="font-serif text-lg font-bold text-[#1A1C18]">
                Send RSVP Reminders
              </h2>
              <p className="text-xs text-[#86736D]">Follow up with pending guests</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-[#86736D] hover:text-[#1A1C18] hover:bg-[#F3ECE4] rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-[#FEF0F0] border border-[#FADBD8] rounded-xl text-xs text-[#C0392B]">
              {errorMessage}
            </div>
          )}

          {result ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-[#EDF7EE] text-[#2E7D32] flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-base text-[#1A1C18]">Reminders Dispatched</h3>
                <p className="text-xs text-[#6B5E59] mt-1">
                  Sent {result.totalSent} reminder email{result.totalSent === 1 ? '' : 's'} across {result.totalEligible} pending guest{result.totalEligible === 1 ? '' : 's'}.
                </p>
                {result.totalFailed > 0 && (
                  <p className="text-xs text-[#B7791F] mt-1">
                    ({result.totalFailed} guest{result.totalFailed === 1 ? '' : 's'} had no valid email on file)
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-[#554C47]">
              <p>
                This will send a courteous follow-up reminder email to all guests with pending RSVPs who have a valid email address on file.
              </p>
              <div className="p-3 bg-[#F4EFEA] rounded-xl border border-[#E2D8CE] flex items-center justify-between text-xs">
                <span className="font-medium text-[#6B5E59]">Pending Guests</span>
                <span className="font-bold text-[#8D493A] text-sm">{pendingGuestsCount}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#EBE4DC] bg-white flex items-center justify-end gap-2">
          {result ? (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#556251] hover:bg-[#434F3F] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={mutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-[#86736D] hover:bg-[#F3ECE4] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || pendingGuestsCount === 0}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#8D493A] hover:bg-[#72382B] disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {mutation.isPending ? 'Sending Reminders...' : 'Send Reminders Now'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

