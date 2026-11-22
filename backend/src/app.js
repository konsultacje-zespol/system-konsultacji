import { Role } from '@prisma/client';
import cookieParser from 'cookie-parser';
import express from 'express';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './docs/openapi.js';
import { authRouter, publicAuthRouter } from './auth/auth.routes.js';
import { errorHandler, notFoundHandler } from './errors.js';
import { healthRouter } from './health/health.routes.js';
import { logger } from './logger.js';
import { requireAuth, requireRole } from './middleware/auth.js';
import { officeHoursRouter } from './office-hours/office-hours.routes.js';

// Builds the Express app. It does NOT call listen and does NOT start background jobs,
// so tests can use createApp() directly (server.js starts the real server).
export function createApp() {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  const api = express.Router();

  // route protection rule (read this before you add a new router):
  // 1) PUBLIC routes are registered BEFORE api.use(requireAuth). only these three:
  //    health, mock-users and mock-login. nothing else goes above requireAuth.
  // 2) everything BELOW api.use(requireAuth) requires login (no cookie → 401).
  //    when a route is for one role only, check the role where the router is mounted, e.g.:
  //    api.use('/lecturer', requireRole(Role.LECTURER), officeHoursRouter);
  // 3) add every new non-public route to test/route-protection.int.test.js.

  // 1) PUBLIC routes — the only ones reachable without login
  api.use(healthRouter);
  api.use(publicAuthRouter);

  // 2) everything registered below this line requires login
  api.use(requireAuth);
  api.use(authRouter);
  api.use('/lecturer', requireRole(Role.LECTURER), officeHoursRouter);

  app.use('/api/v1', api);

  // Always last: unknown routes and the error middleware
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
