import { DEMO_PLANNING_MILESTONES } from '../dashboardMockData';

export interface PlanningProgressCardProps {
  eventsCount: number;
}

export function PlanningProgressCard({ eventsCount }: PlanningProgressCardProps) {
  // Estimate overall progress based on setup + events
  const calculatedProgress = eventsCount > 0 ? 45 : 25;

  return (
    <div className="bg-white rounded-2xl border border-[#d8c2bb]/40 p-6 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#8a4b35]" />
          <h2 className="font-serif text-lg font-medium text-[#1a1c18]">
            Wedding Planning Progress
          </h2>
        </div>
        <span className="text-xs font-semibold text-[#8a4b35]">
          {calculatedProgress}% Completed
        </span>
      </div>

      <p className="text-xs text-[#53433e] mb-4">
        Your wedding journey across milestones from venue selection to celebration day.
      </p>

      {/* Progress Bar */}
      <div className="w-full bg-[#fafaf3] border border-[#d8c2bb]/40 rounded-full h-2.5 mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-[#8a4b35] via-[#a8624b] to-[#556251] h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${calculatedProgress}%` }}
        />
      </div>

      {/* Milestone Stages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DEMO_PLANNING_MILESTONES.map((milestone, idx) => {
          const isDone = milestone.status === 'completed';
          const isInProgress = milestone.status === 'in_progress';

          return (
            <div
              key={milestone.id}
              className={`p-3 rounded-xl border text-left transition-all ${
                isDone
                  ? 'bg-[#d9e7d2]/30 border-[#d9e7d2]'
                  : isInProgress
                    ? 'bg-[#fafaf3] border-[#8a4b35]/40'
                    : 'bg-white border-[#d8c2bb]/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-[#86736d]">Phase {idx + 1}</span>
                <span className="text-xs">{isDone ? '✓' : isInProgress ? '⏳' : '○'}</span>
              </div>
              <p className="text-xs font-semibold text-[#1a1c18] truncate">{milestone.name}</p>
              <p className="text-[10px] text-[#53433e] mt-0.5 line-clamp-1">
                {milestone.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
