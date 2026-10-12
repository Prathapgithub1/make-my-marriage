import { randomUUID } from 'node:crypto';
import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const requestId = String(res.getHeader('X-Request-Id') ?? randomUUID());

  res.status(200).json({
    data: { status: 'ok' },
    requestId,
  });
});
