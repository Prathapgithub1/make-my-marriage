import dns from 'node:dns';
import { randomUUID } from 'node:crypto';

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './config/logger';
import { corsMiddleware } from './middleware/cors';
import { databaseHealthRouter, healthRouter } from './modules/health/routes';
import { authRouter } from './modules/auth/routes';
import { apiDocsRouter } from './modules/docs/routes';
import { weddingRouter, dashboardRouter } from './modules/wedding/routes';
import {
  membersRouter,
  publicMemberInvitationsRouter,
  memberInvitationsRouter,
} from './modules/members/routes';
import { eventsRouter } from './modules/events/routes';
import { tasksRouter } from './modules/tasks/routes';
import { guestsRouter, publicInvitationsRouter } from './modules/guests/routes';
import { vendorsRouter } from './modules/vendors/routes';
import { expensesRouter } from './modules/expenses/routes';
import { websiteRouter, publicWebsiteRouter } from './modules/website/routes';
import { galleryRouter } from './modules/gallery/routes';
import { AppError } from './shared/app-error';

export function createApp(applicationLogger: Logger = logger) {
  const app = express();

  app.disable('x-powered-by');
  app.set('etag', false);
  if (env.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.use(
    pinoHttp({
      logger: applicationLogger,
      genReqId: (_req, res) => {
        const requestId = randomUUID();
        res.setHeader('X-Request-Id', requestId);
        return requestId;
      },
      serializers: {
        req: (req) => ({ id: req.id, method: req.method }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );
  app.use(corsMiddleware(env.WEB_ORIGIN));
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));

  if (env.NODE_ENV !== 'production') app.use('/api-docs', apiDocsRouter);

  const apiRouter = express.Router();
  apiRouter.use('/health', healthRouter);
  apiRouter.use('/health/database', databaseHealthRouter);
  apiRouter.use('/auth', authRouter);
  apiRouter.use('/wedding', weddingRouter);
  apiRouter.use('/wedding/dashboard', dashboardRouter);
  apiRouter.use('/dashboard', dashboardRouter);
  apiRouter.use('/members', membersRouter);
  apiRouter.use('/events', eventsRouter);
  apiRouter.use('/tasks', tasksRouter);
  apiRouter.use('/guests', guestsRouter);
  apiRouter.use('/vendors', vendorsRouter);
  apiRouter.use('/expenses', expensesRouter);
  apiRouter.use('/gallery', galleryRouter);
  apiRouter.use('/wedding/gallery', galleryRouter);
  apiRouter.use('/website', websiteRouter);
  apiRouter.use('/wedding/website', websiteRouter);
  apiRouter.use('/public/weddings', publicWebsiteRouter);
  apiRouter.use('/public/invitations', publicInvitationsRouter);
  apiRouter.use('/invitations', publicInvitationsRouter);
  apiRouter.use('/public/member-invitations', publicMemberInvitationsRouter);
  apiRouter.use('/member-invitations', memberInvitationsRouter);
  app.use('/api/v1', apiRouter);

  app.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found.')));

  const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
    void next;
    const appError = error instanceof AppError ? error : undefined;
    const statusCode = appError?.statusCode ?? 500;
    const requestId = String(res.getHeader('X-Request-Id') ?? '');

    if (statusCode >= 500) {
      const errObj = error instanceof Error ? error : new Error(String(error));
      req.log.error(
        {
          err: errObj,
          errorName: errObj.name,
          errorMessage: errObj.message,
          stack: errObj.stack,
        },
        'Request failed with 500',
      );
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const fallbackMessage =
      isDev && error instanceof Error ? error.message : 'An unexpected error occurred.';

    res.status(statusCode).json({
      error: {
        code: appError?.code ?? 'INTERNAL_ERROR',
        message: appError?.message ?? fallbackMessage,
        ...(appError?.details ? { details: appError.details } : {}),
        ...(isDev && error instanceof Error ? { debugStack: error.stack } : {}),
      },
      requestId,
    });
  };

  app.use(errorHandler);
  return app;
}
