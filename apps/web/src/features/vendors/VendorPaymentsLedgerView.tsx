import { useState } from 'react';
import {
  formatCurrencyINR,
  formatShortDate,
  PAYMENT_METHODS,
  VENDOR_CATEGORY_META,
  type PaymentMethodValue,
  type Vendor,
  type VendorBooking,
  type VendorPayment,
} from './vendorsApi';

interface VendorPaymentsLedgerViewProps {
  payments: VendorPayment[];
  bookings: VendorBooking[];
  vendors: Vendor[];
  onOpenRecordPayment: (booking: VendorBooking) => void;
}

export function VendorPaymentsLedgerView({
  payments,
  bookings,
  vendors,
  onOpenRecordPayment,
}: VendorPaymentsLedgerViewProps) {
  const [search, setSearch] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodValue | ''>('');
  const [selectedBookingForNewPayment, setSelectedBookingForNewPayment] = useState<string>('');

  // Calculate master totals
  let totalContractedPaise = 0;
  let totalPaidPaise = 0;

  bookings.forEach((b) => {
    totalContractedPaise += Math.round((parseFloat(b.agreedAmount) || 0) * 100);
  });

  payments.forEach((p) => {
    totalPaidPaise += Math.round((parseFloat(p.amount) || 0) * 100);
  });

  const totalContracted = (totalContractedPaise / 100).toFixed(2);
  const totalPaid = (totalPaidPaise / 100).toFixed(2);
  const totalBalance = Math.max(0, (totalContractedPaise - totalPaidPaise) / 100).toFixed(2);
  const paidPercent =
    totalContractedPaise > 0
      ? Math.min(100, Math.round((totalPaidPaise / totalContractedPaise) * 100))
      : 0;

  const filteredPayments = payments.filter((p) => {
    if (selectedVendorId && p.vendorId !== selectedVendorId) return false;
    if (selectedMethod && p.paymentMethod !== selectedMethod) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchVendor = p.vendorName?.toLowerCase().includes(q) ?? false;
      const matchPaidBy = p.paidBy?.toLowerCase().includes(q) ?? false;
      const matchRef = p.referenceNumber?.toLowerCase().includes(q) ?? false;
      if (!matchVendor && !matchPaidBy && !matchRef) return false;
    }
    return true;
  });

  const handleStartPayment = () => {
    if (!selectedBookingForNewPayment) {
      if (bookings.length > 0) {
        onOpenRecordPayment(bookings[0]);
      }
      return;
    }
    const found = bookings.find((b) => b.id === selectedBookingForNewPayment);
    if (found) onOpenRecordPayment(found);
  };

  return (
    <div className="space-y-6">
      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm">
          <div className="text-xs text-[#7c8075] font-medium">Total Contract Value</div>
          <div className="text-2xl font-serif font-bold text-[#1a1c18] mt-1">
            {formatCurrencyINR(totalContracted)}
          </div>
          <div className="text-[11px] text-[#8c9185] mt-1">{bookings.length} active bookings</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm">
          <div className="text-xs text-[#7c8075] font-medium">Total Disbursed</div>
          <div className="text-2xl font-serif font-bold text-[#3b6e45] mt-1">
            {formatCurrencyINR(totalPaid)}
          </div>
          <div className="text-[11px] text-[#2e6438] mt-1 font-semibold">{paidPercent}% of pool cleared</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm">
          <div className="text-xs text-[#7c8075] font-medium">Reserved Balance</div>
          <div className="text-2xl font-serif font-bold text-[#b84e38] mt-1">
            {formatCurrencyINR(totalBalance)}
          </div>
          <div className="text-[11px] text-[#8c9185] mt-1">Held in milestone escrow</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm">
          <div className="text-xs text-[#7c8075] font-medium">Transactions Recorded</div>
          <div className="text-2xl font-serif font-bold text-[#1a1c18] mt-1">{payments.length}</div>
          <div className="text-[11px] text-[#8c9185] mt-1">Audit verified transactions</div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <svg
              className="w-4 h-4 text-[#8c9185] absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by vendor, payer, or ref number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d8d3c9] bg-[#fbfaf7] text-xs text-[#1a1c18] focus:outline-none focus:ring-2 focus:ring-[#8d493a]/30"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Vendor Filter */}
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-[#d8d3c9] bg-[#fbfaf7] text-xs font-medium text-[#1a1c18] focus:outline-none"
            >
              <option value="">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            {/* Payment Method Filter */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod((e.target.value as PaymentMethodValue) || '')}
              className="px-3 py-2.5 rounded-xl border border-[#d8d3c9] bg-[#fbfaf7] text-xs font-medium text-[#1a1c18] focus:outline-none"
            >
              <option value="">All Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replace('_', ' ')}
                </option>
              ))}
            </select>

            {/* Booking Selector + Record Payment Button */}
            {bookings.length > 0 && (
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedBookingForNewPayment}
                  onChange={(e) => setSelectedBookingForNewPayment(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-[#d8d3c9] bg-[#fbfaf7] text-xs font-medium text-[#1a1c18] max-w-[180px] truncate focus:outline-none"
                >
                  <option value="">Select Booking...</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.vendorName} ({b.serviceName})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleStartPayment}
                  className="px-4 py-2.5 rounded-xl bg-[#8d493a] text-xs font-semibold text-white hover:bg-[#72392c] transition-colors shadow-sm shrink-0"
                >
                  + Record Payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8c9185]">
            <div className="text-2xl mb-2">🧾</div>
            No payment transactions match the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf8f4] border-b border-[#e8e4dc] text-[#6b7064] font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Vendor Partner</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Disbursed By</th>
                  <th className="py-3 px-4">Reference No.</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f2ec]">
                {filteredPayments.map((p) => {
                  const vendorObj = vendors.find((v) => v.id === p.vendorId);
                  const catMeta = vendorObj ? VENDOR_CATEGORY_META[vendorObj.category] : null;

                  return (
                    <tr key={p.id} className="hover:bg-[#faf9f6] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-[#1a1c18]">
                        {formatShortDate(p.paymentDate)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1a1c18]">{p.vendorName}</td>
                      <td className="py-3.5 px-4">
                        {catMeta ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${catMeta.bg} ${catMeta.text}`}
                          >
                            <span>{catMeta.icon}</span>
                            <span>{catMeta.label}</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#484a44] font-medium">{p.paymentMethod}</td>
                      <td className="py-3.5 px-4 text-right font-serif font-bold text-[#3b6e45] text-sm">
                        {formatCurrencyINR(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-[#6e7368]">{p.paidBy || 'Wedding Host'}</td>
                      <td className="py-3.5 px-4 text-[11px] font-mono text-[#8c9185]">
                        {p.referenceNumber || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e7f2e8] text-[#2e6438]">
                          {p.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
