import { useState, type FormEvent } from 'react';
import {
  formatCurrencyINR,
  formatShortDate,
  createVendorService,
  deleteVendorService,
  toggleFavoriteVendor,
  deleteVendor,
  VENDOR_CATEGORY_META,
  VENDOR_STATUS_META,
  type Vendor,
  type VendorBooking,
  type VendorPayment,
} from './vendorsApi';

interface VendorProfileDeepDiveViewProps {
  vendor: Vendor;
  allVendors: Vendor[];
  bookings: VendorBooking[];
  payments: VendorPayment[];
  onSelectVendor: (vendor: Vendor) => void;
  onOpenEditVendor: (vendor: Vendor) => void;
  onOpenBookingModal: (vendor: Vendor) => void;
  onOpenPaymentModal: (booking: VendorBooking) => void;
  onRefresh: () => void;
  onBackToDirectory: () => void;
}

export function VendorProfileDeepDiveView({
  vendor,
  allVendors,
  bookings,
  payments,
  onSelectVendor,
  onOpenEditVendor,
  onOpenBookingModal,
  onOpenPaymentModal,
  onRefresh,
  onBackToDirectory,
}: VendorProfileDeepDiveViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'payments' | 'notes'>('overview');
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  const vendorBookings = bookings.filter((b) => b.vendorId === vendor.id);
  const vendorPayments = payments.filter((p) => p.vendorId === vendor.id);
  const catMeta = VENDOR_CATEGORY_META[vendor.category];
  const statusMeta = VENDOR_STATUS_META[vendor.status];

  const handleToggleFavorite = async () => {
    await toggleFavoriteVendor(vendor.id);
    onRefresh();
  };

  const handleDeleteVendor = async () => {
    if (!window.confirm(`Are you sure you want to delete ${vendor.name}?`)) return;
    await deleteVendor(vendor.id);
    onBackToDirectory();
  };

  const handleCreateService = async (e: FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    try {
      setIsSubmittingService(true);
      await createVendorService(vendor.id, {
        name: newServiceName.trim(),
        price: newServicePrice.trim() || undefined,
        description: newServiceDescription.trim() || undefined,
        isIncluded: true,
      });
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceDescription('');
      setShowAddService(false);
      onRefresh();
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      setDeletingServiceId(serviceId);
      await deleteVendorService(vendor.id, serviceId);
      onRefresh();
    } finally {
      setDeletingServiceId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#e8e4dc] shadow-sm">
        <button
          type="button"
          onClick={onBackToDirectory}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8d493a] hover:underline"
        >
          <span>&larr;</span> Back to Directory
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#7c8075]">Switch Vendor:</span>
          <select
            value={vendor.id}
            onChange={(e) => {
              const selected = allVendors.find((v) => v.id === e.target.value);
              if (selected) onSelectVendor(selected);
            }}
            className="px-3 py-1.5 rounded-xl border border-[#d8d3c9] bg-[#fbfaf7] text-xs font-medium text-[#1a1c18] focus:outline-none focus:ring-2 focus:ring-[#8d493a]/30"
          >
            {allVendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({VENDOR_CATEGORY_META[v.category]?.label})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Vendor Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#f4f2ec]">
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm shrink-0 ${catMeta.bg}`}
            >
              {catMeta.icon}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-serif font-bold text-[#1a1c18]">{vendor.name}</h1>
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className="text-lg hover:scale-110 transition-transform"
                  title="Toggle shortlist"
                >
                  {vendor.isFavorite ? '❤️' : '🤍'}
                </button>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusMeta.badge}`}>
                  {statusMeta.label}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#6e7467] flex-wrap">
                <span className="font-semibold text-[#8d493a]">{catMeta.label}</span>
                {vendor.contactName && <span>• Contact: <strong className="text-[#2d3129]">{vendor.contactName}</strong></span>}
                {vendor.city && <span>• 📍 {vendor.city}{vendor.state ? `, ${vendor.state}` : ''}</span>}
                {vendor.rating && (
                  <span className="font-bold text-[#a66e22]">• ⭐ {vendor.rating.toFixed(1)}</span>
                )}
                {vendor.priceRange && (
                  <span className="font-semibold text-[#8d493a]">• Tier: {vendor.priceRange}</span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-[#7c8075] pt-1 flex-wrap">
                {vendor.phone && (
                  <a href={`tel:${vendor.phone}`} className="hover:text-[#8d493a] underline">
                    📞 {vendor.phone}
                  </a>
                )}
                {vendor.email && (
                  <a href={`mailto:${vendor.email}`} className="hover:text-[#8d493a] underline">
                    ✉️ {vendor.email}
                  </a>
                )}
                {vendor.website && (
                  <a
                    href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#8d493a] underline"
                  >
                    🌐 Visit Website &rarr;
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenBookingModal(vendor)}
              className="px-4 py-2 rounded-xl bg-[#8d493a] text-xs font-semibold text-white hover:bg-[#72392c] transition-colors shadow-sm"
            >
              + Add Ceremony Booking
            </button>
            <button
              type="button"
              onClick={() => onOpenEditVendor(vendor)}
              className="px-3.5 py-2 rounded-xl border border-[#d8d3c9] bg-[#fbfaf7] text-xs font-semibold text-[#484a44] hover:bg-[#f2efe8] transition-colors"
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={handleDeleteVendor}
              className="px-3 py-2 rounded-xl border border-[#f5c6cb] bg-[#feeceb] text-xs font-semibold text-[#c0392b] hover:bg-[#f8d7da] transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Financial Metrics Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#fbfaf6] border border-[#ebe7df]">
          <div>
            <div className="text-[11px] text-[#7d8276] font-semibold uppercase tracking-wider">Total Contracted</div>
            <div className="text-xl font-serif font-bold text-[#1a1c18] mt-1">{formatCurrencyINR(vendor.totalAgreed)}</div>
            <div className="text-[10px] text-[#8c9185] mt-0.5">{vendor.bookingsCount} bookings mapped</div>
          </div>
          <div>
            <div className="text-[11px] text-[#7d8276] font-semibold uppercase tracking-wider">Amount Cleared</div>
            <div className="text-xl font-serif font-bold text-[#3b6e45] mt-1">{formatCurrencyINR(vendor.totalPaid)}</div>
            <div className="text-[10px] text-[#8c9185] mt-0.5">Advances & settlements</div>
          </div>
          <div>
            <div className="text-[11px] text-[#7d8276] font-semibold uppercase tracking-wider">Outstanding Balance</div>
            <div className="text-xl font-serif font-bold text-[#b84e38] mt-1">{formatCurrencyINR(vendor.balanceDue)}</div>
            <div className="text-[10px] text-[#8c9185] mt-0.5">Pending milestone release</div>
          </div>
          <div>
            <div className="text-[11px] text-[#7d8276] font-semibold uppercase tracking-wider">Mapped Ceremonies</div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {vendor.events.length > 0 ? (
                vendor.events.map((e) => (
                  <span key={e.id} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f0eae1] text-[#745e48]">
                    {e.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#8c9185]">None assigned</span>
              )}
            </div>
          </div>
        </div>

        {/* Deep Dive Sub-Tabs */}
        <div className="border-b border-[#e8e4dc] flex items-center gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-[#8d493a] text-[#8d493a]'
                : 'border-transparent text-[#70756a] hover:text-[#1a1c18]'
            }`}
          >
            Overview & Packages ({vendor.services.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'bookings'
                ? 'border-[#8d493a] text-[#8d493a]'
                : 'border-transparent text-[#70756a] hover:text-[#1a1c18]'
            }`}
          >
            Bookings & Contracts ({vendorBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'payments'
                ? 'border-[#8d493a] text-[#8d493a]'
                : 'border-transparent text-[#70756a] hover:text-[#1a1c18]'
            }`}
          >
            Payment History ({vendorPayments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'notes'
                ? 'border-[#8d493a] text-[#8d493a]'
                : 'border-transparent text-[#70756a] hover:text-[#1a1c18]'
            }`}
          >
            Team Notes & Riders
          </button>
        </div>

        {/* Tab 1: Overview & Services */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description & Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-[#ebe7df] bg-[#fbfaf6]">
                <h4 className="font-semibold text-[#1a1c18] mb-1">About the Partner</h4>
                <p className="text-[#64695d] leading-relaxed">
                  {vendor.description || 'No detailed background provided for this vendor.'}
                </p>
                {vendor.pricing && (
                  <div className="mt-3 pt-2 border-t border-[#ede9e1] text-[#70756a]">
                    <strong className="text-[#2d3129]">Rate Card Notes:</strong> {vendor.pricing}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-[#ebe7df] bg-[#fbfaf6]">
                <h4 className="font-semibold text-[#1a1c18] mb-1">Office & Studio Address</h4>
                <p className="text-[#64695d] leading-relaxed">
                  {vendor.address || 'Address not listed.'}
                  {vendor.city && ` ${vendor.city}`}
                  {vendor.state && `, ${vendor.state}`}
                </p>
              </div>
            </div>

            {/* Packages Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-serif font-bold text-[#1a1c18]">Contracted Services & Packages</h3>
                <button
                  type="button"
                  onClick={() => setShowAddService(!showAddService)}
                  className="text-xs font-semibold text-[#8d493a] hover:underline"
                >
                  {showAddService ? 'Cancel' : '+ Add Service / Package'}
                </button>
              </div>

              {/* Add Service Inline Form */}
              {showAddService && (
                <form
                  onSubmit={handleCreateService}
                  className="p-4 mb-4 rounded-xl border border-[#d6cfc2] bg-[#fdfcf9] space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#484a44] mb-1">Package Name *</label>
                      <input
                        type="text"
                        required
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="e.g. Full Day Cinematic Film & 200 Edited Stills"
                        className="w-full px-3 py-2 rounded-lg border border-[#d8d3c9] text-xs focus:outline-none focus:ring-1 focus:ring-[#8d493a]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#484a44] mb-1">Price / Cost (₹)</label>
                      <input
                        type="text"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        placeholder="e.g. 250000"
                        className="w-full px-3 py-2 rounded-lg border border-[#d8d3c9] text-xs focus:outline-none focus:ring-1 focus:ring-[#8d493a]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#484a44] mb-1">Deliverables & Scope</label>
                    <input
                      type="text"
                      value={newServiceDescription}
                      onChange={(e) => setNewServiceDescription(e.target.value)}
                      placeholder="e.g. Drone pilot included, 3 candid shooters, delivery within 4 weeks"
                      className="w-full px-3 py-2 rounded-lg border border-[#d8d3c9] text-xs focus:outline-none focus:ring-1 focus:ring-[#8d493a]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddService(false)}
                      className="px-3 py-1.5 rounded-lg border border-[#d8d3c9] text-xs font-semibold text-[#5a5f54]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingService}
                      className="px-4 py-1.5 rounded-lg bg-[#8d493a] text-xs font-semibold text-white hover:bg-[#72392c]"
                    >
                      {isSubmittingService ? 'Saving...' : 'Save Package'}
                    </button>
                  </div>
                </form>
              )}

              {/* Service List */}
              {vendor.services.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8c9185] bg-[#fbfaf6] rounded-xl border border-[#ebe7df]">
                  No specific packages listed yet. Click "+ Add Service / Package" to define deliverables.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vendor.services.map((svc) => (
                    <div
                      key={svc.id}
                      className="p-4 rounded-xl border border-[#ebe7df] bg-[#fbfaf6] flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-xs text-[#1a1c18]">{svc.name}</div>
                        {svc.price && (
                          <div className="text-xs font-serif font-bold text-[#8d493a] mt-0.5">
                            {formatCurrencyINR(svc.price)}
                          </div>
                        )}
                        {svc.description && (
                          <div className="text-[11px] text-[#6e7368] mt-1 leading-snug">{svc.description}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(svc.id)}
                        disabled={deletingServiceId === svc.id}
                        className="text-[11px] text-[#c0392b] hover:underline shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Bookings & Contracts */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-[#1a1c18]">Active Ceremony Bookings</h3>
              <button
                type="button"
                onClick={() => onOpenBookingModal(vendor)}
                className="text-xs font-semibold text-[#8d493a] hover:underline"
              >
                + New Ceremony Booking
              </button>
            </div>

            {vendorBookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8c9185] bg-[#fbfaf6] rounded-xl border border-[#ebe7df]">
                No ceremony bookings linked yet. Click "+ Add Ceremony Booking" to link an event and deposit.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#ebe7df]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf8f4] border-b border-[#ebe7df] text-[#6b7064] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Ceremony</th>
                      <th className="py-3 px-4">Service Details</th>
                      <th className="py-3 px-4 text-right">Agreed</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                      <th className="py-3 px-4 text-right">Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4f2ec]">
                    {vendorBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#faf9f6]">
                        <td className="py-3.5 px-4 font-semibold text-[#1a1c18]">
                          {b.eventName || 'General Wedding'}
                        </td>
                        <td className="py-3.5 px-4 text-[#5e6358]">
                          <div className="font-medium">{b.serviceName}</div>
                          {b.contractRef && (
                            <div className="text-[10px] text-[#8c9185]">Ref: {b.contractRef}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-[#1a1c18]">
                          {formatCurrencyINR(b.agreedAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-[#3b6e45]">
                          {formatCurrencyINR(b.paidAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-[#b84e38]">
                          {formatCurrencyINR(b.balanceDue)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e7f2e8] text-[#2e6438]">
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onOpenPaymentModal(b)}
                            className="text-xs font-semibold text-[#8d493a] hover:underline"
                          >
                            + Record Payment
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payment History */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <h3 className="text-sm font-serif font-bold text-[#1a1c18]">Payment Transactions</h3>
            {vendorPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8c9185] bg-[#fbfaf6] rounded-xl border border-[#ebe7df]">
                No payment transactions recorded for this vendor.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#ebe7df]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf8f4] border-b border-[#ebe7df] text-[#6b7064] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Paid By</th>
                      <th className="py-3 px-4">Ref Number</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4f2ec]">
                    {vendorPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#faf9f6]">
                        <td className="py-3 px-4 text-[#2d3129]">{formatShortDate(p.paymentDate)}</td>
                        <td className="py-3 px-4 font-medium text-[#484a44]">{p.paymentMethod}</td>
                        <td className="py-3 px-4 text-right font-serif font-bold text-[#3b6e45]">
                          {formatCurrencyINR(p.amount)}
                        </td>
                        <td className="py-3 px-4 text-[#6e7368]">{p.paidBy || '—'}</td>
                        <td className="py-3 px-4 text-[11px] text-[#8c9185] font-mono">
                          {p.referenceNumber || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#e7f2e8] text-[#2e6438]">
                            {p.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Team Notes */}
        {activeTab === 'notes' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-[#ebe7df] bg-[#fbfaf6] space-y-2">
              <h4 className="font-semibold text-[#1a1c18]">Organizer & Internal Production Notes</h4>
              <p className="text-[#64695d] leading-relaxed">
                {vendor.notes || 'No internal team notes recorded. Click "Edit Profile" to add setup riders or special arrangements.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
