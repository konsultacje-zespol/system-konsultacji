import cookieParser from 'cookie-parser';
import express from 'express';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { openapiSpec } from './docs/openapi.js';
import { authRouter, publicAuthRouter } from './auth/auth.routes.js';
import { errorHandler, notFoundHandler } from './errors.js';
import { healthRouter } from './health/health.routes.js';
import { logger } from './logger.js';
import { requireAuth } from './middleware/auth.js';

// Builds the Express app. It does NOT call listen and does NOT start background jobs,
// so tests can use createApp() directly (server.js starts the real server).
export function createApp() {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  const api = express.Router();

  // ZASADA OCHRONY TRAS (przeczytaj, zanim dodasz nowy router):
  // 1) Trasy PUBLICZNE są zarejestrowane PRZED api.use(requireAuth). Tylko te trzy:
  //    health, mock-users i mock-login. Nic więcej nie dopisujemy nad requireAuth.
  // 2) Wszystko PONIŻEJ api.use(requireAuth) wymaga zalogowania (bez ciasteczka → 401).
  //    Gdy trasa jest tylko dla jednej roli, sprawdzamy ją przy podpinaniu, np.:
  //    api.use('/lecturer', requireRole(Role.LECTURER), officeHoursRouter);
  // 3) Każdą nową trasę niepubliczną dopisz do test/route-protection.int.test.js.

  // 1) PUBLIC routes — the only ones reachable without login
  api.use(healthRouter);
  api.use(publicAuthRouter);

  // 2) everything registered below this line requires login
  api.use(requireAuth);
  api.use(authRouter);

  app.use('/api/v1', api);

  // Always last: unknown routes and the error middleware
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
