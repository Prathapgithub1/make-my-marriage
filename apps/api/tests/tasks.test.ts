import express, { type ErrorRequestHandler } from 'express';
import request from 'supertest';
import { AppError } from '../src/shared/app-error';
import type { AuthOperations } from '../src/modules/auth/routes';
import { createTasksRouter } from '../src/modules/tasks/routes';
import type { TasksServiceOperations } from '../src/modules/tasks/service';
import type { TaskSummary, TasksListResponse } from '../src/modules/tasks/schemas';
import { TaskStatus, TaskPriority } from '../src/generated/prisma/client';
import { createCsrfToken } from '../src/modules/auth/security';

const mockUser = {
  id: 'user-organizer-1',
  email: 'organizer@example.com',
  displayName: 'Akshitha Rao',
};

const mockTask: TaskSummary = {
  id: 'task-uuid-1',
  weddingId: 'wedding-uuid-1',
  title: 'Finalize floral palette & Mandap structure',
  description: 'Coordinate with wedding florist for marigold and jasmine selection.',
  status: TaskStatus.TO_DO,
  priority: TaskPriority.HIGH,
  dueDate: '2026-11-20T10:00:00.000Z',
  completedAt: null,
  eventId: 'event-uuid-1',
  event: {
    id: 'event-uuid-1',
    name: 'Sangeet & Musical Evening',
  },
  assignedMemberId: 'membership-uuid-1',
  assignedMember: {
    id: 'membership-uuid-1',
    role: 'ADMIN',
    name: 'Akshitha Rao',
    email: 'organizer@example.com',
  },
  createdByUserId: 'user-organizer-1',
  isOverdue: false,
  createdAt: '2026-11-08T10:00:00.000Z',
  updatedAt: '2026-11-08T10:00:00.000Z',
};

const mockTasksListResponse: TasksListResponse = {
  data: [mockTask],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
  summary: {
    total: 1,
    todo: 1,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  },
};

function buildTasksApp(
  serviceOverrides: Partial<TasksServiceOperations> = {},
  authOverrides: Partial<AuthOperations> = {},
) {
  const tasksService: TasksServiceOperations = {
    createTask: jest.fn(async () => mockTask),
    listTasks: jest.fn(async () => mockTasksListResponse),
    getTaskById: jest.fn(async () => mockTask),
    updateTask: jest.fn(async () => mockTask),
    updateTaskStatus: jest.fn(async () => ({ ...mockTask, status: TaskStatus.COMPLETED })),
    deleteTask: jest.fn(async () => ({
      success: true as const,
      id: mockTask.id,
      message: 'Task deleted successfully.',
    })),
    ...serviceOverrides,
  };

  const auth: AuthOperations = {
    createCsrfToken,
    signup: jest.fn(),
    login: jest.fn(),
    authenticate: jest.fn(async (token) =>
      token === 'valid-token' || token === 'valid-session' ? mockUser : null,
    ),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    consumeRateLimit: jest.fn(async () => true),
    ...authOverrides,
  };

  const app = express();
  app.use(express.json());
  app.use('/api/v1/tasks', createTasksRouter(tasksService, auth));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
      return;
    }
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal error' } });
  };

  app.use(errorHandler);
  return { app, tasksService, auth };
}

describe('Tasks API Endpoints (/api/v1/tasks)', () => {
  const validCsrf = createCsrfToken();
  const validHeaders = {
    Cookie: `mmm_session=valid-session; mmm_csrf=${validCsrf}`,
    'X-CSRF-Token': validCsrf,
    Origin: 'http://localhost:1234',
  };

  describe('POST /api/v1/tasks (Create Task)', () => {
    it('creates a task with required title and default status/priority', async () => {
      const { app, tasksService } = buildTasksApp();

      const response = await request(app).post('/api/v1/tasks').set(validHeaders).send({
        title: 'Book catering tasting session',
      });

      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockTask);
      expect(tasksService.createTask).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          title: 'Book catering tasting session',
          status: TaskStatus.TO_DO,
          priority: TaskPriority.MEDIUM,
        }),
      );
    });

    it('rejects creation when title is empty', async () => {
      const { app } = buildTasksApp();

      const response = await request(app)
        .post('/api/v1/tasks')
        .set(validHeaders)
        .send({ title: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toHaveProperty('title');
    });

    it('rejects creation when CSRF token is missing', async () => {
      const { app } = buildTasksApp();

      const response = await request(app)
        .post('/api/v1/tasks')
        .set({ Origin: 'http://localhost:1234' })
        .send({ title: 'Test Task' });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('CSRF_REJECTED');
    });

    it('returns 401 when user is unauthenticated', async () => {
      const { app } = buildTasksApp({}, { authenticate: jest.fn(async () => null) });

      const response = await request(app)
        .post('/api/v1/tasks')
        .set(validHeaders)
        .send({ title: 'Test Task' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('GET /api/v1/tasks (List Tasks)', () => {
    it('retrieves paginated tasks with default parameters', async () => {
      const { app, tasksService } = buildTasksApp();

      const response = await request(app)
        .get('/api/v1/tasks')
        .set({ Cookie: 'mmm_session=valid-session' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.summary).toBeDefined();
      expect(tasksService.listTasks).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          page: 1,
          limit: 20,
        }),
      );
    });

    it('passes filter parameters to the service', async () => {
      const { app, tasksService } = buildTasksApp();

      const response = await request(app)
        .get('/api/v1/tasks?status=TO_DO&priority=HIGH&mine=true&search=floral')
        .set({ Cookie: 'mmm_session=valid-session' });

      expect(response.status).toBe(200);
      expect(tasksService.listTasks).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          status: TaskStatus.TO_DO,
          priority: TaskPriority.HIGH,
          mine: true,
          search: 'floral',
        }),
      );
    });
  });

  describe('GET /api/v1/tasks/:taskId (Read Task)', () => {
    it('returns task details by ID', async () => {
      const { app, tasksService } = buildTasksApp();

      const response = await request(app)
        .get('/api/v1/tasks/task-uuid-1')
        .set({ Cookie: 'mmm_session=valid-session' });

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe('task-uuid-1');
      expect(tasksService.getTaskById).toHaveBeenCalledWith(mockUser.id, 'task-uuid-1');
    });

    it('returns 404 when task is not found', async () => {
      const { app } = buildTasksApp({
        getTaskById: jest.fn(async () => {
          throw new AppError(404, 'NOT_FOUND', 'Task not found.');
        }),
      });

      const response = await request(app)
        .get('/api/v1/tasks/non-existent-task')
        .set({ Cookie: 'mmm_session=valid-session' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/v1/tasks/:taskId (Update Task)', () => {
    it('updates task status and details', async () => {
      const { app, tasksService } = buildTasksApp();

      const response = await request(app)
        .patch('/api/v1/tasks/task-uuid-1')
        .set(validHeaders)
        .send({
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.LOW,
        });

      expect(response.status).toBe(200);
      expect(tasksService.updateTask).toHaveBeenCalledWith(
        mockUser.id,
        'task-uuid-1',
        expect.objectContaining({
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.LOW,
        }),
      );
    });

    it('rejects update with empty payload', async () => {
      const { app } = buildTasksApp();

      const response = await request(app)
        .patch('/api/v1/tasks/task-uuid-1')
        .set(validHeaders)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/v1/tasks/:taskId/status (Update Task Status)', () => {
    it('quickly updates status', async () => {
      const { app, tasksService } = buildTasksApp();

      const response = await request(app)
        .patch('/api/v1/tasks/task-uuid-1/status')
        .set(validHeaders)
        .send({ status: TaskStatus.COMPLETED });

      expect(response.status).toBe(200);
      expect(tasksService.updateTaskStatus).toHaveBeenCalledWith(
        mockUser.id,
        'task-uuid-1',
        TaskStatus.COMPLETED,
      );
    });
  });

  describe('DELETE /api/v1/tasks/:taskId (Delete Task)', () => {
    it('deletes a task successfully', async () => {
      const { app, tasksService } = buildTasksApp();

      const response = await request(app).delete('/api/v1/tasks/task-uuid-1').set(validHeaders);

      expect(response.status).toBe(200);
      expect(response.body.data.success).toBe(true);
      expect(tasksService.deleteTask).toHaveBeenCalledWith(mockUser.id, 'task-uuid-1');
    });
  });
});
