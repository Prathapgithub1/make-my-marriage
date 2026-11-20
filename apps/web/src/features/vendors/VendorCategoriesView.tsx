import {
  formatCurrencyINR,
  VENDOR_CATEGORIES,
  VENDOR_CATEGORY_META,
  type Vendor,
  type VendorCategoryValue,
} from './vendorsApi';

interface VendorCategoriesViewProps {
  vendors: Vendor[];
  onSelectCategory: (category: VendorCategoryValue) => void;
}

export function VendorCategoriesView({
  vendors,
  onSelectCategory,
}: VendorCategoriesViewProps) {
  // Aggregate stats per category
  const categoryStats = VENDOR_CATEGORIES.map((cat) => {
    const matching = vendors.filter((v) => v.category === cat);
    const count = matching.length;
    let totalAgreedPaise = 0;
    let totalPaidPaise = 0;

    matching.forEach((v) => {
      totalAgreedPaise += Math.round((parseFloat(v.totalAgreed) || 0) * 100);
      totalPaidPaise += Math.round((parseFloat(v.totalPaid) || 0) * 100);
    });

    const agreed = (totalAgreedPaise / 100).toFixed(2);
    const paid = (totalPaidPaise / 100).toFixed(2);
    const balance = ((totalAgreedPaise - totalPaidPaise) / 100).toFixed(2);
    const paidPercentage =
      totalAgreedPaise > 0 ? Math.min(100, Math.round((totalPaidPaise / totalAgreedPaise) * 100)) : 0;

    return {
      category: cat,
      meta: VENDOR_CATEGORY_META[cat],
      count,
      agreed,
      paid,
      balance,
      paidPercentage,
      sampleVendors: matching.slice(0, 3).map((v) => v.name),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#e8e4dc] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider text-[#8d493a] bg-[#fbf5f0] border border-[#f2e1d5] uppercase mb-2">
            CURATED WEDDING VERTICALS
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#1a1c18]">18 Vendor Categories & Production Tiers</h2>
          <p className="text-xs text-[#70756a] mt-1 max-w-2xl">
            From palace venues to floral mandap artists and bridal couture, review category allocations and vendor rosters.
          </p>
        </div>

        <div className="text-xs text-[#7a7f73] bg-[#fbfaf6] px-4 py-3 rounded-xl border border-[#ebe7df]">
          Total Active Categories: <span className="font-bold text-[#1a1c18]">{categoryStats.filter((c) => c.count > 0).length} / 18</span>
        </div>
      </div>

      {/* Grid of 18 Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categoryStats.map((stat) => (
          <div
            key={stat.category}
            onClick={() => onSelectCategory(stat.category)}
            className="bg-white rounded-2xl border border-[#e8e4dc] p-5 shadow-sm hover:shadow-md hover:border-[#8d493a]/40 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${stat.meta.bg}`}
                  >
                    {stat.meta.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#1a1c18] group-hover:text-[#8d493a] transition-colors">
                      {stat.meta.label}
                    </h3>
                    <p className="text-xs text-[#777c70] mt-0.5">
                      {stat.count} {stat.count === 1 ? 'partner' : 'partners'} contracted
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    stat.count > 0 ? 'bg-[#e7f2e8] text-[#2e6438]' : 'bg-[#f5f2ec] text-[#8c9185]'
                  }`}
                >
                  {stat.count > 0 ? `${stat.count} Active` : 'Available'}
                </span>
              </div>

              {/* Financial Snapshot */}
              <div className="mt-4 pt-3 border-t border-[#f4f2ec] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-[#8c9185] uppercase tracking-wider font-semibold">Allocated</div>
                  <div className="text-sm font-serif font-bold text-[#1a1c18] mt-0.5">
                    {formatCurrencyINR(stat.agreed)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8c9185] uppercase tracking-wider font-semibold">Cleared</div>
                  <div className="text-sm font-serif font-bold text-[#3b6e45] mt-0.5">
                    {formatCurrencyINR(stat.paid)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-[#70756a] mb-1">
                  <span>Settlement Progress</span>
                  <span className="font-semibold text-[#1a1c18]">{stat.paidPercentage}%</span>
                </div>
                <div className="w-full bg-[#f0eae1] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#8d493a] h-full rounded-full transition-all duration-500"
                    style={{ width: `${stat.paidPercentage}%` }}
                  />
                </div>
              </div>

              {/* Sample partners */}
              {stat.sampleVendors.length > 0 && (
                <div className="mt-3 pt-2 text-[11px] text-[#82877b]">
                  <span className="font-medium text-[#2d3129]">Partners:</span>{' '}
                  {stat.sampleVendors.join(', ')}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#f4f2ec] flex items-center justify-between text-xs text-[#8d493a] font-semibold">
              <span>View Partners</span>
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
