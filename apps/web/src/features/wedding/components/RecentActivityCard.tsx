import { DEMO_ACTIVITY_FEED, type ActivityItem } from '../dashboardMockData';

export interface RecentActivityCardProps {
  customActivities?: ActivityItem[];
}

export function RecentActivityCard({
  customActivities = DEMO_ACTIVITY_FEED,
}: RecentActivityCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#d8c2bb]/40 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8a4b35]" />
          <h2 className="font-serif text-lg font-medium text-[#1a1c18]">Recent Activity</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fafaf3] text-[#86736d] border border-[#d8c2bb]/50">
          Demo Feed
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e3e3dc]">
        {customActivities.map((act) => (
          <div key={act.id} className="relative">
            {/* Timeline Dot */}
            <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#8a4b35] ring-2 ring-[#8a4b35]/20" />

            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[#1a1c18]">{act.title}</p>
                <p className="text-[11px] text-[#53433e] mt-0.5 leading-relaxed">
                  {act.description}
                </p>
              </div>
              <span className="text-[10px] text-[#86736d] whitespace-nowrap">{act.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
