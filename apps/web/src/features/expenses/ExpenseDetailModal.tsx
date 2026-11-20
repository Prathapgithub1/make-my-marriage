import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../lib/api-client';
import {
  CATEGORY_META,
  EXPENSE_PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
  deleteExpense,
  formatCurrencyINR,
  formatShortDate,
  recordExpensePayment,
  type ExpensePaymentMethod,
  type ExpenseRecord,
} from './expensesApi';

interface ExpenseDetailModalProps {
  expense: ExpenseRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (expense: ExpenseRecord) => void;
  onUpdated: (expense: ExpenseRecord) => void;
  onDeleted: (expenseId: string) => void;
}

export function ExpenseDetailModal({
  expense,
  isOpen,
  onClose,
  onEdit,
  onUpdated,
  onDeleted,
}: ExpenseDetailModalProps) {
  const [paymentInput, setPaymentInput] = useState('');
  const [methodInput, setMethodInput] = useState<ExpensePaymentMethod | ''>('');
  const [referenceInput, setReferenceInput] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!expense || !isOpen) return;
    setPaymentInput(String(Number(expense.amount)));
    setMethodInput(expense.paymentMethod ?? '');
    setReferenceInput(expense.referenceNumber ?? '');
    setConfirmDelete(false);
    setErrorMessage(null);
  }, [expense, isOpen]);

  if (!isOpen || !expense) return null;

  const categoryMeta = CATEGORY_META[expense.category] ?? CATEGORY_META.OTHER;
  const statusMeta = PAYMENT_STATUS_META[expense.paymentStatus] ?? PAYMENT_STATUS_META.PENDING;
  const amountNum = Number(expense.amount);
  const paidNum = Number(expense.paidAmount);
  const paidPercent = amountNum > 0 ? Math.min(100, Math.round((paidNum / amountNum) * 100)) : 0;

  async function handleRecordPayment() {
    if (!expense) return;
    setErrorMessage(null);
    const val = Number(paymentInput);
    if (!Number.isFinite(val) || val < 0 || val > amountNum) {
      setErrorMessage(`Paid amount must be between ₹0 and ${formatCurrencyINR(expense.amount)}.`);
      return;
    }

    setRecordingPayment(true);
    try {
      const updated = await recordExpensePayment(expense.id, {
        paidAmount: paymentInput,
        paymentMethod: methodInput || null,
        referenceNumber: referenceInput.trim() || null,
      });
      onUpdated(updated);
    } catch (err) {
      setErrorMessage(err instanceof ApiRequestError ? err.message : 'Unable to record payment.');
    } finally {
      setRecordingPayment(false);
    }
  }

  async function handleDelete() {
    if (!expense) return;
    setDeleting(true);
    setErrorMessage(null);
    try {
      await deleteExpense(expense.id);
      onDeleted(expense.id);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof ApiRequestError ? err.message : 'Unable to delete expense.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-detail-title"
    >
      <div className="bg-[#FAF8F5] rounded-3xl border border-[#EAE6E1] shadow-2xl w-full max-w-xl my-auto overflow-hidden">
        <div className="bg-white px-6 py-5 border-b border-[#EAE6E1] flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${categoryMeta.pillBg} ${categoryMeta.pillText}`}
              >
                {categoryMeta.label}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                {statusMeta.label}
              </span>
            </div>
            <h2
              id="expense-detail-title"
              className="font-serif text-xl sm:text-2xl font-bold text-[#1A1C18]"
            >
              {expense.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#EAE6E1] text-[#5C5D59] hover:text-[#1A1C18] flex items-center justify-center shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {errorMessage && (
            <div className="rounded-xl bg-[#FDECEA] border border-[#F6C8C2] px-4 py-3 text-sm text-[#A8382B]">
              {errorMessage}
            </div>
          )}

          {/* Monetary Progress Box */}
          <div className="bg-white rounded-2xl border border-[#EAE6E1] p-5 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#86736D] font-semibold">
                  Total Amount
                </p>
                <p className="font-serif text-xl font-bold text-[#1A1C18] mt-0.5">
                  {formatCurrencyINR(expense.amount)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#556251] font-semibold">
                  Paid So Far
                </p>
                <p className="font-serif text-xl font-bold text-[#2F6B38] mt-0.5">
                  {formatCurrencyINR(expense.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#A66E22] font-semibold">
                  Balance Due
                </p>
                <p className="font-serif text-xl font-bold text-[#8D493A] mt-0.5">
                  {formatCurrencyINR(expense.remainingAmount)}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#6B5F57]">
                <span>Payment Settlement</span>
                <span className="font-semibold">{paidPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#EFECE7] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#556251] transition-all duration-300"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Metadata Details Grid */}
          <div className="bg-white rounded-2xl border border-[#EAE6E1] p-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-[#86736D] block">Ceremony / Event</span>
              <span className="font-medium text-[#1A1C18]">
                {expense.eventName ?? 'General Wedding'}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#86736D] block">Vendor</span>
              <span className="font-medium text-[#1A1C18]">
                {expense.vendorName ?? 'Direct / Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#86736D] block">Expense Date</span>
              <span className="font-medium text-[#1A1C18]">{formatShortDate(expense.spentAt)}</span>
            </div>
            <div>
              <span className="text-xs text-[#86736D] block">Due Date</span>
              <span className="font-medium text-[#1A1C18]">{formatShortDate(expense.dueDate)}</span>
            </div>
            <div>
              <span className="text-xs text-[#86736D] block">Payment Method</span>
              <span className="font-medium text-[#1A1C18]">
                {PAYMENT_METHOD_LABELS[expense.paymentMethod ?? 'UNSPECIFIED']}
              </span>
            </div>
            <div>
              <span className="text-xs text-[#86736D] block">Paid By</span>
              <span className="font-medium text-[#1A1C18]">{expense.paidBy ?? '—'}</span>
            </div>
            <div>
              <span className="text-xs text-[#86736D] block">Invoice / Reference No.</span>
              <span className="font-medium text-[#1A1C18]">{expense.referenceNumber ?? '—'}</span>
            </div>
            <div>
              <span className="text-xs text-[#86736D] block">Recorded By</span>
              <span className="font-medium text-[#1A1C18]">
                {expense.createdByName ?? 'Team Member'}
              </span>
            </div>
            {expense.notes && (
              <div className="col-span-2 pt-2 border-t border-[#F4F2EE]">
                <span className="text-xs text-[#86736D] block mb-1">Notes</span>
                <p className="text-sm text-[#4A4640] whitespace-pre-line">{expense.notes}</p>
              </div>
            )}
          </div>

          {/* Quick Payment Update Action */}
          {expense.paymentStatus !== 'CANCELLED' && (
            <div className="bg-[#F5EFE9] rounded-2xl border border-[#DFD2C6] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8D493A]">
                  Record / Update Payment
                </h3>
                {expense.paymentStatus !== 'PAID' && (
                  <button
                    type="button"
                    onClick={() => setPaymentInput(String(Number(expense.amount)))}
                    className="text-xs font-semibold text-[#556251] hover:underline cursor-pointer"
                  >
                    Fill Full Amount
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentInput}
                  onChange={(e) => setPaymentInput(e.target.value)}
                  aria-label="Total paid amount"
                  placeholder="Paid ₹"
                  className="rounded-xl bg-white border border-[#DED8D0] px-3 py-2 text-sm"
                />
                <select
                  value={methodInput}
                  onChange={(e) => setMethodInput(e.target.value as ExpensePaymentMethod | '')}
                  aria-label="Payment method"
                  className="rounded-xl bg-white border border-[#DED8D0] px-3 py-2 text-sm"
                >
                  <option value="">Method</option>
                  {EXPENSE_PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={referenceInput}
                  onChange={(e) => setReferenceInput(e.target.value)}
                  aria-label="Reference number"
                  placeholder="UTR / Receipt #"
                  className="rounded-xl bg-white border border-[#DED8D0] px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={recordingPayment}
                  onClick={handleRecordPayment}
                  className="px-4 py-2 rounded-xl bg-[#556251] text-white text-xs font-semibold hover:bg-[#434E3F] disabled:opacity-60 cursor-pointer"
                >
                  {recordingPayment ? 'Updating...' : 'Update Payment Status'}
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EAE6E1]">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#A8382B] hover:bg-[#FDECEA] transition-colors cursor-pointer"
              >
                Delete Expense
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl bg-[#A8382B] text-white text-xs font-semibold hover:bg-[#8E2D22] disabled:opacity-60 cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 rounded-xl text-xs text-[#5C5D59] hover:bg-[#EFECE7] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#DED8D0] bg-white text-sm font-medium text-[#5C5D59] hover:bg-[#FAF8F5] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(expense);
                }}
                className="px-5 py-2 rounded-xl bg-[#8D493A] text-white text-sm font-semibold hover:bg-[#763B2E] cursor-pointer"
              >
                Edit Expense
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
