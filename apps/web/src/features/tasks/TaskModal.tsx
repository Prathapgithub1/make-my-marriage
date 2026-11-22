import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createTask,
  updateTask,
  type TaskSummary,
  type TaskStatus,
  type TaskPriority,
  TASK_STATUS_LABELS,
} from './tasksApi';
import { getMembers } from '../members/membersApi';
import { listEvents } from '../events/eventsApi';
import { ApiRequestError } from '../../lib/api-client';

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (task: TaskSummary) => void;
  initialTask?: TaskSummary | null;
}

export function TaskModal({ isOpen, onClose, onSuccess, initialTask }: TaskModalProps) {
  const isEditing = Boolean(initialTask);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TO_DO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [eventId, setEventId] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch workspace members for assignment dropdown
  const { data: members = [] } = useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
    enabled: isOpen,
  });

  // Fetch wedding events for related event dropdown
  const { data: eventsData } = useQuery({
    queryKey: ['events', 'modal-select'],
    queryFn: () => listEvents({ limit: 100 }),
    enabled: isOpen,
  });
  const events = eventsData?.events ?? [];

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setApiError(null);
      return;
    }

    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description ?? '');
      setStatus(initialTask.status);
      setPriority(initialTask.priority);
      setDueDate(initialTask.dueDate ? initialTask.dueDate.slice(0, 10) : '');
      setEventId(initialTask.eventId ?? '');
      setAssignedMemberId(initialTask.assignedMemberId ?? '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('TO_DO');
      setPriority('MEDIUM');
      setDueDate('');
      setEventId('');
      setAssignedMemberId('');
    }
    setErrors({});
    setApiError(null);
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) {
      nextErrors.title = 'Task title cannot be blank.';
    } else if (title.trim().length > 200) {
      nextErrors.title = 'Title cannot exceed 200 characters.';
    }

    if (description.trim().length > 2000) {
      nextErrors.description = 'Description cannot exceed 2000 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        status,
        priority,
        dueDate: dueDate ? new Date(`${dueDate}T12:00:00.000Z`).toISOString() : null,
        eventId: eventId ? eventId : null,
        assignedMemberId: assignedMemberId ? assignedMemberId : null,
      };

      let result: TaskSummary;
      if (isEditing && initialTask) {
        result = await updateTask(initialTask.id, payload);
      } else {
        result = await createTask(payload);
      }

      onSuccess?.(result);
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setApiError(err.message);
        if (err.details) {
          setErrors((prev) => ({ ...prev, ...(err.details as Record<string, string>) }));
        }
      } else {
        setApiError('Unable to save task. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1C18]/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-[#EAE6E1] shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE6E1]">
          <div>
            <span className="text-[11px] font-semibold tracking-widest text-[#8D493A] uppercase">
              Wedding Coordination
            </span>
            <h2
              id="task-modal-title"
              className="font-serif text-2xl font-bold text-[#1A1C18] mt-0.5"
            >
              {isEditing ? 'Edit Wedding Task' : 'Create New Task'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-full hover:bg-[#FAF8F5] text-[#86736D] hover:text-[#1A1C18] flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {apiError && (
          <div className="mt-4 p-3 rounded-xl bg-[#FEF0F0] border border-[#F8D7DA] text-[#D32F2F] text-xs">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4.5">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-xs font-semibold text-[#1A1C18] mb-1">
              Task Title <span className="text-[#D32F2F]">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finalize floral palette & Mandap structure"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-[#1A1C18] placeholder-[#A09890] transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/20 ${
                errors.title ? 'border-[#D32F2F] bg-[#FEF0F0]/20' : 'border-[#D8C2BB] bg-white'
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-[#D32F2F]">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="task-desc" className="block text-xs font-semibold text-[#1A1C18] mb-1">
              Description <span className="text-[#86736D] font-normal">(optional)</span>
            </label>
            <textarea
              id="task-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details, specific instructions, or notes for the assignee..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8C2BB] text-sm text-[#1A1C18] placeholder-[#A09890] transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/20"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-[#D32F2F]">{errors.description}</p>
            )}
          </div>

          {/* Priority & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1C18] mb-1.5">Priority</label>
              <div className="flex items-center gap-1.5">
                {(['LOW', 'MEDIUM', 'HIGH'] as TaskPriority[]).map((p) => {
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? p === 'HIGH'
                            ? 'bg-[#FEF0F0] border-[#D32F2F] text-[#D32F2F]'
                            : p === 'MEDIUM'
                              ? 'bg-[#FEF6E6] border-[#B7791F] text-[#B7791F]'
                              : 'bg-[#F4F2EE] border-[#716B64] text-[#1A1C18]'
                          : 'border-[#EAE6E1] bg-white text-[#716B64] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {p === 'MEDIUM' ? 'MED' : p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="task-status"
                className="block text-xs font-semibold text-[#1A1C18] mb-1.5"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8C2BB] bg-white text-xs font-medium text-[#1A1C18] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/20"
              >
                <option value="TO_DO">{TASK_STATUS_LABELS.TO_DO}</option>
                <option value="IN_PROGRESS">{TASK_STATUS_LABELS.IN_PROGRESS}</option>
                <option value="COMPLETED">{TASK_STATUS_LABELS.COMPLETED}</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label
              htmlFor="task-duedate"
              className="block text-xs font-semibold text-[#1A1C18] mb-1"
            >
              Due Date <span className="text-[#86736D] font-normal">(optional)</span>
            </label>
            <input
              id="task-duedate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#D8C2BB] bg-white text-sm text-[#1A1C18] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/20"
            />
          </div>

          {/* Assignee & Event Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label
                htmlFor="task-assignee"
                className="block text-xs font-semibold text-[#1A1C18] mb-1"
              >
                Assignee
              </label>
              <select
                id="task-assignee"
                value={assignedMemberId}
                onChange={(e) => setAssignedMemberId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8C2BB] bg-white text-xs text-[#1A1C18] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/20"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.user.displayName?.trim() || m.user.email} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Related Event */}
            <div>
              <label
                htmlFor="task-event"
                className="block text-xs font-semibold text-[#1A1C18] mb-1"
              >
                Related Ceremony
              </label>
              <select
                id="task-event"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D8C2BB] bg-white text-xs text-[#1A1C18] focus:outline-hidden focus:ring-2 focus:ring-[#8D493A]/20"
              >
                <option value="">General Wedding Task</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-[#EAE6E1] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-[#D8C2BB] text-xs font-semibold text-[#716B64] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#8D493A] hover:bg-[#723B2F] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
