import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3104),
  API_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  WEB_ORIGIN: z.string().url().default('http://localhost:1234'),
  DATABASE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SESSION_SECRET: z.string().min(32).optional(),
  CSRF_SECRET: z.string().min(32).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  APP_BASE_URL: z.string().url().optional(),
});

const parsed = envSchema.parse(process.env);

const effectivePort = parsed.API_PORT ?? parsed.PORT;
const effectiveFromEmail = parsed.EMAIL_FROM ?? parsed.RESEND_FROM_EMAIL;

export const env = {
  ...parsed,
  PORT: effectivePort,
  EMAIL_FROM: effectiveFromEmail,
  RESEND_FROM_EMAIL: effectiveFromEmail,
};
