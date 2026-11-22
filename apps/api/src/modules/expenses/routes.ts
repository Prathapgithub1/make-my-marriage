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
  createExpenseSchema,
  eventBudgetParamSchema,
  expenseIdParamSchema,
  listExpensesQuerySchema,
  recordPaymentSchema,
  updateExpenseSchema,
  upsertEventBudgetSchema,
  upsertWeddingBudgetSchema,
} from './schemas';
import { createExpensesService, type ExpensesServiceOperations } from './service';

const defaultExpensesService = createExpensesService(prisma);

async function requireAuthUser(req: Request, auth: AuthOperations) {
  const sessionToken = parseCookies(req.header('Cookie'))[SESSION_COOKIE];
  const user = await auth.authenticate(sessionToken);
  if (!user) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  }
  return user;
}

function formatZodDetails(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return issues.reduce<Record<string, string>>((acc, issue) => {
    const field = issue.path[0];
    if (typeof field === 'string') {
      acc[field] = issue.message;
    }
    return acc;
  }, {});
}

export function createExpensesRouter(
  service: ExpensesServiceOperations = defaultExpensesService,
  auth: AuthOperations = defaultAuthService,
) {
  const router = Router();

  // GET /api/v1/expenses/summary - Summary & category/event breakdown
  router.get('/summary', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const analytics = await service.getSummaryAndAnalytics(user.id);
      res.json({
        data: analytics,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/v1/expenses/analytics - Full analytics breakdown
  router.get('/analytics', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const analytics = await service.getSummaryAndAnalytics(user.id);
      res.json({
        data: analytics,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/v1/expenses/budget - Overall wedding budget & event allocations
  router.get('/budget', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const overview = await service.getBudgetOverview(user.id);
      res.json({
        data: overview,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // PUT /api/v1/expenses/budget - Upsert overall wedding budget
  router.put(
    '/budget',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const parsed = upsertWeddingBudgetSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Check your budget details and try again.',
            formatZodDetails(parsed.error.issues),
          );
        }

        const budget = await service.upsertWeddingBudget(user.id, parsed.data);
        res.json({
          data: budget,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // PUT /api/v1/expenses/budget/events/:eventId - Upsert event-specific budget allocation
  router.put(
    '/budget/events/:eventId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const paramParsed = eventBudgetParamSchema.safeParse(req.params);
        if (!paramParsed.success) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Invalid event ID.');
        }

        const parsed = upsertEventBudgetSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Check your event budget amount and try again.',
            formatZodDetails(parsed.error.issues),
          );
        }

        const eventBudget = await service.upsertEventBudget(
          user.id,
          paramParsed.data.eventId,
          parsed.data,
        );
        res.json({
          data: eventBudget,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // DELETE /api/v1/expenses/budget/events/:eventId - Remove event-specific budget allocation
  router.delete(
    '/budget/events/:eventId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const paramParsed = eventBudgetParamSchema.safeParse(req.params);
        if (!paramParsed.success) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Invalid event ID.');
        }

        const result = await service.deleteEventBudget(user.id, paramParsed.data.eventId);
        res.json({
          data: result,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // GET /api/v1/expenses - List paginated expenses with filters & search
  router.get('/', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = listExpensesQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid query parameters.',
          formatZodDetails(parsed.error.issues),
        );
      }

      const result = await service.listExpenses(user.id, parsed.data);
      res.json({
        data: result.expenses,
        pagination: result.pagination,
        totals: result.totals,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/v1/expenses - Create a new expense
  router.post('/', requireSameOrigin, requireCsrf, async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const parsed = createExpenseSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Check your expense details and try again.',
          formatZodDetails(parsed.error.issues),
        );
      }

      const expense = await service.createExpense(user.id, parsed.data);
      res.status(201).json({
        data: expense,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/v1/expenses/:expenseId - Get single expense details
  router.get('/:expenseId', async (req: Request, res: Response, next) => {
    try {
      const user = await requireAuthUser(req, auth);
      const paramParsed = expenseIdParamSchema.safeParse(req.params);
      if (!paramParsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid expense ID.');
      }

      const expense = await service.getExpense(user.id, paramParsed.data.expenseId);
      res.json({
        data: expense,
        requestId: getRequestId(res),
      });
    } catch (error) {
      next(error);
    }
  });

  // PATCH /api/v1/expenses/:expenseId - Update expense details
  router.patch(
    '/:expenseId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const paramParsed = expenseIdParamSchema.safeParse(req.params);
        if (!paramParsed.success) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Invalid expense ID.');
        }

        const parsed = updateExpenseSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Check your expense details and try again.',
            formatZodDetails(parsed.error.issues),
          );
        }

        const expense = await service.updateExpense(
          user.id,
          paramParsed.data.expenseId,
          parsed.data,
        );
        res.json({
          data: expense,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // PATCH /api/v1/expenses/:expenseId/payment - Record or update paid amount
  router.patch(
    '/:expenseId/payment',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const paramParsed = expenseIdParamSchema.safeParse(req.params);
        if (!paramParsed.success) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Invalid expense ID.');
        }

        const parsed = recordPaymentSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            'Check your payment details and try again.',
            formatZodDetails(parsed.error.issues),
          );
        }

        const expense = await service.recordPayment(
          user.id,
          paramParsed.data.expenseId,
          parsed.data,
        );
        res.json({
          data: expense,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  // DELETE /api/v1/expenses/:expenseId - Delete an expense
  router.delete(
    '/:expenseId',
    requireSameOrigin,
    requireCsrf,
    async (req: Request, res: Response, next) => {
      try {
        const user = await requireAuthUser(req, auth);
        const paramParsed = expenseIdParamSchema.safeParse(req.params);
        if (!paramParsed.success) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Invalid expense ID.');
        }

        const result = await service.deleteExpense(user.id, paramParsed.data.expenseId);
        res.json({
          data: result,
          requestId: getRequestId(res),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}

export const expensesRouter = createExpensesRouter();
