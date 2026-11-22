import { createApp } from './app.js';
import { config } from './config.js';
import { prisma } from './db.js';
import { logger } from './logger.js';
import { startOutboxWorker } from './notifications/outbox-worker.js';

const app = createApp();

// In Express 5 this callback also receives an error, e.g. when the port is already taken
const server = app.listen(config.PORT, (error) => {
  if (error) {
    logger.error(`Nie udało się uruchomić API na porcie ${config.PORT}: ${error.message}`);
    process.exit(1);
  }
  logger.info(`API działa na http://localhost:${config.PORT} (Swagger: /api/docs)`);
});

// The worker sends e-mails in the background (OUTBOX_ENABLED=false turns it off, e.g. in tests)
let stopOutboxWorker = null;
if (config.OUTBOX_ENABLED) {
  stopOutboxWorker = startOutboxWorker();
  logger.info('Worker powiadomień uruchomiony (co 10 s)');
}

function shutdown() {
  logger.info('Zamykanie API...');
  if (stopOutboxWorker) {
    stopOutboxWorker();
  }
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

// Ctrl+C in the terminal (SIGINT) or a stop signal from the system (SIGTERM)
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
