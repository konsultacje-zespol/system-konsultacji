import cookieParser from 'cookie-parser';
import express from 'express';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './docs/openapi.js';
import { errorHandler, notFoundHandler } from './errors.js';
import { healthRouter } from './health/health.routes.js';
import { logger } from './logger.js';

// Builds the Express app. It does NOT call listen and does NOT start background jobs,
// so tests can use createApp() directly (server.js starts the real server).
export function createApp() {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  const api = express.Router();

  // 1) PUBLIC routes — the only ones reachable without login
  api.use(healthRouter);

  // 2) everything registered below this line requires login (the auth task adds api.use(requireAuth) here)

  app.use('/api/v1', api);

  // Always last: unknown routes and the error middleware
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
