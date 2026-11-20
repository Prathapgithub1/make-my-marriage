import {
  formatCurrencyINR,
  formatShortDate,
  type VendorCategoryValue,
  type VendorDashboardAnalytics,
} from './vendorsApi';

interface VendorDashboardViewProps {
  data: VendorDashboardAnalytics;
  onNavigateTab: (tabId: string, filterCategory?: VendorCategoryValue) => void;
  onOpenAddVendor: () => void;
}

export function VendorDashboardView({
  data,
  onNavigateTab,
  onOpenAddVendor,
}: VendorDashboardViewProps) {
  const kpis = data?.kpis ?? {
    totalVendors: 0,
    categoriesCount: 0,
    confirmedVendors: 0,
    confirmedPercentage: 0,
    shortlistedVendors: 0,
    negotiatingVendors: 0,
    pendingSignatures: 0,
    vendorBudgetCap: '0.00',
    totalAllocated: '0.00',
    totalAmountPaid: '0.00',
    paidPercentage: 0,
    remainingBalance: '0.00',
    upcoming14Days: '0.00',
  };
  const pipelineFunnel = data?.pipelineFunnel ?? [];
  const budgetByTier = data?.budgetByTier ?? [];
  const upcomingMilestones = data?.upcomingMilestones ?? [];
  const recentActivity = data?.recentActivity ?? [];

  const funnelColors = ['#8d493a', '#b07a50', '#d99f6b', '#4a6b53', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider text-[#8d493a] bg-[#fbf5f0] border border-[#f2e1d5] uppercase mb-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            VENDOR MANAGEMENT SUITE
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1a1c18] tracking-tight">
            Curated Wedding Partners & Production
          </h1>
          <p className="text-sm text-[#6c7263] mt-1 max-w-3xl">
            Track {kpis.totalVendors} vetted vendors across active ceremony phases for the royal celebration.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('comparison')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d6cfc2] bg-[#fbfaf6] text-xs font-semibold text-[#484a44] hover:bg-[#f2efe8] transition-colors"
          >
            <svg className="w-4 h-4 text-[#7a7c74]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Compare Quotes
          </button>
          <button
            type="button"
            onClick={onOpenAddVendor}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8d493a] text-xs font-semibold text-white hover:bg-[#72392c] shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            + Add New Vendor
          </button>
        </div>
      </div>

      {/* 8 KPI Cards (2 rows of 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Vendors */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7c8075] text-xs font-medium">
            <span>Total Vendors</span>
            <div className="w-7 h-7 rounded-lg bg-[#f5f2eb] flex items-center justify-center text-sm">
              🏬
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1a1c18]">{kpis.totalVendors}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#f0eae1] text-[#745e48]">
              {kpis.categoriesCount} Categories
            </span>
          </div>
          <div className="text-xs text-[#878d80] pt-2 border-t border-[#f4f2ec]">
            All major ceremonies mapped
          </div>
        </div>

        {/* Card 2: Active & Confirmed */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7c8075] text-xs font-medium">
            <span>Active & Confirmed</span>
            <div className="w-7 h-7 rounded-lg bg-[#ecf4ed] flex items-center justify-center text-sm text-[#3b6e45]">
              ✓
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1a1c18]">{kpis.confirmedVendors}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#e7f2e8] text-[#2e6438]">
              {kpis.confirmedPercentage}% finalized
            </span>
          </div>
          <div className="text-xs text-[#878d80] pt-2 border-t border-[#f4f2ec]">
            Agreements & deposits filed
          </div>
        </div>

        {/* Card 3: Shortlisted / Review */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7c8075] text-xs font-medium">
            <span>Shortlisted / Review</span>
            <div className="w-7 h-7 rounded-lg bg-[#f9f3ec] flex items-center justify-center text-sm">
              📋
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1a1c18]">{kpis.shortlistedVendors}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#fef5e7] text-[#a66e22]">
              {kpis.negotiatingVendors} negotiating
            </span>
          </div>
          <div className="text-xs text-[#878d80] pt-2 border-t border-[#f4f2ec]">
            Awaiting final tasting & sample
          </div>
        </div>

        {/* Card 4: Pending Signatures */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7c8075] text-xs font-medium">
            <span>Pending Signatures</span>
            <div className="w-7 h-7 rounded-lg bg-[#fdf0ee] flex items-center justify-center text-sm text-[#b84e38]">
              ✍️
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1a1c18]">{kpis.pendingSignatures}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#feeceb] text-[#c0392b]">
              Action required
            </span>
          </div>
          <div className="text-xs text-[#878d80] pt-2 border-t border-[#f4f2ec]">
            Catering & Sound contracts
          </div>
        </div>

        {/* Card 5: Vendor Budget Cap */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7c8075] text-xs font-medium">
            <span>Vendor Budget Cap</span>
            <div className="w-7 h-7 rounded-lg bg-[#f5f2eb] flex items-center justify-center text-sm">
              💳
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-serif font-bold text-[#1a1c18]">{formatCurrencyINR(kpis.vendorBudgetCap)}</div>
            <div className="w-full bg-[#f0eae1] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#8d493a] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (parseFloat(kpis.totalAllocated) / (parseFloat(kpis.vendorBudgetCap) || 1)) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>
          <div className="text-xs text-[#878d80] pt-2 border-t border-[#f4f2ec]">
            {formatCurrencyINR(kpis.totalAllocated)} allocated so far
          </div>
        </div>

        {/* Card 6: Total Amount Paid */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7c8075] text-xs font-medium">
            <span>Total Amount Paid</span>
            <div className="w-7 h-7 rounded-lg bg-[#ecf4ed] flex items-center justify-center text-sm text-[#3b6e45]">
              ₹
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-[#1a1c18]">{formatCurrencyINR(kpis.totalAmountPaid)}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#e7f2e8] text-[#2e6438]">
              {kpis.paidPercentage}%
            </span>
          </div>
          <div className="text-xs text-[#878d80] pt-2 border-t border-[#f4f2ec]">
            Cleared advances & booking slots
          </div>
        </div>

        {/* Card 7: Remaining Balance */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7c8075] text-xs font-medium">
            <span>Remaining Balance</span>
            <div className="w-7 h-7 rounded-lg bg-[#f5f2eb] flex items-center justify-center text-sm">
              🧾
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-serif font-bold text-[#1a1c18]">{formatCurrencyINR(kpis.remainingBalance)}</span>
          </div>
          <div className="text-xs text-[#878d80] pt-2 border-t border-[#f4f2ec]">
            Reserved in milestone escrow
          </div>
        </div>

        {/* Card 8: Upcoming 14 Days */}
        <div className="bg-white rounded-2xl p-5 border border-[#e8e4dc] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7c8075] text-xs font-medium">
            <span>Upcoming 14 Days</span>
            <div className="w-7 h-7 rounded-lg bg-[#fef5e7] flex items-center justify-center text-sm text-[#a66e22]">
              !
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-serif font-bold text-[#1a1c18]">{formatCurrencyINR(kpis.upcoming14Days)}</span>
          </div>
          <div className="text-xs text-[#878d80] pt-2 border-t border-[#f4f2ec]">
            Decor advance & Photo installment
          </div>
        </div>
      </div>

      {/* Middle Row: Funnel & Budget Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Booking Pipeline Funnel */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-serif font-bold text-[#1a1c18]">Booking Pipeline Funnel</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#eef3ee] text-[#3e6a47] border border-[#d8e6d9]">
                Real-time status
              </span>
            </div>
            <p className="text-xs text-[#70756a] mb-5">
              Workflow tracking from vendor scouting to final on-site wedding day execution.
            </p>

            <div className="space-y-4">
              {pipelineFunnel.map((stage, idx) => (
                <div key={stage.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#2d3129]">{stage.label}</span>
                    <span className="font-semibold text-[#1a1c18]">{stage.count} vendors</span>
                  </div>
                  <div className="w-full bg-[#f4f1ea] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(4, stage.percentage)}%`,
                        backgroundColor: funnelColors[idx % funnelColors.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#f4f2ec] flex items-center justify-between text-xs text-[#7c8075]">
            <span>Next contract sync: Tomorrow, 11:30 AM</span>
            <button
              type="button"
              onClick={() => onNavigateTab('directory')}
              className="text-[#8d493a] font-semibold hover:underline inline-flex items-center gap-1"
            >
              View all pipeline &rarr;
            </button>
          </div>
        </div>

        {/* Right: Budget Allocation by Tier */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-serif font-bold text-[#1a1c18]">Budget Allocation by Tier</h2>
              <span className="text-xs font-semibold text-[#5a5f54]">
                {formatCurrencyINR(kpis.vendorBudgetCap)} Total Pool
              </span>
            </div>
            <p className="text-xs text-[#70756a] mb-5">
              Visual breakdown of contracted vendor services against the master wedding fund.
            </p>

            {/* Segmented bar */}
            <div className="w-full h-3 rounded-full flex overflow-hidden bg-[#f0eae1] mb-5">
              {budgetByTier.map((item, idx) => (
                <div
                  key={item.category}
                  title={`${item.label}: ${formatCurrencyINR(item.allocated)} (${item.sharePercent}%)`}
                  style={{
                    width: `${Math.max(5, item.sharePercent)}%`,
                    backgroundColor: funnelColors[idx % funnelColors.length],
                  }}
                  className="h-full border-r border-white/40 last:border-none"
                />
              ))}
            </div>

            {/* 4 Category Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {budgetByTier.slice(0, 4).map((tier) => (
                <div
                  key={tier.category}
                  onClick={() => onNavigateTab('directory', tier.category)}
                  className="p-3.5 rounded-xl border border-[#ebe7df] bg-[#faf8f4] hover:bg-[#f5f0e6] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#1a1c18] group-hover:text-[#8d493a] transition-colors">
                      {tier.label}
                    </span>
                    <span className="text-[11px] text-[#7d8276]">{tier.vendorsCount} vendors</span>
                  </div>
                  <div className="text-base font-serif font-bold text-[#1a1c18]">
                    {formatCurrencyINR(tier.allocated)}
                  </div>
                  <div className="text-[11px] text-[#8a8f82] mt-0.5">
                    {formatCurrencyINR(tier.paid)} paid
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#f4f2ec] flex items-center justify-between text-xs text-[#7c8075]">
            <span className="text-[#3b6e45] font-medium flex items-center gap-1">
              ✓ Budget utilization is within projected 5% safety buffer
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('categories')}
              className="text-[#8d493a] font-semibold hover:underline inline-flex items-center gap-1"
            >
              Explore all 15 Categories &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Upcoming Milestones & Activity Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Milestones */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-serif font-bold text-[#1a1c18] flex items-center gap-2">
              <span>📅</span> Upcoming Vendor Milestones
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('timeline')}
              className="text-xs font-semibold text-[#8d493a] hover:underline"
            >
              Open Schedule
            </button>
          </div>

          <div className="space-y-3">
            {upcomingMilestones.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8c9185]">
                No upcoming vendor milestones scheduled.
              </div>
            ) : (
              upcomingMilestones.slice(0, 4).map((m) => {
                const dateObj = new Date(m.serviceDate);
                const month = !Number.isNaN(dateObj.getTime())
                  ? dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                  : 'DATE';
                const day = !Number.isNaN(dateObj.getTime()) ? dateObj.getDate() : '--';

                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl border border-[#ebe7df] bg-[#fbfaf6] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#f0eae1] border border-[#e4dcce] flex flex-col items-center justify-center text-center shrink-0">
                        <span className="text-[10px] font-bold tracking-wider text-[#8d493a]">{month}</span>
                        <span className="text-base font-bold text-[#1a1c18] leading-none">{day}</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1a1c18]">{m.title}</div>
                        <div className="text-[11px] text-[#73786d] mt-0.5">
                          {m.vendorName} • {m.ceremonyName || 'General Wedding'}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#e7f2e8] text-[#2e6438] shrink-0">
                      Confirmed
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Activity & Audit Trail */}
        <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-serif font-bold text-[#1a1c18] flex items-center gap-2">
              <span>📜</span> Activity & Audit Trail
            </h2>
            <span className="text-xs text-[#8c9185]">Updated recently</span>
          </div>

          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8c9185]">
                No vendor activity recorded yet.
              </div>
            ) : (
              recentActivity.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-[#ebe7df] bg-[#fbfaf6] flex items-start gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-[#8d493a] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[#1a1c18]">
                      <span className="font-bold">{item.vendorName}:</span> {item.details}
                    </div>
                    <div className="text-[11px] text-[#8c9185] mt-1">
                      {formatShortDate(item.timestamp)} • <span className="font-semibold text-[#6e7267]">{item.title}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
