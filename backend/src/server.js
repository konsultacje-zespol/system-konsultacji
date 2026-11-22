import { createApp } from './app.js';
import { config } from './config.js';
import { prisma } from './db.js';
import { logger } from './logger.js';

const app = createApp();

// In Express 5 this callback also receives an error, e.g. when the port is already taken
const server = app.listen(config.PORT, (error) => {
  if (error) {
    logger.error(`Nie udało się uruchomić API na porcie ${config.PORT}: ${error.message}`);
    process.exit(1);
  }
  logger.info(`API działa na http://localhost:${config.PORT} (Swagger: /api/docs)`);
});

// Sprint 2 (S2-BE2-1): start the outbox worker here, only when config.OUTBOX_ENABLED is true

function shutdown() {
  logger.info('Zamykanie API...');
  // Sprint 2 (S2-BE2-1): stop the outbox worker here
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

// Ctrl+C in the terminal (SIGINT) or a stop signal from the system (SIGTERM)
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
