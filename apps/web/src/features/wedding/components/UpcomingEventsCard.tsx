import * as React from 'react';
import { useState } from 'react';
import { Link } from 'react-router';
import type { DemoEvent } from '../dashboardMockData';

export interface UpcomingEventItem {
  id: string;
  name: string;
  startsAt: string;
  venueName: string | null;
}

export interface UpcomingEventsCardProps {
  events: UpcomingEventItem[];
}

export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // If real events exist, format them. Otherwise, present an honest empty state.
  const hasRealEvents = events.length > 0;

  const displayList: DemoEvent[] = events.map((e, index) => {
    const d = new Date(e.startsAt);
    const month = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
      : 'TBD';
    const day = !isNaN(d.getTime()) ? String(d.getDate()) : '—';
    const timeRange = !isNaN(d.getTime())
      ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : 'Time TBD';

    return {
      id: e.id,
      name: e.name,
      month,
      day,
      timeRange,
      venue: e.venueName || 'Venue to be announced',
      guestCount: '',
      statusBadge: index === 0 ? 'MAIN CEREMONY' : 'Confirmed',
      isMainCeremony: index === 0,
    };
  });

  return (
    <div className="space-y-4">
      {/* Header matching Screenshot 2 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8A4B35]" />
          <h2 className="font-serif text-xl font-semibold text-[#1A1C18]">Upcoming Events</h2>
          <span className="text-xs text-[#86736D] font-normal hidden sm:inline">
            Ceremonies &amp; Itinerary
          </span>
          <span className="sr-only">Your wedding events start here</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <Link
            to="/events"
            className="text-[#8D493A] hover:underline transition-colors flex items-center gap-1"
          >
            + Add Ceremony
          </Link>
          <Link
            to="/events"
            className="text-[#1A1C18] hover:text-[#8D493A] transition-colors flex items-center gap-1"
          >
            <span>View All</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Events List Cards */}
      <div className="space-y-3">
        {hasRealEvents ? (
          displayList.map((evt) => {
            const isMain = evt.isMainCeremony || evt.statusBadge === 'MAIN CEREMONY';

            return (
              <div
                key={evt.id}
                className={`bg-white rounded-2xl border border-[#EAE6E1] p-4 sm:p-5 shadow-2xs hover:border-[#D8C2BB] transition-all flex items-center justify-between gap-4 relative ${
                  isMain ? 'border-l-4 border-l-[#8D493A]' : ''
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Date Box */}
                  <div
                    className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                      isMain ? 'bg-[#8D493A] text-white shadow-xs' : 'bg-[#F4F2EE] text-[#1A1C18]'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold tracking-wider uppercase leading-none ${
                        isMain ? 'text-white/80' : 'text-[#86736D]'
                      }`}
                    >
                      {evt.month}
                    </span>
                    <span className="font-serif text-lg font-bold mt-1 leading-none">
                      {evt.day}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#1A1C18] truncate">{evt.name}</h3>
                      {isMain ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF0EA] text-[#8D493A] tracking-wider uppercase">
                          MAIN CEREMONY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF5EB] text-[#2F6B38]">
                          Confirmed
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#86736D] mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span>🕒</span>
                        <span>{evt.timeRange}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-xs">
                        <span>📍</span>
                        <span className="truncate">{evt.venue}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Guest Count & Options Menu */}
                <div className="flex items-center gap-3 shrink-0">
                  {evt.guestCount ? (
                    <span className="text-xs text-[#86736D] hidden sm:inline">
                      {evt.guestCount}
                    </span>
                  ) : null}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId((curr) => (curr === evt.id ? null : evt.id))}
                      className="p-1.5 rounded-lg text-[#86736D] hover:text-[#1A1C18] hover:bg-[#F4F2EE] transition-colors cursor-pointer"
                      aria-label={`Options for ${evt.name}`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>

                    {activeMenuId === evt.id && (
                      <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl border border-[#EAE6E1] shadow-lg py-1 z-20">
                        <Link
                          to={`/events/${evt.id}`}
                          className="block px-3 py-1.5 text-xs text-[#1A1C18] hover:bg-[#F4F2EE]"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/events/${evt.id}`}
                          className="block px-3 py-1.5 text-xs text-[#1A1C18] hover:bg-[#F4F2EE]"
                        >
                          Edit Ceremony
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-[#D8C2BB] p-8 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-[#FAF5F2] text-[#8A4B35] flex items-center justify-center mx-auto mb-3 text-xl">
              📅
            </div>
            <h3 className="font-serif text-base font-semibold text-[#1A1C18]">
              No events scheduled yet
            </h3>
            <p className="text-xs text-[#86736D] mt-1 max-w-sm mx-auto">
              Add your ceremonies, rituals, or reception to build your wedding timeline.
            </p>
            <Link
              to="/events"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8A4B35] hover:bg-[#723C2A] text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <span>+</span>
              <span>Schedule First Event</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
