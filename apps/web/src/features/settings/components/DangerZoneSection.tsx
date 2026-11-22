import { useState } from 'react';
import { useNavigate } from 'react-router';
import { deleteWeddingWorkspace } from '../../wedding/weddingApi';
import { useAuth } from '../../auth/AuthProvider';

interface DangerZoneSectionProps {
  weddingTitle: string;
  isAdmin: boolean;
}

export function DangerZoneSection({ weddingTitle, isAdmin }: DangerZoneSectionProps) {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isConfirmed = confirmationInput.trim() === weddingTitle.trim();

  const handleDeleteWorkspace = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteWeddingWorkspace();
      await refreshSession();
      navigate('/wedding/setup', { replace: true });
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Failed to delete workspace. Please try again.',
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="pb-5 border-b border-[#EAE4DC]">
        <div className="text-[11px] font-bold tracking-wider text-[#C53030] uppercase">
          Section 07 • Caution
        </div>
        <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#C53030]">
          Danger Zone
        </h2>
        <p className="text-xs sm:text-sm text-[#7C6659] mt-0.5">
          Destructive actions that permanently affect this wedding workspace.
        </p>
      </div>

      {/* Admin Guard Notice */}
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-[#FEF3E2] border border-[#F6DDAE] text-[#9A6218] text-xs font-medium">
          ⚠️ Only workspace administrators have authority to reset or delete this wedding celebration.
        </div>
      )}

      {/* Danger Card: Delete Workspace */}
      <div className="bg-[#FFFDFD] border-2 border-[#F5C2BC] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C53030]" />
              <h3 className="text-sm font-bold text-[#2C1810]">Delete This Wedding Workspace</h3>
            </div>
            <p className="text-xs text-[#7C6659] max-w-xl leading-relaxed">
              Once deleted, your entire wedding celebration database will be permanently purged. This includes all ceremonies, guest list RSVPs, tasks, budget spreadsheets, vendor agreements, and cloud media.
            </p>
            <p className="text-[11px] font-bold text-[#C53030]">
              This action is permanent and cannot be undone.
            </p>
          </div>

          <button
            type="button"
            disabled={!isAdmin}
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-lg bg-[#C53030] hover:bg-[#9B2C2C] text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-40 self-start sm:self-auto shrink-0"
          >
            Delete Workspace
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-[#F5C2BC] animate-scaleUp">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#FBEAE8] text-[#C53030] flex items-center justify-center text-lg mx-auto">
                ⚠️
              </div>
              <h3 className="text-base font-serif font-bold text-[#2C1810] text-center">
                Confirm Workspace Deletion
              </h3>
              <p className="text-xs text-[#7C6659] text-center leading-relaxed">
                You are about to permanently delete <strong className="text-[#2C1810]">{weddingTitle}</strong> and all associated celebration data.
              </p>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] space-y-1.5 text-xs text-[#5A453A]">
              <p>Please type the exact wedding name to confirm:</p>
              <div className="font-mono font-bold text-[#7B341E] select-all bg-white px-2 py-1 rounded border border-[#D5CCC0]">
                {weddingTitle}
              </div>
            </div>

            <div>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Type workspace name to confirm"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D5CCC0] focus:outline-none focus:ring-2 focus:ring-[#C53030]/20 focus:border-[#C53030] text-[#2C1810]"
              />
            </div>

            {deleteError && (
              <p className="text-xs text-[#C53030] font-medium">{deleteError}</p>
            )}

            <div className="flex gap-2 pt-2 border-t border-[#EAE4DC]">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmationInput('');
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-2 text-xs font-semibold rounded-lg text-[#5A453A] hover:bg-[#F3EFE9]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isConfirmed || isDeleting}
                onClick={handleDeleteWorkspace}
                className="flex-1 py-2 text-xs font-semibold rounded-lg bg-[#C53030] hover:bg-[#9B2C2C] text-white disabled:opacity-40 shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
