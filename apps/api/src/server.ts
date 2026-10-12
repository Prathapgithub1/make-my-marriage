import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const server = createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Make My Marriage API listening');
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close((error) => {
      if (error) {
        logger.error({ err: error }, 'API shutdown failed');
        process.exitCode = 1;
        return;
      }

      logger.info('API server stopped');
    });
  });
}
