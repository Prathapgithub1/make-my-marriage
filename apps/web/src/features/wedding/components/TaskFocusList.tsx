import * as React from 'react';
import { useState } from 'react';
import { DEMO_FOCUS_TASKS, type FocusTask } from '../dashboardMockData';

export interface TaskFocusListProps {
  tasksSummary?: { total: number; completed: number };
  onOpenComingSoon: (featureName: string, description: string) => void;
}

export function TaskFocusList({ onOpenComingSoon }: TaskFocusListProps) {
  const [tasks, setTasks] = useState<FocusTask[]>(DEMO_FOCUS_TASKS);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t)),
    );
  };

  const renderPriorityBadge = (priority: 'HIGH' | 'MED' | 'Normal') => {
    if (priority === 'HIGH') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF0F0] text-[#D32F2F] tracking-wide uppercase shrink-0">
          HIGH
        </span>
      );
    }
    if (priority === 'MED') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF6E6] text-[#B7791F] tracking-wide uppercase shrink-0">
          MED
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F4F2EE] text-[#716B64] shrink-0">
        Normal
      </span>
    );
  };

  return (
    <div className="space-y-4" id="tasks">
      {/* Header matching Screenshot 2 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#556251]" />
          <h2 className="font-serif text-xl font-semibold text-[#1A1C18]">Tasks to focus on</h2>
          <span className="text-xs text-[#86736D] font-normal hidden sm:inline">
            Priority checklist
          </span>
          <span className="sr-only">Keep your plans organized</span>
          <span className="sr-only">0 of 0 Completed</span>
        </div>

        <button
          type="button"
          onClick={() =>
            onOpenComingSoon(
              'Create Task',
              'Task assignment, vendor checklist, and calendar reminders are launching soon.',
            )
          }
          className="text-xs font-semibold text-[#8D493A] hover:underline transition-colors flex items-center gap-1 cursor-pointer"
        >
          + New Task
        </button>
      </div>

      {/* Task List Cards */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`bg-white rounded-2xl border border-[#EAE6E1] p-4 sm:p-4.5 shadow-2xs hover:border-[#D8C2BB] transition-all flex items-start justify-between gap-3 cursor-pointer select-none ${
              task.isCompleted ? 'bg-[#FAF9F5]/70 opacity-70' : ''
            }`}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              {/* Custom Checkbox */}
              <button
                type="button"
                aria-label={
                  task.isCompleted ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`
                }
                className={`w-4.5 h-4.5 rounded border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                  task.isCompleted
                    ? 'bg-[#8D493A] border-[#8D493A] text-white'
                    : 'border-[#D8C2BB] hover:border-[#8D493A] bg-white'
                }`}
              >
                {task.isCompleted && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>

              <div className="min-w-0">
                <p
                  className={`text-xs sm:text-sm font-semibold text-[#1A1C18] leading-tight ${
                    task.isCompleted ? 'line-through text-[#86736D]' : ''
                  }`}
                >
                  {task.title}
                </p>

                {/* Subtitle / Assignee info */}
                <div className="flex items-center gap-2 text-xs text-[#86736D] mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span>📅</span>
                    <span>{task.dueDate}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-[#EAE6E1] text-[#53433E] text-[9px] font-bold flex items-center justify-center shrink-0">
                      {task.assignee.initials}
                    </span>
                    <span>{task.assignee.name}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Priority Badge */}
            <div>{renderPriorityBadge(task.priority)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
