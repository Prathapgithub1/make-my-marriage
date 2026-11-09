import { useState } from 'react';
import {
  type TaskSummary,
  type TaskStatus,
  TASK_STATUS_LABELS,
  TASK_STATUS_STYLES,
  TASK_PRIORITY_STYLES,
  updateTaskStatus,
  deleteTask,
} from './tasksApi';

export interface TaskDetailModalProps {
  task: TaskSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: TaskSummary) => void;
  onTaskUpdated: (updated: TaskSummary) => void;
  onTaskDeleted: (taskId: string) => void;
}

export function formatTaskDisplayDate(isoString: string | null): string {
  if (!isoString) return 'No due date';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'No due date';
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'No due date';
  }
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onEdit,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !task) return null;

  const priorityStyle = TASK_PRIORITY_STYLES[task.priority];
  const statusStyle = TASK_STATUS_STYLES[task.status];

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (task.status === newStatus || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setError(null);
    try {
      const updated = await updateTaskStatus(task.id, newStatus);
      onTaskUpdated(updated);
    } catch {
      setError('Unable to update task status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    try {
      await deleteTask(task.id);
      onTaskDeleted(task.id);
      onClose();
    } catch {
      setError('Unable to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1C18]/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-[#EAE6E1] shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#EAE6E1]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide uppercase ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
              >
                {priorityStyle.label} Priority
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {TASK_STATUS_LABELS[task.status]}
              </span>
              {task.isOverdue && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF0F0] text-[#D32F2F] border border-[#F8D7DA] tracking-wide uppercase">
                  Overdue
                </span>
              )}
            </div>
            <h2
              id="task-detail-title"
              className="font-serif text-2xl font-bold text-[#1A1C18] pt-1"
            >
              {task.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full hover:bg-[#FAF8F5] text-[#86736D] hover:text-[#1A1C18] flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-3"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-[#FEF0F0] border border-[#F8D7DA] text-[#D32F2F] text-xs">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="mt-5 space-y-5">
          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-[#86736D] uppercase tracking-wider mb-1">
              Description
            </h3>
            {task.description ? (
              <p className="text-sm text-[#1A1C18] whitespace-pre-wrap leading-relaxed bg-[#FAF9F5] p-3.5 rounded-xl border border-[#EAE6E1]">
                {task.description}
              </p>
            ) : (
              <p className="text-xs text-[#A09890] italic">No description provided.</p>
            )}
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAF9F5] p-4 rounded-2xl border border-[#EAE6E1]">
            {/* Due Date */}
            <div>
              <span className="text-[11px] font-semibold text-[#86736D] uppercase tracking-wider block">
                Due Date
              </span>
              <p
                className={`text-sm font-medium mt-0.5 ${
                  task.isOverdue ? 'text-[#D32F2F] font-bold' : 'text-[#1A1C18]'
                }`}
              >
                {formatTaskDisplayDate(task.dueDate)}
              </p>
            </div>

            {/* Ceremony */}
            <div>
              <span className="text-[11px] font-semibold text-[#86736D] uppercase tracking-wider block">
                Ceremony / Event
              </span>
              <p className="text-sm font-medium text-[#1A1C18] mt-0.5">
                {task.event ? task.event.name : 'General Wedding Task'}
              </p>
            </div>

            {/* Assignee */}
            <div>
              <span className="text-[11px] font-semibold text-[#86736D] uppercase tracking-wider block">
                Assignee
              </span>
              <div className="flex items-center gap-2 mt-1">
                {task.assignedMember ? (
                  <>
                    <div className="w-6 h-6 rounded-full bg-[#8D493A]/10 text-[#8D493A] font-bold text-[10px] flex items-center justify-center">
                      {task.assignedMember.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#1A1C18]">
                      {task.assignedMember.name}
                    </span>
                    <span className="text-[10px] text-[#86736D]">({task.assignedMember.role})</span>
                  </>
                ) : (
                  <span className="text-xs text-[#86736D] italic">Unassigned</span>
                )}
              </div>
            </div>

            {/* Completed At / Status */}
            <div>
              <span className="text-[11px] font-semibold text-[#86736D] uppercase tracking-wider block">
                Status Lifecycle
              </span>
              <p className="text-sm font-medium text-[#1A1C18] mt-0.5">
                {task.completedAt
                  ? `Completed on ${new Date(task.completedAt).toLocaleDateString()}`
                  : `Currently ${TASK_STATUS_LABELS[task.status]}`}
              </p>
            </div>
          </div>

          {/* Quick Status Changers */}
          <div>
            <h3 className="text-xs font-semibold text-[#86736D] uppercase tracking-wider mb-2">
              Update Status
            </h3>
            <div className="flex items-center gap-2">
              {(['TO_DO', 'IN_PROGRESS', 'COMPLETED'] as TaskStatus[]).map((st) => {
                const isActive = task.status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    disabled={isUpdatingStatus}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#8D493A] text-white border-[#8D493A] shadow-xs'
                        : 'bg-white border-[#D8C2BB] text-[#716B64] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {TASK_STATUS_LABELS[st]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-[#EAE6E1] flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-xs font-semibold text-[#D32F2F] hover:underline transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#D8C2BB] text-xs font-semibold text-[#716B64] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(task);
              }}
              className="px-5 py-2 rounded-xl bg-[#8D493A] hover:bg-[#723B2F] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              Edit Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
