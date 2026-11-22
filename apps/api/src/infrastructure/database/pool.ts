import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool, type PoolConfig } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { env } from '../../config/env';

function getDatabaseConfig(): { connectionString?: string; ssl?: PoolConfig['ssl'] } {
  if (!env.DATABASE_URL) return {};

  const connectionUrl = new URL(env.DATABASE_URL);
  const sslMode = connectionUrl.searchParams.get('sslmode');
  const isLocal = connectionUrl.hostname === 'localhost' || connectionUrl.hostname === '127.0.0.1';

  // Remove Prisma-specific query parameters.
  connectionUrl.searchParams.delete('schema');
  connectionUrl.searchParams.delete('sslmode');

  const caPath = resolve(__dirname, '../../../../../global-bundle.pem');
  const shouldUseSsl =
    !isLocal && (sslMode === 'require' || connectionUrl.hostname.includes('rds.amazonaws.com'));

  let ssl: PoolConfig['ssl'] = undefined;
  if (shouldUseSsl && existsSync(caPath)) {
    ssl = {
      ca: readFileSync(caPath, 'utf8'),
      rejectUnauthorized: true,
    };
  }

  return {
    connectionString: connectionUrl.toString(),
    ssl,
  };
}

const dbConfig = getDatabaseConfig();

export const databasePool = dbConfig.connectionString
  ? new Pool({
      connectionString: dbConfig.connectionString,
      ssl: dbConfig.ssl,
      max: 10,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
    })
  : undefined;

const prismaAdapter = databasePool ? new PrismaPg(databasePool) : undefined;

export const prisma = prismaAdapter ? new PrismaClient({ adapter: prismaAdapter }) : undefined;

export async function checkDatabaseConnection(): Promise<void> {
  if (!prisma) {
    throw new Error('DATABASE_URL is not configured.');
  }

  await prisma.$queryRaw`SELECT 1`;
}

export async function closeDatabaseConnection(): Promise<void> {
  await prisma?.$disconnect();
  await databasePool?.end();
}
