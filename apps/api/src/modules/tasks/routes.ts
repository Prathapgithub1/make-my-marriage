import { Router, type Request, type Response } from 'express';
import { prisma } from '../../infrastructure/database/pool';
import { AppError } from '../../shared/app-error';
import { parseCookies, SESSION_COOKIE } from '../auth/security';
import {
  authService as defaultAuthService,
  getRequestId,
  requireCsrf,
  requireSameOrigin,
  type AuthOperations,
} from '../auth/routes';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  listTasksQuerySchema,
} from './schemas';
import { createTasksService, type TasksServiceOperations } from './service';

const defaultTasksService = createTasksService(prisma);

async function requireAuthUser(req: Request, auth: AuthOperations) {
  const sessionToken = parseCookies(req.header('Cookie'))[SESSION_COOKIE];
  const user = await auth.authenticate(sessionToken);
  if (!user) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  }
  return user;
}

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export function createTasksRouter(
  service: TasksServiceOperations = defaultTasksService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  // POST /api/v1/tasks - Create task
  router.post('/', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = createTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const field = issue.path[0];
          if (typeof field === 'string') acc[field] = issue.message;
          return acc;
        }, {});
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Check your task details and try again.',
          details,
        );
      }

      const task = await service.createTask(user.id, parsed.data);
      res.status(201).json({
        data: task,
        requestId: getRequestId(res),
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/tasks - List tasks with filters and pagination
  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = listTasksQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const details = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
          const field = issue.path[0];
          if (typeof field === 'string') acc[field] = issue.message;
          return acc;
        }, {});
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters.', details);
      }

      const result = await service.listTasks(user.id, parsed.data);
      res.json({
        ...result,
        requestId: getRequestId(res),
      });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/v1/tasks/:taskId - Read task details
  router.get('/:taskId', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const taskId = getParam(req.params.taskId);
      const task = await service.getTaskById(user.id, taskId);
      res.json({
        data: task,
        requestId: getRequestId(res),
      });
    } catch (err) {
      next(err);
    }
  });

  // PATCH /api/v1/tasks/:taskId - Update task
  router.patch(
    '/:taskId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const taskId = getParam(req.params.taskId);
        const parsed = updateTaskSchema.safeParse(req.body);
        if (!parsed.success) {
          const details = parsed.error.issues.reduce<Record<string, string>>((acc, issue) => {
            const field = issue.path[0];
            if (typeof field === 'string') acc[field] = issue.message;
            return acc;
          }, {});
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Check your task updates and try again.',
            details,
          );
        }

        const task = await service.updateTask(user.id, taskId, parsed.data);
        res.json({
          data: task,
          requestId: getRequestId(res),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // PATCH /api/v1/tasks/:taskId/status - Update task status
  router.patch(
    '/:taskId/status',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const taskId = getParam(req.params.taskId);
        const parsed = updateTaskStatusSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status value provided.');
        }

        const task = await service.updateTaskStatus(user.id, taskId, parsed.data.status);
        res.json({
          data: task,
          requestId: getRequestId(res),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/v1/tasks/:taskId - Delete task
  router.delete(
    '/:taskId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const taskId = getParam(req.params.taskId);
        const result = await service.deleteTask(user.id, taskId);
        res.json({
          data: result,
          requestId: getRequestId(res),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}

export const tasksRouter = createTasksRouter();
