import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { checkDatabaseConnection, closeDatabaseConnection } from './infrastructure/database/pool';

const server = createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Make My Marriage API listening');
  void checkDatabaseConnection().then(
    () => logger.info('PostgreSQL connection established'),
    (error: unknown) => {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : 'DATABASE_UNAVAILABLE';
      logger.error({ code }, 'PostgreSQL connection failed');
    },
  );
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close((error) => {
      if (error) {
        logger.error({ err: error }, 'API shutdown failed');
        process.exitCode = 1;
        return;
      }

      void closeDatabaseConnection().then(
        () => logger.info('API server and database pool stopped'),
        () => {
          logger.error('Database pool shutdown failed');
          process.exitCode = 1;
        },
      );
    });
  });
}
