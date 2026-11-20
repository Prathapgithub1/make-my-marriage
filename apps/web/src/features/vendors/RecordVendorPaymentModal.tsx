import { useState, useEffect } from 'react';
import {
  formatCurrencyINR,
  PAYMENT_METHODS,
  recordVendorPayment,
  type PaymentMethodValue,
  type RecordVendorPaymentPayload,
  type VendorBooking,
  type VendorPayment,
} from './vendorsApi';

interface RecordVendorPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: VendorPayment) => void;
  booking: VendorBooking;
}

export function RecordVendorPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  booking,
}: RecordVendorPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>('BANK_TRANSFER');
  const [paidBy, setPaidBy] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const balanceDueNum = parseFloat(booking.balanceDue) || 0;

  useEffect(() => {
    if (isOpen) {
      setAmount(balanceDueNum > 0 ? String(balanceDueNum) : '');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('BANK_TRANSFER');
      setPaidBy('');
      setReferenceNumber('');
      setNotes('');
      setErrorMessage(null);
    }
  }, [isOpen, booking, balanceDueNum]);

  if (!isOpen) return null;

  const enteredAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredAmount <= 0) {
      setErrorMessage('Payment installment amount must be greater than zero.');
      return;
    }
    if (enteredAmount > balanceDueNum) {
      setErrorMessage(
        `Payment amount of ${formatCurrencyINR(enteredAmount)} exceeds remaining balance due of ${formatCurrencyINR(
          balanceDueNum,
        )}.`,
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: RecordVendorPaymentPayload = {
      amount: String(enteredAmount),
      paymentDate,
      paymentMethod,
      paidBy: paidBy.trim() || null,
      referenceNumber: referenceNumber.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      const saved = await recordVendorPayment(booking.id, payload);
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#EAE6E1]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FAF8F5] border-b border-[#EAE6E1]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#556251] bg-[#556251]/10 px-2 py-0.5 rounded-full">
              Installment Settlement
            </span>
            <h2 className="text-xl font-serif text-[#2C2420] mt-1">Record Vendor Payment</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#7C6856] hover:text-[#2C2420] rounded-full hover:bg-[#EAE6E1] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 text-sm text-[#8D493A] bg-[#8D493A]/10 border border-[#8D493A]/20 rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Booking Overview Card */}
          <div className="p-3.5 bg-white rounded-xl border border-[#EAE6E1] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#7C6856]">Vendor & Agreement:</span>
              <strong className="text-[#2C2420]">{booking.vendorName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#7C6856]">Contracted Package:</span>
              <span className="text-[#2C2420]">{booking.serviceName}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#F2ECE4]">
              <span className="text-[#7C6856]">
                Agreed: <strong>{formatCurrencyINR(booking.agreedAmount)}</strong> | Cleared:{' '}
                <strong>{formatCurrencyINR(booking.paidAmount)}</strong>
              </span>
              <span className="text-[#8D493A] font-bold">
                Remaining: {formatCurrencyINR(booking.balanceDue)}
              </span>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">
                Installment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={balanceDueNum}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A] font-semibold text-[#2C2420]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
                required
              />
            </div>
          </div>

          {/* Method & Paid By */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Payment Channel</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodValue)}
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Paid By (Host / Member)</label>
              <input
                type="text"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                placeholder="e.g. Akshitha Rao"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Transaction Ref / UTR / Check #</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UPI-92849202"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Milestone Description</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 2nd advance for mandap CAD"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE6E1]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-[#7C6856] bg-white border border-[#DED7CE] rounded-xl hover:bg-[#F2ECE4] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || balanceDueNum <= 0}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#556251] rounded-xl hover:bg-[#43503f] transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

