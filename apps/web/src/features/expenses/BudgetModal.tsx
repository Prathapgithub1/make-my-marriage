import { useEffect, useState, type FormEvent } from 'react';
import { ApiRequestError } from '../../lib/api-client';
import { formatCurrencyINR, upsertWeddingBudget, type BudgetOverview } from './expensesApi';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  overview?: BudgetOverview | null;
}

export function BudgetModal({ isOpen, onClose, onSaved, overview }: BudgetModalProps) {
  const [totalBudget, setTotalBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    if (overview?.weddingBudget.hasBudgetConfigured) {
      setTotalBudget(String(Number(overview.weddingBudget.totalBudget)));
      setNotes(overview.weddingBudget.notes ?? '');
    } else {
      setTotalBudget('');
      setNotes('');
    }
  }, [isOpen, overview]);

  if (!isOpen) return null;

  const spentNum = Number(overview?.summary.totalSpent ?? '0');
  const nextBudgetNum = Number(totalBudget || '0');
  const projectedRemaining =
    Number.isFinite(nextBudgetNum) && totalBudget !== '' ? nextBudgetNum - spentNum : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const parsed = Number(totalBudget);
    if (totalBudget === '' || !Number.isFinite(parsed) || parsed < 0) {
      setErrorMessage('Enter a valid non-negative wedding budget amount.');
      return;
    }

    setSubmitting(true);
    try {
      await upsertWeddingBudget({
        totalBudget: totalBudget.trim(),
        currency: 'INR',
        notes: notes.trim() || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof ApiRequestError
          ? err.message
          : 'Could not save wedding budget. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-modal-title"
    >
      <div className="bg-[#FAF8F5] rounded-3xl border border-[#EAE6E1] shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-white px-6 py-5 border-b border-[#EAE6E1] flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8D493A] font-semibold">
              Wedding Financial Cap
            </p>
            <h2
              id="budget-modal-title"
              className="font-serif text-xl sm:text-2xl font-bold text-[#1A1C18] mt-0.5"
            >
              Set Overall Wedding Budget
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close budget modal"
            className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#EAE6E1] text-[#5C5D59] hover:text-[#1A1C18] flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="rounded-xl bg-[#FDECEA] border border-[#F6C8C2] px-4 py-3 text-sm text-[#A8382B]">
              {errorMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="wedding-total-budget"
              className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
            >
              Total Wedding Budget (₹ INR) *
            </label>
            <input
              id="wedding-total-budget"
              type="number"
              min="0"
              step="0.01"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="e.g., 2500000"
              className="w-full rounded-xl bg-white border border-[#DED8D0] px-4 py-3 text-base font-semibold text-[#1A1C18] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/25 focus:border-[#8D493A]"
            />
          </div>

          {overview && (
            <div className="bg-white rounded-2xl border border-[#EAE6E1] p-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#86736D] block">Current Committed Spend</span>
                <span className="font-serif text-base font-bold text-[#1A1C18]">
                  {formatCurrencyINR(overview.summary.totalSpent)}
                </span>
              </div>
              <div>
                <span className="text-[#86736D] block">Projected Remaining</span>
                <span
                  className={`font-serif text-base font-bold ${
                    projectedRemaining !== null && projectedRemaining < 0
                      ? 'text-[#A8382B]'
                      : 'text-[#2F6B38]'
                  }`}
                >
                  {projectedRemaining !== null
                    ? formatCurrencyINR(projectedRemaining)
                    : formatCurrencyINR(overview.summary.remainingBudget)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="wedding-budget-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
            >
              Budget Assumptions / Reserve Notes
            </label>
            <textarea
              id="wedding-budget-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Includes 10% contingency buffer for guest hospitality & travel upgrades."
              className="w-full rounded-xl bg-white border border-[#DED8D0] px-3.5 py-2.5 text-sm text-[#1A1C18]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EAE6E1]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[#DED8D0] bg-white text-sm font-medium text-[#5C5D59] hover:bg-[#FAF8F5] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#8D493A] text-white text-sm font-semibold hover:bg-[#763B2E] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
