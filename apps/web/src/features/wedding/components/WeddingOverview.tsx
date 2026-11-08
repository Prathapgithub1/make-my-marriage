export interface WeddingOverviewProps {
  title: string;
  description?: string | null;
  weddingDate: string | null;
  location?: string | null;
  daysRemaining: number | null;
  onEdit: () => void;
}

export function WeddingOverview({
  title,
  weddingDate,
  location,
  daysRemaining,
  onEdit,
}: WeddingOverviewProps) {
  const formattedFullDate = weddingDate
    ? new Date(weddingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Monday, November 24, 2025';

  const destinationText = location?.trim() || 'Bangalore Palace, Karnataka';

  const countdownText =
    daysRemaining !== null
      ? daysRemaining >= 0
        ? `${daysRemaining} Days to Go`
        : `${Math.abs(daysRemaining)} Days Ago`
      : '142 Days to Go';

  return (
    <div className="bg-[#FAF9F5] rounded-2xl border border-[#EAE6E1] p-4 sm:p-4.5 lg:p-5 mb-4 sm:mb-4.5 shadow-2xs relative overflow-hidden">
      {/* Subtle decorative rotated square outline in background */}
      <div
        className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 w-28 md:w-36 h-28 md:h-36 border border-[#E8DFD8] rotate-45 pointer-events-none opacity-20 rounded-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="max-w-3xl">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5EBE6] text-[#8A4B35] text-[10.5px] font-semibold mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A4B35]" />
            Welcome to your wedding workspace
          </div>

          {/* Wedding Name */}
          <h1 className="font-serif text-xl sm:text-2xl lg:text-[25px] text-[#1A1C18] tracking-tight font-medium leading-tight mb-1">
            {title || "Prathap & Akshitha's Wedding"}
          </h1>

          {/* Subtitle */}
          <p className="text-[11.5px] sm:text-xs text-[#605A54] leading-normal max-w-2xl mb-3">
            Your concierge workspace is synchronized. Let&apos;s make every ceremony, guest
            invitation, and milestone effortless.
          </p>

          {/* Metadata Row: 3 Boxes (Ceremony Date, Destination, Countdown) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Box 1: Scheduled Ceremony */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#EAE6E1] shadow-2xs">
              <span className="text-[#8A4B35] text-xs sm:text-sm" aria-hidden="true">
                📅
              </span>
              <div>
                <p className="text-[8.5px] uppercase font-bold tracking-wider text-[#86736D]">
                  SCHEDULED CEREMONY
                </p>
                <p className="text-xs font-semibold text-[#1A1C18] leading-tight">
                  {formattedFullDate}
                </p>
              </div>
            </div>

            {/* Box 2: Celebration Destination */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#EAE6E1] shadow-2xs">
              <span className="text-[#8A4B35] text-xs sm:text-sm" aria-hidden="true">
                📍
              </span>
              <div>
                <p className="text-[8.5px] uppercase font-bold tracking-wider text-[#86736D]">
                  CELEBRATION DESTINATION
                </p>
                <p className="text-xs font-semibold text-[#1A1C18] truncate max-w-[160px] sm:max-w-xs leading-tight">
                  {destinationText}
                </p>
              </div>
            </div>

            {/* Box 3: Countdown Green Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#EAF5EB] text-[#2F6B38] border border-[#CDE5D1] shadow-2xs font-semibold text-xs">
              <span aria-hidden="true" className="text-xs">
                ⏳
              </span>
              <span>{countdownText}</span>
            </div>
          </div>
        </div>

        {/* Right Action: Edit Wedding Details Button */}
        <div className="flex flex-col items-start lg:items-end gap-1 shrink-0 self-start lg:self-center">
          <button
            type="button"
            id="edit-wedding-details-btn"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#D8C2BB] text-[#1A1C18] hover:text-[#8A4B35] hover:border-[#8A4B35] text-xs font-semibold shadow-2xs transition-all hover:bg-[#FAF9F5] cursor-pointer"
          >
            <span>✏️</span>
            <span>Edit Wedding Details</span>
          </button>
          <div className="flex items-center gap-1 text-[9.5px] text-[#86736D]">
            <span>🛡️</span>
            <span>Details sync across invites &amp; website</span>
          </div>
        </div>
      </div>
    </div>
  );
}
