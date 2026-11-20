import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// Ensure .env is resolved regardless of whether the process was started from the root or apps/api
const candidateEnvPaths = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../.env'),
  resolve(process.cwd(), '../../.env'),
  resolve(__dirname, '../../../../.env'),
  resolve(__dirname, '../../../.env'),
];

for (const envPath of candidateEnvPaths) {
  if (existsSync(envPath)) {
    loadDotenv({ path: envPath });
    break;
  }
}

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
  API_BASE_URL: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  AWS_S3_BUCKET_NAME: z.string().default('make-my-marriage-gallery-dev-rana-2026'),
  AWS_S3_PUBLIC_BASE_URL: z.string().url().optional(),
  AWS_S3_PRESIGNED_URL_EXPIRY: z.coerce.number().int().min(30).max(86400).default(300),
  AWS_S3_PRESIGNED_EXPIRES_SECONDS: z.coerce.number().int().min(30).max(86400).optional(),
  AWS_S3_UPLOAD_MAX_SIZE_MB: z.coerce.number().int().min(1).default(100),
  AWS_S3_UPLOAD_MAX_SIZE_BYTES: z.coerce.number().int().min(1024).optional(),
});

const parsed = envSchema.parse(process.env);

const effectivePort = parsed.API_PORT ?? parsed.PORT;
const effectiveFromEmail = parsed.EMAIL_FROM ?? parsed.RESEND_FROM_EMAIL;
const effectivePresignedExpiry = parsed.AWS_S3_PRESIGNED_EXPIRES_SECONDS ?? parsed.AWS_S3_PRESIGNED_URL_EXPIRY;
const effectiveMaxUploadSizeBytes =
  parsed.AWS_S3_UPLOAD_MAX_SIZE_BYTES ?? (parsed.AWS_S3_UPLOAD_MAX_SIZE_MB * 1024 * 1024);

export const env = {
  ...parsed,
  PORT: effectivePort,
  EMAIL_FROM: effectiveFromEmail,
  RESEND_FROM_EMAIL: effectiveFromEmail,
  AWS_S3_PRESIGNED_EXPIRES_SECONDS: effectivePresignedExpiry,
  AWS_S3_UPLOAD_MAX_SIZE_BYTES: effectiveMaxUploadSizeBytes,
};
