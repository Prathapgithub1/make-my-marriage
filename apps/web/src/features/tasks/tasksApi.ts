import { apiRequest } from '../../lib/api-client';

export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskSummary {
  id: string;
  weddingId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  eventId: string | null;
  event: {
    id: string;
    name: string;
  } | null;
  assignedMemberId: string | null;
  assignedMember: {
    id: string;
    role: string;
    name: string;
    email?: string;
  } | null;
  createdByUserId: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TasksListResponse {
  data: TaskSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
}

export interface ListTasksParams {
  page?: number;
  limit?: number;
  status?: TaskStatus | 'ALL';
  priority?: TaskPriority | 'ALL';
  eventId?: string;
  assignedMemberId?: string;
  mine?: boolean;
  search?: string;
  sortBy?: 'dueDate' | 'createdAt' | 'priority' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  eventId?: string | null;
  assignedMemberId?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  eventId?: string | null;
  assignedMemberId?: string | null;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TO_DO: 'To Do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export const TASK_STATUS_STYLES: Record<
  TaskStatus,
  { bg: string; text: string; dot: string; border: string }
> = {
  TO_DO: {
    bg: 'bg-[#F4F2EE]',
    text: 'text-[#716B64]',
    dot: 'bg-[#8C827A]',
    border: 'border-[#EAE6E1]',
  },
  IN_PROGRESS: {
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#1D4ED8]',
    dot: 'bg-[#3B82F6]',
    border: 'border-[#BFDBFE]',
  },
  COMPLETED: {
    bg: 'bg-[#EDF7EE]',
    text: 'text-[#2E7D32]',
    dot: 'bg-[#4CAF50]',
    border: 'border-[#C8E6C9]',
  },
};

export const TASK_PRIORITY_STYLES: Record<
  TaskPriority,
  { bg: string; text: string; border: string; label: string }
> = {
  HIGH: {
    bg: 'bg-[#FEF0F0]',
    text: 'text-[#D32F2F]',
    border: 'border-[#F8D7DA]',
    label: 'HIGH',
  },
  MEDIUM: {
    bg: 'bg-[#FEF6E6]',
    text: 'text-[#B7791F]',
    border: 'border-[#FDE8C0]',
    label: 'MED',
  },
  LOW: {
    bg: 'bg-[#EDF7EE]',
    text: 'text-[#2E7D32]',
    border: 'border-[#C8E6C9]',
    label: 'LOW',
  },
};

export async function listTasks(params: ListTasksParams = {}): Promise<TasksListResponse> {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.priority && params.priority !== 'ALL') query.set('priority', params.priority);
  if (params.eventId) query.set('eventId', params.eventId);
  if (params.assignedMemberId) query.set('assignedMemberId', params.assignedMemberId);
  if (params.mine !== undefined) query.set('mine', String(params.mine));
  if (params.search) query.set('search', params.search);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const qs = query.toString();
  const res = await apiRequest<{
    data: TaskSummary[];
    pagination: TasksListResponse['pagination'];
    summary: TasksListResponse['summary'];
  }>(`/tasks${qs ? `?${qs}` : ''}`);

  return {
    data: res.data ?? [],
    pagination: res.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 },
    summary: res.summary ?? { total: 0, todo: 0, inProgress: 0, completed: 0, overdue: 0 },
  };
}

export async function getTaskById(taskId: string): Promise<TaskSummary> {
  const res = await apiRequest<{ data: TaskSummary }>(`/tasks/${taskId}`);
  return res.data;
}

export async function createTask(input: CreateTaskPayload): Promise<TaskSummary> {
  const res = await apiRequest<{ data: TaskSummary }>('/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateTask(taskId: string, input: UpdateTaskPayload): Promise<TaskSummary> {
  const res = await apiRequest<{ data: TaskSummary }>(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return res.data;
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<TaskSummary> {
  const res = await apiRequest<{ data: TaskSummary }>(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data;
}

export async function deleteTask(
  taskId: string,
): Promise<{ success: boolean; id: string; message: string }> {
  const res = await apiRequest<{ data: { success: boolean; id: string; message: string } }>(
    `/tasks/${taskId}`,
    {
      method: 'DELETE',
    },
  );
  return res.data;
}

export interface TaskDueDateInfo {
  text: string;
  state: 'none' | 'completed' | 'overdue' | 'due_soon' | 'upcoming';
  badgeLabel?: string;
  className: string;
  badgeClassName?: string;
}

export function getTaskDueDateInfo(dueDate: string | null, status: TaskStatus): TaskDueDateInfo {
  if (!dueDate) {
    return {
      text: 'No due date',
      state: 'none',
      className: 'text-[#A09890] italic',
    };
  }

  const d = new Date(dueDate);
  if (isNaN(d.getTime())) {
    return {
      text: 'Invalid date',
      state: 'none',
      className: 'text-[#A09890]',
    };
  }

  const formattedDate = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // Completed tasks are never marked as overdue
  if (status === 'COMPLETED') {
    return {
      text: formattedDate,
      state: 'completed',
      className: 'text-[#86736D]',
    };
  }

  // Calculate day difference relative to start of today in local date
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetDayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((targetDayStart - todayStart) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    return {
      text: formattedDate,
      state: 'overdue',
      badgeLabel: daysOverdue === 1 ? '1 day overdue' : `${daysOverdue} days overdue`,
      className: 'text-[#C0392B] font-medium',
      badgeClassName:
        'bg-[#FDF2F2] text-[#C0392B] border border-[#FADBD8] font-semibold text-[10px] px-1.5 py-0.5 rounded',
    };
  }

  if (diffDays <= 3) {
    const soonLabel =
      diffDays === 0 ? 'Due Today' : diffDays === 1 ? 'Due Tomorrow' : `Due in ${diffDays}d`;
    return {
      text: formattedDate,
      state: 'due_soon',
      badgeLabel: soonLabel,
      className: 'text-[#B7791F] font-medium',
      badgeClassName:
        'bg-[#FEF9E7] text-[#B7791F] border border-[#FCF3CF] font-semibold text-[10px] px-1.5 py-0.2 rounded',
    };
  }

  return {
    text: formattedDate,
    state: 'upcoming',
    className: 'text-[#716B64]',
  };
}
