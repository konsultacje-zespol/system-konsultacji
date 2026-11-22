import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { createTestAgent } from './helpers/test-agent.js';

// EVERY non-public route must be on this list. Adding a new protected route? Add it here too.
const protectedRoutes = [
  { method: 'get', path: '/api/v1/auth/me' },
  { method: 'post', path: '/api/v1/auth/logout' },
  { method: 'get', path: '/api/v1/lecturer/office-hours' },
  { method: 'post', path: '/api/v1/lecturer/office-hours' },
  { method: 'delete', path: '/api/v1/lecturer/office-hours/c0000000-0000-4000-8000-000000000001' },
];

describe('route protection', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  for (const route of protectedRoutes) {
    it(`${route.method.toUpperCase()} ${route.path} without a cookie returns 401`, async () => {
      const response = await createTestAgent()[route.method](route.path);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHENTICATED');
    });
  }
});
