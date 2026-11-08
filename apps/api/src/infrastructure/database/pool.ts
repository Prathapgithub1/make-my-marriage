import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { env } from '../../config/env';

function getConnectionString(): string | undefined {
  if (!env.DATABASE_URL) return undefined;

  const connectionUrl = new URL(env.DATABASE_URL);

  // Remove Prisma-specific query parameters.
  connectionUrl.searchParams.delete('schema');

  // SSL is configured explicitly below.
  connectionUrl.searchParams.delete('sslmode');

  return connectionUrl.toString();
}

const connectionString = getConnectionString();

export const databasePool = connectionString
  ? new Pool({
      connectionString,
      ssl: {
        ca: readFileSync(resolve(__dirname, '../../../../../global-bundle.pem'), 'utf8'),
        rejectUnauthorized: true,
      },
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
