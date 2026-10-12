import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  WEB_ORIGIN: z.string().url().default('http://localhost:1234'),
});

export const env = envSchema.parse(process.env);
