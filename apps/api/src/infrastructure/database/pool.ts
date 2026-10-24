import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { env } from '../../config/env';

function getConnectionString(): string | undefined {
  if (!env.DATABASE_URL) return undefined;

  // `schema` is Prisma-specific and must not be sent as a PostgreSQL startup option.
  const connectionUrl = new URL(env.DATABASE_URL);
  connectionUrl.searchParams.delete('schema');
  return connectionUrl.toString();
}

const connectionString = getConnectionString();

export const databasePool = connectionString
  ? new Pool({
      connectionString,
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
