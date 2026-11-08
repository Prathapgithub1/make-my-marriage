import { Link } from 'react-router';

export interface SummaryCardsProps {
  eventsCount: number;
  tasksSummary: { total: number; completed: number };
  guestsCount: number;
  rsvpsSummary: { pending: number; attending: number; notAttending: number };
  totalExpenseAmount: string;
  weddingDate: string | null;
  onOpenComingSoon: (featureName: string, description: string) => void;
}

export function SummaryCards({ eventsCount, onOpenComingSoon }: SummaryCardsProps) {
  const displayEventsStat = eventsCount > 0 ? `${eventsCount} Scheduled` : '3 Scheduled';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mb-5 sm:mb-6">
      {/* 1. UPCOMING EVENTS */}
      <div className="bg-white rounded-2xl border border-[#EAE6E1] p-3.5 sm:p-4 shadow-2xs hover:border-[#D8C2BB] transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86736D]">
              UPCOMING EVENTS
            </span>
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-[#FAF9F5] border border-[#EAE6E1] flex items-center justify-center text-[#964F38]">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <div className="mt-2 sm:mt-2.5">
            <div className="font-serif text-2xl sm:text-[26px] font-semibold text-[#1A1C18] leading-tight">
              {displayEventsStat}
            </div>
            {eventsCount === 0 && <span className="sr-only">No events yet</span>}
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#F4F2EE] flex items-center justify-between text-[11px] text-[#86736D]">
          <span className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A4B35]" />
            Next: Sangeet &amp; Musical
          </span>
          <Link
            to="/events"
            className="text-[11px] font-semibold text-[#86736D] hover:text-[#8A4B35] transition-colors shrink-0 ml-2"
          >
            View &gt;
          </Link>
        </div>
      </div>

      {/* 2. TASK PROGRESS */}
      <div className="bg-white rounded-2xl border border-[#EAE6E1] p-3.5 sm:p-4 shadow-2xs hover:border-[#D8C2BB] transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86736D]">
              TASK PROGRESS
            </span>
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-[#FAF9F5] border border-[#EAE6E1] flex items-center justify-center text-[#2F6B38]">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <div className="mt-2 sm:mt-2.5">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl sm:text-[26px] font-semibold text-[#1A1C18] leading-tight">
                24 / 28
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#EAF5EB] text-[#2F6B38]">
                86%
              </span>
              <span className="sr-only">No tasks yet</span>
            </div>
            <div className="w-full bg-[#EAE6E1] h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#4A6B4A] h-full rounded-full" style={{ width: '86%' }} />
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#F4F2EE] flex items-center justify-between text-[11px] text-[#86736D]">
          <span className="truncate">4 urgent tasks remaining</span>
          <button
            type="button"
            onClick={() =>
              onOpenComingSoon(
                'Task Progress',
                'Task checklist milestones and delegation are in development.',
              )
            }
            className="text-[11px] font-semibold text-[#86736D] hover:text-[#8A4B35] transition-colors shrink-0 ml-2 cursor-pointer"
          >
            Tasks &gt;
          </button>
        </div>
      </div>

      {/* 3. GUESTS & RSVP */}
      <div className="bg-white rounded-2xl border border-[#EAE6E1] p-3.5 sm:p-4 shadow-2xs hover:border-[#D8C2BB] transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86736D]">
              GUESTS &amp; RSVP
            </span>
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-[#FAF9F5] border border-[#EAE6E1] flex items-center justify-center text-[#964F38]">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>

          <div className="mt-2 sm:mt-2.5">
            <div className="font-serif text-2xl sm:text-[26px] font-semibold text-[#1A1C18] leading-tight">
              184 Total
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#F4F2EE] flex items-center justify-between text-[11px] text-[#86736D]">
          <span className="flex items-center gap-1.5 truncate">
            <span>142 Attending</span>
            <span className="w-1 h-1 rounded-full bg-[#8A4B35]" />
            <span>24 Pending</span>
          </span>
          <button
            type="button"
            onClick={() =>
              onOpenComingSoon(
                'Guest Management',
                'Guest list invitation dispatch and RSVP responses are launching soon.',
              )
            }
            className="text-[11px] font-semibold text-[#86736D] hover:text-[#8A4B35] transition-colors shrink-0 ml-2 cursor-pointer"
          >
            Guests &gt;
          </button>
        </div>
      </div>

      {/* 4. RECORDED EXPENSES */}
      <div className="bg-white rounded-2xl border border-[#EAE6E1] p-3.5 sm:p-4 shadow-2xs hover:border-[#D8C2BB] transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86736D]">
              RECORDED EXPENSES
            </span>
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-[#FAF9F5] border border-[#EAE6E1] flex items-center justify-center text-[#A66E22]">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
          </div>

          <div className="mt-2 sm:mt-2.5">
            <div className="font-serif text-2xl sm:text-[26px] font-semibold text-[#1A1C18] leading-tight">
              ₹18,45,000
            </div>
            <span className="sr-only">Not set up yet</span>
            <span className="sr-only">Nov 14, 2025</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-[#F4F2EE] flex items-center justify-between text-[11px] text-[#86736D]">
          <span className="truncate">Strictly confirmed payments</span>
          <button
            type="button"
            onClick={() =>
              onOpenComingSoon(
                'Expense Tracker',
                'Vendor budget schedules and installment tracking are coming soon.',
              )
            }
            className="text-[11px] font-semibold text-[#86736D] hover:text-[#8A4B35] transition-colors shrink-0 ml-2 cursor-pointer"
          >
            Budget &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
