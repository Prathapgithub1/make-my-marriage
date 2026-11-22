import {
  CATEGORY_META,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
  formatCurrencyINR,
  type ExpenseAnalytics,
} from './expensesApi';

interface ExpenseAnalyticsChartsProps {
  analytics: ExpenseAnalytics;
  onExportCsv: () => void;
}

export function ExpenseAnalyticsCharts({ analytics, onExportCsv }: ExpenseAnalyticsChartsProps) {
  const { byCategory, byEvent, byPaymentStatus, byPaymentMethod, byVendor, monthlyTrend, summary } =
    analytics;

  const totalSpentNum = Number(summary.totalSpent);

  // SVG Donut Calculations (circle radius 42 => circumference ~263.89)
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;
  const donutSegments = byCategory
    .filter((item) => Number(item.totalAmount) > 0)
    .map((item) => {
      const value = Number(item.totalAmount);
      const ratio = totalSpentNum > 0 ? value / totalSpentNum : 0;
      const strokeLength = ratio * circumference;
      const segment = {
        ...item,
        color: CATEGORY_META[item.category]?.color ?? '#7A746D',
        label: CATEGORY_META[item.category]?.label ?? item.category,
        strokeDasharray: `${strokeLength} ${circumference - strokeLength}`,
        strokeDashoffset: -accumulatedOffset,
      };
      accumulatedOffset += strokeLength;
      return segment;
    });

  const maxEventValue = Math.max(
    1,
    ...byEvent.map((ev) => Math.max(Number(ev.allocatedBudget), Number(ev.spentAmount))),
  );
  const maxMonthValue = Math.max(1, ...monthlyTrend.map((m) => Number(m.totalAmount)));

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="bg-white rounded-2xl border border-[#EAE6E1] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1A1C18]">
            Financial Insights & Cost Breakdown
          </h3>
          <p className="text-xs sm:text-sm text-[#5C5D59] mt-0.5">
            Real-time breakdown across categories, ceremonies, payment channels, and contracted
            vendors.
          </p>
        </div>
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#DED8D0] bg-[#FAF8F5] text-xs sm:text-sm font-semibold text-[#1A1C18] hover:bg-[#EFECE7] transition-colors cursor-pointer shrink-0"
        >
          <span>⬇</span>
          <span>Export Financial Report (CSV)</span>
        </button>
      </div>

      {/* Category Breakdown: SVG Donut + Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EAE6E1] p-5 sm:p-6 shadow-2xs flex flex-col">
          <h4 className="font-serif text-base font-bold text-[#1A1C18]">Spend by Category</h4>
          <p className="text-xs text-[#86736D] mt-0.5">
            Proportional allocation across wedding pillars
          </p>

          {donutSegments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-[#5C5D59]">No active expenses recorded yet.</p>
              <p className="text-xs text-[#86736D] mt-1">
                Add expenses to visualize category shares.
              </p>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center">
              <div className="relative w-48 h-48">
                <svg
                  viewBox="0 0 110 110"
                  className="w-full h-full -rotate-90"
                  aria-label="Category spend donut chart"
                >
                  <circle
                    cx="55"
                    cy="55"
                    r={radius}
                    fill="none"
                    stroke="#F3EFEA"
                    strokeWidth="16"
                  />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.category}
                      cx="55"
                      cy="55"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="16"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span className="text-[10px] uppercase tracking-wider text-[#86736D] font-semibold">
                    Total Spend
                  </span>
                  <span className="font-serif text-base font-bold text-[#1A1C18] leading-tight mt-0.5">
                    {formatCurrencyINR(summary.totalSpent)}
                  </span>
                </div>
              </div>

              <div className="w-full mt-6 space-y-2.5">
                {donutSegments.map((seg) => (
                  <div key={seg.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="font-medium text-[#1A1C18] truncate">{seg.label}</span>
                      <span className="text-[#86736D]">({seg.count})</span>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-semibold text-[#1A1C18]">
                        {formatCurrencyINR(seg.totalAmount)}
                      </span>
                      <span className="text-[#86736D] ml-1.5">{seg.sharePercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Event Budget vs Actual Spend Comparison */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EAE6E1] p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="font-serif text-base font-bold text-[#1A1C18]">
                Ceremony Budget vs. Actual Spend
              </h4>
              <p className="text-xs text-[#86736D] mt-0.5">
                Compare each event&apos;s target budget against committed and settled amounts
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#5C5D59]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#DFD7CE]" />
                Budget
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#8D493A]" />
                Spent
              </span>
            </div>
          </div>

          {byEvent.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#5C5D59]">
              No ceremonies created yet. Create events to track event-wise budgets.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {byEvent.map((evt) => {
                const allocNum = Number(evt.allocatedBudget);
                const spentNum = Number(evt.spentAmount);
                const allocWidth = Math.round((allocNum / maxEventValue) * 100);
                const spentWidth = Math.round((spentNum / maxEventValue) * 100);

                return (
                  <div key={evt.eventId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-[#1A1C18] truncate">
                          {evt.eventName}
                        </span>
                        {evt.isOverBudget && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FDECEA] text-[#A8382B] text-[10px] font-semibold">
                            Over Budget
                          </span>
                        )}
                      </div>
                      <span className="text-[#5C5D59] shrink-0">
                        {formatCurrencyINR(evt.spentAmount)}
                        {evt.hasAllocatedBudget
                          ? ` / ${formatCurrencyINR(evt.allocatedBudget)}`
                          : ''}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {evt.hasAllocatedBudget && (
                        <div className="h-2 rounded-full bg-[#F5F2EE] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#D6CCC1]"
                            style={{ width: `${allocWidth}%` }}
                          />
                        </div>
                      )}
                      <div className="h-2 rounded-full bg-[#F5F2EE] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            evt.isOverBudget ? 'bg-[#A8382B]' : 'bg-[#8D493A]'
                          }`}
                          style={{ width: `${spentWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {analytics.unassignedEventExpenses.expenseCount > 0 && (
                <div className="pt-3 border-t border-[#F4F2EE] flex items-center justify-between text-xs text-[#5C5D59]">
                  <span>
                    General Wedding Expenses ({analytics.unassignedEventExpenses.expenseCount}{' '}
                    items)
                  </span>
                  <span className="font-semibold text-[#1A1C18]">
                    {formatCurrencyINR(analytics.unassignedEventExpenses.spentAmount)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Spending Trend + Payment Channels + Top Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl border border-[#EAE6E1] p-5 shadow-2xs">
          <h4 className="font-serif text-base font-bold text-[#1A1C18]">Monthly Spend Trend</h4>
          <p className="text-xs text-[#86736D] mt-0.5">Committed spend by calendar month</p>
          {monthlyTrend.length === 0 ? (
            <p className="text-xs text-[#86736D] py-10 text-center">No spending history yet.</p>
          ) : (
            <div className="mt-5 flex items-end gap-3 h-44 pt-4">
              {monthlyTrend.map((m) => {
                const heightPct = Math.max(
                  8,
                  Math.round((Number(m.totalAmount) / maxMonthValue) * 100),
                );
                return (
                  <div
                    key={m.month}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                  >
                    <span className="text-[10px] font-semibold text-[#1A1C18] truncate max-w-full">
                      {formatCurrencyINR(m.totalAmount)}
                    </span>
                    <div className="w-full max-w-10 bg-[#F5F2EE] rounded-t-lg h-28 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-[#556251] rounded-t-lg transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#6B5F57]">{m.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Status & Methods */}
        <div className="bg-white rounded-2xl border border-[#EAE6E1] p-5 shadow-2xs space-y-5">
          <div>
            <h4 className="font-serif text-base font-bold text-[#1A1C18]">Payment Statuses</h4>
            <div className="mt-3 space-y-2">
              {byPaymentStatus.length === 0 ? (
                <p className="text-xs text-[#86736D]">No status data yet.</p>
              ) : (
                byPaymentStatus.map((item) => {
                  const meta =
                    PAYMENT_STATUS_META[item.paymentStatus] ?? PAYMENT_STATUS_META.PENDING;
                  return (
                    <div
                      key={item.paymentStatus}
                      className="flex items-center justify-between text-xs"
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-medium ${meta.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                        {meta.label} ({item.count})
                      </span>
                      <span className="font-semibold text-[#1A1C18]">
                        {formatCurrencyINR(item.totalAmount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F4F2EE]">
            <h4 className="font-serif text-base font-bold text-[#1A1C18]">Payment Channels</h4>
            <div className="mt-3 space-y-2">
              {byPaymentMethod.length === 0 ? (
                <p className="text-xs text-[#86736D]">No payment method breakdown yet.</p>
              ) : (
                byPaymentMethod.map((item) => (
                  <div
                    key={item.paymentMethod}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-[#4A4640] font-medium">
                      {PAYMENT_METHOD_LABELS[item.paymentMethod]} ({item.count})
                    </span>
                    <span className="font-semibold text-[#1A1C18]">
                      {formatCurrencyINR(item.totalAmount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Top Vendors */}
        <div className="bg-white rounded-2xl border border-[#EAE6E1] p-5 shadow-2xs">
          <h4 className="font-serif text-base font-bold text-[#1A1C18]">Spend by Vendor</h4>
          <p className="text-xs text-[#86736D] mt-0.5">Highest value partners & payees</p>
          <div className="mt-4 space-y-3">
            {byVendor.length === 0 ? (
              <p className="text-xs text-[#86736D] py-8 text-center">
                No vendor spend recorded yet.
              </p>
            ) : (
              byVendor.slice(0, 6).map((v) => (
                <div
                  key={v.vendorId ?? v.vendorName}
                  className="flex items-center justify-between text-xs pb-2.5 border-b border-[#F4F2EE] last:border-0 last:pb-0"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-[#1A1C18] truncate">{v.vendorName}</p>
                    <p className="text-[11px] text-[#86736D]">
                      {v.count} {v.count === 1 ? 'expense' : 'expenses'} · Paid{' '}
                      {formatCurrencyINR(v.paidAmount)}
                    </p>
                  </div>
                  <span className="font-semibold text-[#8D493A] shrink-0">
                    {formatCurrencyINR(v.totalAmount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
