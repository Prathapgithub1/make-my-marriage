import { z } from 'zod';
import { TaskStatus, TaskPriority } from '../../generated/prisma/client';

export const taskStatusSchema = z.enum([
  TaskStatus.TO_DO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
]);

export const taskPrioritySchema = z.enum([
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
]);

function isValidIsoDate(val: string | null | undefined): boolean {
  if (!val) return true;
  const d = new Date(val);
  return !isNaN(d.getTime());
}

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title cannot be blank')
    .max(200, 'Task title cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional()
    .nullable(),
  status: taskStatusSchema.default(TaskStatus.TO_DO),
  priority: taskPrioritySchema.default(TaskPriority.MEDIUM),
  dueDate: z
    .string()
    .trim()
    .refine(isValidIsoDate, { message: 'Due date must be a valid date' })
    .optional()
    .nullable(),
  eventId: z.string().uuid('Invalid event ID').optional().nullable(),
  assignedMemberId: z.string().uuid('Invalid member ID').optional().nullable(),
});

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Task title cannot be blank')
      .max(200, 'Task title cannot exceed 200 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional()
      .nullable(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: z
      .string()
      .trim()
      .refine(isValidIsoDate, { message: 'Due date must be a valid date' })
      .optional()
      .nullable(),
    eventId: z.string().uuid('Invalid event ID').optional().nullable(),
    assignedMemberId: z.string().uuid('Invalid member ID').optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema,
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .union([z.literal('ALL'), taskStatusSchema])
    .optional()
    .transform((v) => (v === 'ALL' ? undefined : v)),
  priority: z
    .union([z.literal('ALL'), taskPrioritySchema])
    .optional()
    .transform((v) => (v === 'ALL' ? undefined : v)),
  eventId: z.string().optional(),
  assignedMemberId: z.string().optional(),
  mine: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === 'true' || v === true),
  search: z.string().trim().optional(),
  sortBy: z.enum(['dueDate', 'createdAt', 'priority', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

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
