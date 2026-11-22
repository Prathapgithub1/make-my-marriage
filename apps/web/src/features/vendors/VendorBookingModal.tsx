import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createVendorBooking,
  formatCurrencyINR,
  PAYMENT_METHODS,
  VENDOR_STATUSES,
  VENDOR_STATUS_META,
  type CreateBookingPayload,
  type PaymentMethodValue,
  type Vendor,
  type VendorBooking,
  type VendorStatusValue,
} from './vendorsApi';
import { getEvents } from '../events/eventsApi';

interface VendorBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: VendorBooking) => void;
  vendor: Vendor;
}

export function VendorBookingModal({
  isOpen,
  onClose,
  onSuccess,
  vendor,
}: VendorBookingModalProps) {
  const [serviceName, setServiceName] = useState('');
  const [eventId, setEventId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [serviceDate, setServiceDate] = useState('');
  const [status, setStatus] = useState<VendorStatusValue>('CONFIRMED');
  const [agreedAmount, setAgreedAmount] = useState('');
  const [advancePayment, setAdvancePayment] = useState('0');
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState<PaymentMethodValue>('BANK_TRANSFER');
  const [contractUrl, setContractUrl] = useState('');
  const [contractRef, setContractRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch wedding events
  const { data: eventsData } = useQuery({
    queryKey: ['events'],
    queryFn: () => getEvents({ limit: 50 }),
    enabled: isOpen,
  });

  const weddingEvents = eventsData?.events || [];

  useEffect(() => {
    if (isOpen) {
      setServiceName('');
      setEventId(vendor.events[0]?.id || '');
      setBookingDate(new Date().toISOString().slice(0, 10));
      setServiceDate('');
      setStatus('CONFIRMED');
      setAgreedAmount('');
      setAdvancePayment('0');
      setAdvancePaymentMethod('BANK_TRANSFER');
      setContractUrl('');
      setContractRef('');
      setNotes('');
      setErrorMessage(null);
    }
  }, [isOpen, vendor]);

  if (!isOpen) return null;

  const agreedNum = parseFloat(agreedAmount) || 0;
  const advanceNum = parseFloat(advancePayment) || 0;
  const balanceDue = Math.max(0, agreedNum - advanceNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      setErrorMessage('Service or package name is required.');
      return;
    }
    if (agreedNum <= 0) {
      setErrorMessage('Agreed booking amount must be greater than zero.');
      return;
    }
    if (advanceNum < 0 || advanceNum > agreedNum) {
      setErrorMessage('Advance deposit must be between ₹0 and the agreed booking cost.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: CreateBookingPayload = {
      serviceName: serviceName.trim(),
      eventId: eventId ? eventId : null,
      bookingDate: bookingDate || null,
      serviceDate: serviceDate || null,
      status,
      agreedAmount: String(agreedNum),
      advancePayment: String(advanceNum),
      advancePaymentMethod,
      contractUrl: contractUrl.trim() || null,
      contractRef: contractRef.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      const saved = await createVendorBooking(vendor.id, payload);
      onSuccess(saved);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#EAE6E1]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#EAE6E1]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8D493A] bg-[#8D493A]/10 px-2 py-0.5 rounded-full">
              Contract & Booking Agreement
            </span>
            <h2 className="text-xl font-serif text-[#2C2420] mt-1">Book {vendor.name}</h2>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 text-sm text-[#8D493A] bg-[#8D493A]/10 border border-[#8D493A]/20 rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Sync Notice */}
          <div className="flex items-center gap-2 p-3 text-xs text-[#556251] bg-[#556251]/10 rounded-xl border border-[#556251]/20">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              This booking and advance payment will automatically synchronize with your master{' '}
              <strong>Expenses & Ceremony Budgets</strong>.
            </span>
          </div>

          {/* Service & Ceremony */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">
                Service / Package Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Sangeet Stage & Rigging"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Associated Ceremony</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              >
                <option value="">General / All Ceremonies</option>
                {weddingEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Booking Date</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Service Execution Date</label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Booking Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatusValue)}
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              >
                {VENDOR_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {VENDOR_STATUS_META[st]?.label || st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Amounts with Live Balance Calculation */}
          <div className="p-4 bg-white rounded-xl border border-[#EAE6E1] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C6856]">
              Financial Terms & Retainer
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#544B45] mb-1">
                  Agreed Total Cost (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={agreedAmount}
                  onChange={(e) => setAgreedAmount(e.target.value)}
                  placeholder="e.g. 250000"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A] font-semibold text-[#2C2420]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#544B45] mb-1">Advance Deposit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A] font-semibold text-[#2C2420]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#544B45] mb-1">Advance Payment Method</label>
                <select
                  value={advancePaymentMethod}
                  onChange={(e) => setAdvancePaymentMethod(e.target.value as PaymentMethodValue)}
                  disabled={advanceNum <= 0}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A] disabled:opacity-50"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Balance Summary */}
            <div className="flex items-center justify-between pt-2 border-t border-[#F2ECE4] text-xs">
              <span className="text-[#7C6856]">
                Advance Cleared: <strong>{formatCurrencyINR(advanceNum)}</strong>
              </span>
              <span className="text-[#8D493A] font-bold text-sm">
                Remaining Balance Due: {formatCurrencyINR(balanceDue)}
              </span>
            </div>
          </div>

          {/* Contract Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Signed Contract PDF / Cloud Link</label>
              <input
                type="url"
                value={contractUrl}
                onChange={(e) => setContractUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#544B45] mb-1">Contract / Invoice Ref Number</label>
              <input
                type="text"
                value={contractRef}
                onChange={(e) => setContractRef(e.target.value)}
                placeholder="e.g. AGR-2026-089"
                className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#544B45] mb-1">Booking Notes & Payment Schedule Terms</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. 50% advance, 40% stage setup day, 10% after event wrap..."
              className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-[#DED7CE] focus:outline-none focus:ring-2 focus:ring-[#8D493A]/30 focus:border-[#8D493A]"
            />
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
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#8D493A] rounded-xl hover:bg-[#783D30] transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Confirm & Save Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

