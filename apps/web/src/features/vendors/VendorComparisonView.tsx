import { useState } from 'react';
import {
  formatCurrencyINR,
  VENDOR_CATEGORY_META,
  VENDOR_STATUS_META,
  type Vendor,
} from './vendorsApi';

interface VendorComparisonViewProps {
  vendors: Vendor[];
  onSelectVendorForProfile: (vendor: Vendor) => void;
  onOpenBookingModal: (vendor: Vendor) => void;
}

export function VendorComparisonView({
  vendors,
  onSelectVendorForProfile,
  onOpenBookingModal,
}: VendorComparisonViewProps) {
  // Pre-select first 3 vendors or any favorite vendors
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const favorites = vendors.filter((v) => v.isFavorite).map((v) => v.id);
    if (favorites.length >= 2) return favorites.slice(0, 4);
    return vendors.slice(0, 3).map((v) => v.id);
  });

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return; // Keep at least 1
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 4) {
        alert('You can compare up to 4 vendors simultaneously.');
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const comparedVendors = vendors.filter((v) => selectedIds.includes(v.id));

  return (
    <div className="space-y-6">
      {/* Header and Picker */}
      <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-sm space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider text-[#8d493a] bg-[#fbf5f0] border border-[#f2e1d5] uppercase mb-2">
            SIDE-BY-SIDE EVALUATION
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#1a1c18]">Compare Quotes & Production Deliverables</h2>
          <p className="text-xs text-[#70756a] mt-1">
            Select 2 to 4 vendor partners below to benchmark packages, ratings, pricing tiers, and assigned ceremonies.
          </p>
        </div>

        {/* Multi-select Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2">
          <span className="text-xs font-semibold text-[#5a5f54]">Select vendors ({selectedIds.length}/4):</span>
          {vendors.map((v) => {
            const isSelected = selectedIds.includes(v.id);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => toggleSelect(v.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${isSelected
                    ? 'bg-[#8d493a] text-white border-[#8d493a] shadow-sm'
                    : 'bg-[#fbfaf7] text-[#5c6156] border-[#d8d3c9] hover:bg-[#f2efe8]'
                  }`}
              >
                {isSelected ? '✓ ' : '+ '}
                {v.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Matrix Table */}
      {comparedVendors.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[#e8e4dc] text-center text-xs text-[#8c9185]">
          Please select at least 2 vendors from above to compare.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#faf8f4] border-b border-[#e8e4dc]">
                  <th className="py-4 px-5 text-[#70756a] font-semibold w-48 bg-[#faf8f4]">Evaluation Metric</th>
                  {comparedVendors.map((v) => (
                    <th key={v.id} className="py-4 px-5 font-serif font-bold text-base text-[#1a1c18] min-w-[220px]">
                      <div className="flex items-center justify-between">
                        <span>{v.name}</span>
                        {v.isFavorite && <span className="text-xs">❤️</span>}
                      </div>
                      <div className="text-xs font-sans font-normal text-[#8d493a] mt-0.5">
                        {VENDOR_CATEGORY_META[v.category]?.label}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f2ec]">
                {/* Status */}
                <tr>
                  <td className="py-3 px-5 font-semibold text-[#5a5f54] bg-[#fdfcf9]">Booking Status</td>
                  {comparedVendors.map((v) => {
                    const sm = VENDOR_STATUS_META[v.status];
                    return (
                      <td key={v.id} className="py-3 px-5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${sm.badge}`}>
                          {sm.label}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Rating & Tier */}
                <tr>
                  <td className="py-3 px-5 font-semibold text-[#5a5f54] bg-[#fdfcf9]">Rating & Tier</td>
                  {comparedVendors.map((v) => (
                    <td key={v.id} className="py-3 px-5">
                      <div className="font-bold text-[#a66e22] text-sm">
                        {v.rating ? `⭐ ${v.rating.toFixed(1)} / 5.0` : '—'}
                      </div>
                      <div className="text-[11px] font-semibold text-[#8d493a] mt-0.5">
                        Pricing Tier: {v.priceRange || 'Standard'}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Pricing / Rate Card */}
                <tr>
                  <td className="py-3 px-5 font-semibold text-[#5a5f54] bg-[#fdfcf9]">Rate Card / Notes</td>
                  {comparedVendors.map((v) => (
                    <td key={v.id} className="py-3 px-5 text-[#5e6358] leading-relaxed">
                      {v.pricing || 'Custom quote upon consultation'}
                    </td>
                  ))}
                </tr>

                {/* Total Agreed / Booked */}
                <tr>
                  <td className="py-3 px-5 font-semibold text-[#5a5f54] bg-[#fdfcf9]">Contract Value</td>
                  {comparedVendors.map((v) => (
                    <td key={v.id} className="py-3 px-5">
                      <div className="font-serif font-bold text-sm text-[#1a1c18]">
                        {formatCurrencyINR(v.totalAgreed)}
                      </div>
                      <div className="text-[11px] text-[#3b6e45] mt-0.5">
                        Paid: {formatCurrencyINR(v.totalPaid)}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Location & Studio */}
                <tr>
                  <td className="py-3 px-5 font-semibold text-[#5a5f54] bg-[#fdfcf9]">Location & Contact</td>
                  {comparedVendors.map((v) => (
                    <td key={v.id} className="py-3 px-5 text-[#5e6358]">
                      <div>{v.city ? `📍 ${v.city}` : '—'}</div>
                      <div className="mt-0.5">{v.phone ? `📞 ${v.phone}` : ''}</div>
                      <div className="mt-0.5">{v.contactName ? `Lead: ${v.contactName}` : ''}</div>
                    </td>
                  ))}
                </tr>

                {/* Covered Ceremonies */}
                <tr>
                  <td className="py-3 px-5 font-semibold text-[#5a5f54] bg-[#fdfcf9]">Mapped Ceremonies</td>
                  {comparedVendors.map((v) => (
                    <td key={v.id} className="py-3 px-5">
                      {v.events.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {v.events.map((e) => (
                            <span key={e.id} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f0eae1] text-[#745e48]">
                              {e.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#999f93]">Not yet assigned</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Services & Deliverables */}
                <tr>
                  <td className="py-3 px-5 font-semibold text-[#5a5f54] bg-[#fdfcf9]">Services Included</td>
                  {comparedVendors.map((v) => (
                    <td key={v.id} className="py-3 px-5">
                      {v.services.length > 0 ? (
                        <ul className="space-y-1 list-disc list-inside text-[#4a4f44]">
                          {v.services.map((s) => (
                            <li key={s.id}>
                              <strong>{s.name}</strong>
                              {s.price && ` (${formatCurrencyINR(s.price)})`}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-[#999f93]">No itemized packages</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr className="bg-[#faf8f4]">
                  <td className="py-4 px-5 font-semibold text-[#5a5f54] bg-[#faf8f4]">Decision Actions</td>
                  {comparedVendors.map((v) => (
                    <td key={v.id} className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenBookingModal(v)}
                          className="px-3 py-1.5 rounded-lg bg-[#8d493a] text-white text-xs font-semibold hover:bg-[#72392c] transition-colors"
                        >
                          Book Vendor
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectVendorForProfile(v)}
                          className="px-3 py-1.5 rounded-lg border border-[#d8d3c9] bg-white text-xs font-semibold text-[#484a44] hover:bg-[#f5f2ec] transition-colors"
                        >
                          View Profile
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
