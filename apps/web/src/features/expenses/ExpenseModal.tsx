import { useEffect, useState, type FormEvent } from 'react';
import { ApiRequestError } from '../../lib/api-client';
import {
  CATEGORY_META,
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
  EXPENSE_PAYMENT_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
  createExpense,
  createVendor,
  formatCurrencyINR,
  updateExpense,
  type ExpenseCategory,
  type ExpensePaymentMethod,
  type ExpensePaymentStatus,
  type ExpenseRecord,
  type VendorRecord,
} from './expensesApi';

export interface SimpleEventOption {
  id: string;
  name: string;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (expense: ExpenseRecord) => void;
  expense?: ExpenseRecord | null;
  events: SimpleEventOption[];
  vendors: VendorRecord[];
  onVendorCreated?: (vendor: VendorRecord) => void;
  defaultEventId?: string | null;
}

function getTodayDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSaved,
  expense,
  events,
  vendors,
  onVendorCreated,
  defaultEventId = null,
}: ExpenseModalProps) {
  const isEditing = Boolean(expense);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('OTHER');
  const [amount, setAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<ExpensePaymentStatus>('PENDING');
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod | ''>('');
  const [spentAt, setSpentAt] = useState(getTodayDateString());
  const [dueDate, setDueDate] = useState('');
  const [eventId, setEventId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Quick inline vendor creation state
  const [showNewVendor, setShowNewVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState<ExpenseCategory>('OTHER');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [creatingVendor, setCreatingVendor] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage(null);
    setFieldErrors({});
    setShowNewVendor(false);
    setNewVendorName('');
    setNewVendorPhone('');

    if (expense) {
      setTitle(expense.title);
      setCategory(expense.category);
      setAmount(String(Number(expense.amount)));
      setPaidAmount(String(Number(expense.paidAmount)));
      setPaymentStatus(expense.paymentStatus);
      setPaymentMethod(expense.paymentMethod ?? '');
      setSpentAt(expense.spentAt);
      setDueDate(expense.dueDate ?? '');
      setEventId(expense.eventId ?? '');
      setVendorId(expense.vendorId ?? '');
      setPaidBy(expense.paidBy ?? '');
      setReferenceNumber(expense.referenceNumber ?? '');
      setNotes(expense.notes ?? '');
      setNewVendorCategory(expense.category);
    } else {
      setTitle('');
      setCategory('OTHER');
      setAmount('');
      setPaidAmount('0');
      setPaymentStatus('PENDING');
      setPaymentMethod('');
      setSpentAt(getTodayDateString());
      setDueDate('');
      setEventId(defaultEventId ?? '');
      setVendorId('');
      setPaidBy('');
      setReferenceNumber('');
      setNotes('');
      setNewVendorCategory('OTHER');
    }
  }, [isOpen, expense, defaultEventId]);

  if (!isOpen) return null;

  const parsedAmount = Number(amount || '0');
  const parsedPaid = Number(paidAmount || '0');
  const remainingPreview =
    Number.isFinite(parsedAmount) && Number.isFinite(parsedPaid)
      ? Math.max(0, parsedAmount - parsedPaid)
      : 0;

  function handleStatusChange(nextStatus: ExpensePaymentStatus) {
    setPaymentStatus(nextStatus);
    if (nextStatus === 'PAID' && amount && Number(amount) > 0) {
      setPaidAmount(amount);
    } else if (nextStatus === 'PENDING' && paidAmount === amount) {
      setPaidAmount('0');
    }
  }

  async function handleCreateInlineVendor() {
    if (!newVendorName.trim()) {
      setErrorMessage('Enter a vendor name before saving.');
      return;
    }
    setCreatingVendor(true);
    setErrorMessage(null);
    try {
      const created = await createVendor({
        name: newVendorName.trim(),
        category: newVendorCategory,
        phone: newVendorPhone.trim() || null,
      });
      onVendorCreated?.(created);
      setVendorId(created.id);
      setShowNewVendor(false);
      setNewVendorName('');
      setNewVendorPhone('');
    } catch (err) {
      setErrorMessage(
        err instanceof ApiRequestError ? err.message : 'Unable to save new vendor right now.',
      );
    } finally {
      setCreatingVendor(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) {
      nextErrors.title = 'Please enter an expense title.';
    }

    const totalNum = Number(amount);
    if (!amount || !Number.isFinite(totalNum) || totalNum <= 0) {
      nextErrors.amount = 'Enter a valid expense amount greater than 0.';
    }

    const paidNum = paidAmount === '' ? 0 : Number(paidAmount);
    if (!Number.isFinite(paidNum) || paidNum < 0) {
      nextErrors.paidAmount = 'Paid amount must be 0 or higher.';
    } else if (Number.isFinite(totalNum) && paidNum > totalNum) {
      nextErrors.paidAmount = 'Paid amount cannot exceed total expense amount.';
    } else if (paymentStatus === 'PAID' && Number.isFinite(totalNum) && paidNum !== totalNum) {
      nextErrors.paidAmount = 'Paid amount must equal total amount when marked Paid in Full.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        category,
        amount: amount.trim(),
        paidAmount: (paidAmount || '0').trim(),
        paymentStatus,
        paymentMethod: paymentMethod || null,
        spentAt,
        dueDate: dueDate || null,
        eventId: eventId || null,
        vendorId: vendorId || null,
        paidBy: paidBy.trim() || null,
        referenceNumber: referenceNumber.trim() || null,
        notes: notes.trim() || null,
      };

      const saved =
        isEditing && expense
          ? await updateExpense(expense.id, payload)
          : await createExpense(payload);

      onSaved(saved);
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrorMessage(err.message);
        if (err.details) setFieldErrors(err.details);
      } else {
        setErrorMessage('Could not save expense. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
    >
      <div className="bg-[#FAF8F5] rounded-3xl border border-[#EAE6E1] shadow-2xl w-full max-w-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-white px-5 sm:px-7 py-4 sm:py-5 border-b border-[#EAE6E1] flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#8D493A] font-semibold">
              {isEditing ? 'Update Ledger Entry' : 'New Ledger Entry'}
            </p>
            <h2
              id="expense-modal-title"
              className="font-serif text-xl sm:text-2xl font-bold text-[#1A1C18] mt-0.5"
            >
              {isEditing ? 'Edit Wedding Expense' : 'Add Wedding Expense'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close expense modal"
            className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#EAE6E1] text-[#5C5D59] hover:text-[#1A1C18] hover:bg-[#EFECE7] flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5 max-h-[82vh] overflow-y-auto">
          {errorMessage && (
            <div className="rounded-xl bg-[#FDECEA] border border-[#F6C8C2] px-4 py-3 text-sm text-[#A8382B]">
              {errorMessage}
            </div>
          )}

          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-7">
              <label
                htmlFor="expense-title"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
              >
                Expense Title *
              </label>
              <input
                id="expense-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Sangeet Floral Stage & Mandap Deposit"
                className="w-full rounded-xl bg-white border border-[#DED8D0] px-3.5 py-2.5 text-sm text-[#1A1C18] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/25 focus:border-[#8D493A]"
              />
              {fieldErrors.title && (
                <p className="text-xs text-[#A8382B] mt-1">{fieldErrors.title}</p>
              )}
            </div>

            <div className="sm:col-span-5">
              <label
                htmlFor="expense-category"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
              >
                Category
              </label>
              <select
                id="expense-category"
                value={category}
                onChange={(e) => {
                  const val = e.target.value as ExpenseCategory;
                  setCategory(val);
                  setNewVendorCategory(val);
                }}
                className="w-full rounded-xl bg-white border border-[#DED8D0] px-3.5 py-2.5 text-sm text-[#1A1C18] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/25 focus:border-[#8D493A]"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_META[cat].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monetary Amounts & Live Remaining Balance */}
          <div className="bg-white rounded-2xl border border-[#EAE6E1] p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="expense-amount"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
                >
                  Total Amount (₹ INR) *
                </label>
                <input
                  id="expense-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    setAmount(nextVal);
                    if (paymentStatus === 'PAID') {
                      setPaidAmount(nextVal);
                    }
                  }}
                  placeholder="150000"
                  className="w-full rounded-xl bg-[#FAF8F5] border border-[#DED8D0] px-3.5 py-2.5 text-sm font-medium text-[#1A1C18] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/25 focus:border-[#8D493A]"
                />
                {fieldErrors.amount && (
                  <p className="text-xs text-[#A8382B] mt-1">{fieldErrors.amount}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="expense-paid-amount"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
                >
                  Paid So Far (₹ INR)
                </label>
                <input
                  id="expense-paid-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => {
                    const nextPaid = e.target.value;
                    setPaidAmount(nextPaid);
                    const totalN = Number(amount || '0');
                    const paidN = Number(nextPaid || '0');
                    if (totalN > 0 && paidN === totalN) {
                      setPaymentStatus('PAID');
                    } else if (paidN > 0 && paidN < totalN && paymentStatus === 'PENDING') {
                      setPaymentStatus('PARTIAL');
                    }
                  }}
                  placeholder="0"
                  className="w-full rounded-xl bg-[#FAF8F5] border border-[#DED8D0] px-3.5 py-2.5 text-sm font-medium text-[#1A1C18] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/25 focus:border-[#8D493A]"
                />
                {fieldErrors.paidAmount && (
                  <p className="text-xs text-[#A8382B] mt-1">{fieldErrors.paidAmount}</p>
                )}
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5">
                  Balance Due
                </span>
                <div className="rounded-xl bg-[#FAF8F5] border border-dashed border-[#DED8D0] px-3.5 py-2.5 text-sm font-semibold text-[#1A1C18]">
                  {formatCurrencyINR(remainingPreview)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="expense-payment-status"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
                >
                  Payment Status
                </label>
                <select
                  id="expense-payment-status"
                  value={paymentStatus}
                  onChange={(e) => handleStatusChange(e.target.value as ExpensePaymentStatus)}
                  className="w-full rounded-xl bg-[#FAF8F5] border border-[#DED8D0] px-3.5 py-2.5 text-sm text-[#1A1C18] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/25 focus:border-[#8D493A]"
                >
                  {EXPENSE_PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {PAYMENT_STATUS_META[status].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="expense-payment-method"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
                >
                  Payment Method
                </label>
                <select
                  id="expense-payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethod | '')}
                  className="w-full rounded-xl bg-[#FAF8F5] border border-[#DED8D0] px-3.5 py-2.5 text-sm text-[#1A1C18] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/25 focus:border-[#8D493A]"
                >
                  <option value="">Select payment method (optional)</option>
                  {EXPENSE_PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Event & Vendor Associations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="expense-event"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
              >
                Wedding Event / Ceremony
              </label>
              <select
                id="expense-event"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#DED8D0] px-3.5 py-2.5 text-sm text-[#1A1C18] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/25 focus:border-[#8D493A]"
              >
                <option value="">General Wedding Expense</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="expense-vendor"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59]"
                >
                  Vendor / Payee
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewVendor((prev) => !prev)}
                  className="text-xs font-semibold text-[#8D493A] hover:underline cursor-pointer"
                >
                  {showNewVendor ? 'Cancel' : '+ Quick Add Vendor'}
                </button>
              </div>
              <select
                id="expense-vendor"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#DED8D0] px-3.5 py-2.5 text-sm text-[#1A1C18] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/25 focus:border-[#8D493A]"
              >
                <option value="">Direct / Unassigned Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({CATEGORY_META[v.category]?.label ?? v.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showNewVendor && (
            <div className="bg-[#F5EFE9] rounded-2xl border border-[#DFD2C6] p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8D493A]">
                Create New Vendor
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  placeholder="Vendor business name *"
                  className="rounded-xl bg-white border border-[#DED8D0] px-3 py-2 text-sm"
                />
                <select
                  value={newVendorCategory}
                  onChange={(e) => setNewVendorCategory(e.target.value as ExpenseCategory)}
                  className="rounded-xl bg-white border border-[#DED8D0] px-3 py-2 text-sm"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_META[cat].label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newVendorPhone}
                  onChange={(e) => setNewVendorPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="rounded-xl bg-white border border-[#DED8D0] px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={creatingVendor}
                  onClick={handleCreateInlineVendor}
                  className="px-4 py-1.5 rounded-xl bg-[#8D493A] text-white text-xs font-semibold hover:bg-[#763B2E] disabled:opacity-60 cursor-pointer"
                >
                  {creatingVendor ? 'Adding...' : 'Save Vendor'}
                </button>
              </div>
            </div>
          )}

          {/* Dates, Paid By & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="expense-spent-at"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
              >
                Expense Date *
              </label>
              <input
                id="expense-spent-at"
                type="date"
                value={spentAt}
                onChange={(e) => setSpentAt(e.target.value)}
                required
                className="w-full rounded-xl bg-white border border-[#DED8D0] px-3 py-2 text-sm text-[#1A1C18]"
              />
            </div>

            <div>
              <label
                htmlFor="expense-due-date"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
              >
                Balance Due Date
              </label>
              <input
                id="expense-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl bg-white border border-[#DED8D0] px-3 py-2 text-sm text-[#1A1C18]"
              />
            </div>

            <div>
              <label
                htmlFor="expense-paid-by"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
              >
                Paid By
              </label>
              <input
                id="expense-paid-by"
                type="text"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                placeholder="e.g., Bride's Family"
                className="w-full rounded-xl bg-white border border-[#DED8D0] px-3 py-2 text-sm text-[#1A1C18]"
              />
            </div>

            <div>
              <label
                htmlFor="expense-reference"
                className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
              >
                Invoice / UTR Ref
              </label>
              <input
                id="expense-reference"
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="INV-2026-01"
                className="w-full rounded-xl bg-white border border-[#DED8D0] px-3 py-2 text-sm text-[#1A1C18]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="expense-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-[#5C5D59] mb-1.5"
            >
              Notes & Payment Milestones
            </label>
            <textarea
              id="expense-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contract deliverables, GST details, or next installment terms..."
              className="w-full rounded-xl bg-white border border-[#DED8D0] px-3.5 py-2.5 text-sm text-[#1A1C18] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/25 focus:border-[#8D493A]"
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
              className="px-6 py-2.5 rounded-xl bg-[#8D493A] text-white text-sm font-semibold hover:bg-[#763B2E] disabled:opacity-60 shadow-xs cursor-pointer"
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
