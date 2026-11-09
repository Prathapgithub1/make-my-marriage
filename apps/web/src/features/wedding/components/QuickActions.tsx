import { Link } from 'react-router';

export interface QuickActionsProps {
  onCreateEvent: () => void;
  onOpenComingSoon: (featureName: string, description: string) => void;
}

export function QuickActions({ onCreateEvent, onOpenComingSoon }: QuickActionsProps) {
  return (
    <div className="mb-4 sm:mb-4.5">
      {/* Section Header matching Screenshot 1 */}
      <div className="flex items-center justify-between mb-2 sm:mb-2.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#86736D]">
            QUICK ACTIONS
          </span>
          <span className="text-[#D8C2BB]">—</span>
          <span className="text-[11px] text-[#86736D]">Frequently accessed wedding tools</span>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Create Event (Filled Rust/Terracotta) */}
        <Link
          to="/events"
          onClick={onCreateEvent}
          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-[#964F38] text-white shadow-xs hover:bg-[#85432E] transition-all group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-[13px] font-bold text-white leading-tight">
              Create Event
            </h3>
            <p className="text-[11px] text-white/80 leading-tight mt-0.5 truncate">
              Ceremony or ritual
            </p>
            <span className="sr-only">Plan an Event</span>
          </div>
        </Link>

        {/* Card 2: Create Task */}
        <Link
          to="/tasks"
          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-white border border-[#EAE6E1] text-[#1A1C18] shadow-2xs hover:border-[#964F38]/40 hover:bg-[#FAF9F5] transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FDF0EA] text-[#964F38] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-[13px] font-bold text-[#1A1C18] leading-tight">
              Create Task
            </h3>
            <p className="text-[11px] text-[#86736D] leading-tight mt-0.5 truncate">
              To-do &amp; checklist
            </p>
            <span className="sr-only">Create a Task</span>
          </div>
        </Link>

        {/* Card 3: Add Guest */}
        <button
          type="button"
          onClick={() =>
            onOpenComingSoon(
              'Add Guest',
              'Guest registry, postal address collection, and RSVP invites are launching soon.',
            )
          }
          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-white border border-[#EAE6E1] text-[#1A1C18] shadow-2xs hover:border-[#964F38]/40 hover:bg-[#FAF9F5] transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EAF5EB] text-[#2F6B38] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-[13px] font-bold text-[#1A1C18] leading-tight">
              Add Guest
            </h3>
            <p className="text-[11px] text-[#86736D] leading-tight mt-0.5 truncate">
              Invitations &amp; RSVPs
            </p>
            <span className="sr-only">Manage Guests</span>
          </div>
        </button>

        {/* Card 4: Add Expense */}
        <button
          type="button"
          onClick={() =>
            onOpenComingSoon(
              'Add Expense',
              'Vendor budget allocation and payment receipt tracking are in development.',
            )
          }
          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-white border border-[#EAE6E1] text-[#1A1C18] shadow-2xs hover:border-[#964F38]/40 hover:bg-[#FAF9F5] transition-all text-left group cursor-pointer"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FEF4E6] text-[#A66E22] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-[13px] font-bold text-[#1A1C18] leading-tight">
              Add Expense
            </h3>
            <p className="text-[11px] text-[#86736D] leading-tight mt-0.5 truncate">
              Vendor budget log
            </p>
            <span className="sr-only">Track Expenses</span>
            <span className="sr-only">Explore Vendors</span>
          </div>
        </button>
      </div>
    </div>
  );
}
