import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { checkDatabaseConnection } from '../../infrastructure/database/pool';

export const healthRouter = Router();
export const databaseHealthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const requestId = String(res.getHeader('X-Request-Id') ?? randomUUID());

  res.status(200).json({
    data: { status: 'ok' },
    requestId,
  });
});

databaseHealthRouter.get('/', async (req, res) => {
  const requestId = String(res.getHeader('X-Request-Id') ?? randomUUID());

  try {
    await checkDatabaseConnection();
    res.status(200).json({ data: { status: 'ok', database: 'connected' }, requestId });
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String(error.code)
        : 'DATABASE_UNAVAILABLE';
    req.log.warn({ code }, 'Database health check failed');
    res.status(503).json({
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database connection is unavailable.' },
      requestId,
    });
  }
});
