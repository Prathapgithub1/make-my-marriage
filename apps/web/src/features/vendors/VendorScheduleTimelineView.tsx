import { useState } from 'react';
import {
  formatCurrencyINR,
  VENDOR_CATEGORY_META,
  type Vendor,
  type VendorCategoryValue,
} from './vendorsApi';

interface CalendarMilestone {
  id: string;
  type: 'SERVICE' | 'BOOKING' | 'PAYMENT_DUE';
  date: string;
  vendorId: string;
  vendorName: string;
  category: VendorCategoryValue;
  title: string;
  amount: string | null;
  status: string;
  ceremonyName: string | null;
}

interface VendorScheduleTimelineViewProps {
  timeline: CalendarMilestone[];
  vendors: Vendor[];
  onSelectVendorForProfile: (vendor: Vendor) => void;
}

export function VendorScheduleTimelineView({
  timeline,
  vendors,
  onSelectVendorForProfile,
}: VendorScheduleTimelineViewProps) {
  const [selectedType, setSelectedType] = useState<'ALL' | 'SERVICE' | 'PAYMENT_DUE'>('ALL');
  const [selectedCeremony, setSelectedCeremony] = useState('');

  // Extract unique ceremonies from timeline
  const ceremonies = Array.from(
    new Set(timeline.map((item) => item.ceremonyName).filter(Boolean)),
  ) as string[];

  const filteredTimeline = timeline.filter((item) => {
    if (selectedType !== 'ALL' && item.type !== selectedType) return false;
    if (selectedCeremony && item.ceremonyName !== selectedCeremony) return false;
    return true;
  });

  // Conflict detection: find dates with more than 2 major service setups
  const dateCounts: Record<string, number> = {};
  timeline.forEach((item) => {
    if (item.type === 'SERVICE') {
      const d = item.date.slice(0, 10);
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    }
  });

  const conflictDates = Object.keys(dateCounts).filter((d) => dateCounts[d] >= 3);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider text-[#8d493a] bg-[#fbf5f0] border border-[#f2e1d5] uppercase mb-2">
              DAY-OF PRODUCTION CALENDAR
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#1a1c18]">Production Schedule & Milestones</h2>
            <p className="text-xs text-[#70756a] mt-1">
              Synchronize vendor arrival windows, mandap stage rigging, soundchecks, and payment releases across all ceremony dates.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter by Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'ALL' | 'SERVICE' | 'PAYMENT_DUE')}
              className="px-3 py-2 rounded-xl border border-[#d8d3c9] bg-[#fbfaf7] text-xs font-medium text-[#1a1c18] focus:outline-none"
            >
              <option value="ALL">All Milestones</option>
              <option value="SERVICE">Service & Setup Dates</option>
              <option value="PAYMENT_DUE">Payment Milestones</option>
            </select>

            {/* Filter by Ceremony */}
            {ceremonies.length > 0 && (
              <select
                value={selectedCeremony}
                onChange={(e) => setSelectedCeremony(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#d8d3c9] bg-[#fbfaf7] text-xs font-medium text-[#1a1c18] focus:outline-none"
              >
                <option value="">All Ceremonies</option>
                {ceremonies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Conflict Detection Banner */}
        {conflictDates.length > 0 && (
          <div className="p-3.5 rounded-xl border border-[#f5c6cb] bg-[#feeceb] flex items-center gap-3 text-xs text-[#c0392b]">
            <span className="text-base shrink-0">⚠️</span>
            <span>
              <strong>Potential High Density Coordination:</strong> {conflictDates.length} celebration day(s) have 3 or more concurrent vendor arrivals. Review load-in times to prevent sound & decor staging bottlenecks.
            </span>
          </div>
        )}
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-2xl border border-[#e8e4dc] p-6 shadow-sm">
        {filteredTimeline.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8c9185]">
            <div className="text-2xl mb-2">📅</div>
            No scheduled service dates or vendor milestones found. Book vendors with specific dates to populate the schedule.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#ebe7df]">
            {filteredTimeline.map((item) => {
              const vendor = vendors.find((v) => v.id === item.vendorId);
              const catMeta = VENDOR_CATEGORY_META[item.category];
              const dateObj = new Date(item.date);
              const month = !Number.isNaN(dateObj.getTime())
                ? dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                : 'DATE';
              const day = !Number.isNaN(dateObj.getTime()) ? dateObj.getDate() : '--';
              const year = !Number.isNaN(dateObj.getTime()) ? dateObj.getFullYear() : '';

              const isService = item.type === 'SERVICE';

              return (
                <div key={item.id} className="relative flex items-start gap-4 group">
                  {/* Timeline Bullet Node */}
                  <div
                    className={`absolute -left-6 top-3 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] ${isService ? 'bg-[#8d493a] text-white' : 'bg-[#a66e22] text-white'
                      }`}
                  >
                    {isService ? '✓' : '₹'}
                  </div>

                  {/* Date Card */}
                  <div className="w-16 h-16 rounded-2xl bg-[#faf8f4] border border-[#ebe7df] flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-[10px] font-bold text-[#8d493a] tracking-wider">{month}</span>
                    <span className="text-xl font-bold font-serif text-[#1a1c18] leading-none">{day}</span>
                    <span className="text-[9px] text-[#8c9185]">{year}</span>
                  </div>

                  {/* Milestone Content Card */}
                  <div className="flex-1 p-4 rounded-2xl border border-[#ebe7df] bg-[#fdfcf9] hover:bg-white hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${catMeta.bg} ${catMeta.text}`}
                        >
                          <span>{catMeta.icon}</span>
                          <span>{catMeta.label}</span>
                        </span>

                        <h4 className="font-serif font-bold text-sm text-[#1a1c18]">{item.title}</h4>

                        {item.ceremonyName && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#f0eae1] text-[#745e48]">
                            🎉 {item.ceremonyName}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#6e7368]">
                        Vendor Partner: <strong className="text-[#2d3129]">{item.vendorName}</strong>
                        {item.amount && (
                          <span className="ml-2 font-semibold text-[#8d493a]">
                            • Amount: {formatCurrencyINR(item.amount)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#e7f2e8] text-[#2e6438]">
                        {item.status}
                      </span>

                      {vendor && (
                        <button
                          type="button"
                          onClick={() => onSelectVendorForProfile(vendor)}
                          className="px-3 py-1 rounded-xl border border-[#d8d3c9] bg-white text-xs font-semibold text-[#484a44] hover:bg-[#f2efe8] transition-colors"
                        >
                          Profile &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
