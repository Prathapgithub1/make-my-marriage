import type { PrismaClient, Prisma } from '../../generated/prisma/client';
import { TaskStatus, TaskPriority } from '../../generated/prisma/client';
import { AppError } from '../../shared/app-error';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
  TaskSummary,
  TasksListResponse,
} from './schemas';

export interface TasksServiceOperations {
  createTask(userId: string, input: CreateTaskInput): Promise<TaskSummary>;
  listTasks(userId: string, query: ListTasksQuery): Promise<TasksListResponse>;
  getTaskById(userId: string, taskId: string): Promise<TaskSummary>;
  updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<TaskSummary>;
  updateTaskStatus(userId: string, taskId: string, status: TaskStatus): Promise<TaskSummary>;
  deleteTask(
    userId: string,
    taskId: string,
  ): Promise<{ success: true; id: string; message: string }>;
}

export function formatTaskSummary(task: {
  id: string;
  weddingId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  eventId: string | null;
  assignedMemberId: string | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  event?: { id: string; name: string } | null;
  assignedMember?: {
    id: string;
    role: string;
    user?: { id: string; displayName: string | null; email: string } | null;
  } | null;
}): TaskSummary {
  const isOverdue =
    task.status !== TaskStatus.COMPLETED &&
    task.dueDate !== null &&
    new Date(task.dueDate).getTime() < Date.now();

  return {
    id: task.id,
    weddingId: task.weddingId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    eventId: task.eventId,
    event: task.event ? { id: task.event.id, name: task.event.name } : null,
    assignedMemberId: task.assignedMemberId,
    assignedMember: task.assignedMember
      ? {
          id: task.assignedMember.id,
          role: task.assignedMember.role,
          name:
            task.assignedMember.user?.displayName?.trim() ||
            task.assignedMember.user?.email ||
            'Team Member',
          email: task.assignedMember.user?.email,
        }
      : null,
    createdByUserId: task.createdByUserId,
    isOverdue,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function createTasksService(prismaClient?: PrismaClient | null): TasksServiceOperations {
  function requireDatabase(): PrismaClient {
    if (!prismaClient) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Database client is not available.');
    }
    return prismaClient;
  }

  async function resolveCallerWorkspace(
    database: PrismaClient,
    userId: string,
  ): Promise<{ weddingId: string; membershipId: string }> {
    const membership = await database.weddingMembership.findUnique({
      where: { userId },
      select: { id: true, weddingId: true },
    });

    if (!membership) {
      throw new AppError(404, 'NOT_FOUND', 'You do not belong to a wedding workspace.');
    }

    return { weddingId: membership.weddingId, membershipId: membership.id };
  }

  async function validateAssociations(
    database: PrismaClient,
    weddingId: string,
    assignedMemberId?: string | null,
    eventId?: string | null,
  ) {
    if (assignedMemberId) {
      const member = await database.weddingMembership.findFirst({
        where: { id: assignedMemberId, weddingId },
      });
      if (!member) {
        throw new AppError(
          400,
          'INVALID_ASSOCIATION',
          'Assigned member does not belong to this wedding workspace.',
        );
      }
    }

    if (eventId) {
      const event = await database.event.findFirst({
        where: { id: eventId, weddingId },
      });
      if (!event) {
        throw new AppError(
          400,
          'INVALID_ASSOCIATION',
          'Related event does not belong to this wedding workspace.',
        );
      }
    }
  }

  return {
    async createTask(userId: string, input: CreateTaskInput): Promise<TaskSummary> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      await validateAssociations(database, weddingId, input.assignedMemberId, input.eventId);

      const isCompleted = input.status === TaskStatus.COMPLETED;
      const completedAt = isCompleted ? new Date() : null;

      const created = await database.task.create({
        data: {
          weddingId,
          title: input.title,
          description: input.description ?? null,
          status: input.status,
          priority: input.priority,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          completedAt,
          eventId: input.eventId ?? null,
          assignedMemberId: input.assignedMemberId ?? null,
          createdByUserId: userId,
        },
        include: {
          event: { select: { id: true, name: true } },
          assignedMember: {
            select: {
              id: true,
              role: true,
              user: { select: { id: true, displayName: true, email: true } },
            },
          },
        },
      });

      return formatTaskSummary(created);
    },

    async listTasks(userId: string, query: ListTasksQuery): Promise<TasksListResponse> {
      const database = requireDatabase();
      const { weddingId, membershipId } = await resolveCallerWorkspace(database, userId);

      const where: Prisma.TaskWhereInput = { weddingId };

      if (query.mine) {
        where.assignedMemberId = membershipId;
      } else if (query.assignedMemberId) {
        if (query.assignedMemberId === 'none') {
          where.assignedMemberId = null;
        } else {
          where.assignedMemberId = query.assignedMemberId;
        }
      }

      if (query.eventId) {
        if (query.eventId === 'none') {
          where.eventId = null;
        } else {
          where.eventId = query.eventId;
        }
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.priority) {
        where.priority = query.priority;
      }

      if (query.search) {
        where.title = {
          contains: query.search,
          mode: 'insensitive',
        };
      }

      const orderBy: Prisma.TaskOrderByWithRelationInput = {};
      if (query.sortBy === 'dueDate') {
        orderBy.dueDate = query.sortOrder;
      } else if (query.sortBy === 'priority') {
        orderBy.priority = query.sortOrder;
      } else if (query.sortBy === 'title') {
        orderBy.title = query.sortOrder;
      } else {
        orderBy.createdAt = query.sortOrder;
      }

      const [tasks, total, todoCount, inProgressCount, completedCount, overdueCount] =
        await Promise.all([
          database.task.findMany({
            where,
            orderBy: [orderBy, { id: 'desc' }],
            skip: (query.page - 1) * query.limit,
            take: query.limit,
            include: {
              event: { select: { id: true, name: true } },
              assignedMember: {
                select: {
                  id: true,
                  role: true,
                  user: { select: { id: true, displayName: true, email: true } },
                },
              },
            },
          }),
          database.task.count({ where }),
          database.task.count({ where: { weddingId, status: TaskStatus.TO_DO } }),
          database.task.count({ where: { weddingId, status: TaskStatus.IN_PROGRESS } }),
          database.task.count({ where: { weddingId, status: TaskStatus.COMPLETED } }),
          database.task.count({
            where: {
              weddingId,
              status: { not: TaskStatus.COMPLETED },
              dueDate: { lt: new Date() },
            },
          }),
        ]);

      return {
        data: tasks.map(formatTaskSummary),
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / query.limit)),
        },
        summary: {
          total: todoCount + inProgressCount + completedCount,
          todo: todoCount,
          inProgress: inProgressCount,
          completed: completedCount,
          overdue: overdueCount,
        },
      };
    },

    async getTaskById(userId: string, taskId: string): Promise<TaskSummary> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const task = await database.task.findFirst({
        where: { id: taskId, weddingId },
        include: {
          event: { select: { id: true, name: true } },
          assignedMember: {
            select: {
              id: true,
              role: true,
              user: { select: { id: true, displayName: true, email: true } },
            },
          },
        },
      });

      if (!task) {
        throw new AppError(404, 'NOT_FOUND', 'Task not found.');
      }

      return formatTaskSummary(task);
    },

    async updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<TaskSummary> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const existing = await database.task.findFirst({
        where: { id: taskId, weddingId },
      });

      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Task not found.');
      }

      await validateAssociations(database, weddingId, input.assignedMemberId, input.eventId);

      const data: Prisma.TaskUpdateInput = {};
      if (input.title !== undefined) data.title = input.title;
      if (input.description !== undefined) data.description = input.description;
      if (input.priority !== undefined) data.priority = input.priority;
      if (input.dueDate !== undefined) {
        data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
      }
      if (input.eventId !== undefined) {
        data.event = input.eventId ? { connect: { id: input.eventId } } : { disconnect: true };
      }
      if (input.assignedMemberId !== undefined) {
        data.assignedMember = input.assignedMemberId
          ? { connect: { id: input.assignedMemberId } }
          : { disconnect: true };
      }

      if (input.status !== undefined) {
        data.status = input.status;
        if (input.status === TaskStatus.COMPLETED && existing.status !== TaskStatus.COMPLETED) {
          data.completedAt = new Date();
        } else if (
          input.status !== TaskStatus.COMPLETED &&
          existing.status === TaskStatus.COMPLETED
        ) {
          data.completedAt = null;
        }
      }

      const updated = await database.task.update({
        where: { id: taskId },
        data,
        include: {
          event: { select: { id: true, name: true } },
          assignedMember: {
            select: {
              id: true,
              role: true,
              user: { select: { id: true, displayName: true, email: true } },
            },
          },
        },
      });

      return formatTaskSummary(updated);
    },

    async updateTaskStatus(
      userId: string,
      taskId: string,
      status: TaskStatus,
    ): Promise<TaskSummary> {
      return this.updateTask(userId, taskId, { status });
    },

    async deleteTask(
      userId: string,
      taskId: string,
    ): Promise<{ success: true; id: string; message: string }> {
      const database = requireDatabase();
      const { weddingId } = await resolveCallerWorkspace(database, userId);

      const existing = await database.task.findFirst({
        where: { id: taskId, weddingId },
      });

      if (!existing) {
        throw new AppError(404, 'NOT_FOUND', 'Task not found.');
      }

      await database.task.delete({
        where: { id: taskId },
      });

      return {
        success: true,
        id: taskId,
        message: 'Task deleted successfully.',
      };
    },
  };
}
