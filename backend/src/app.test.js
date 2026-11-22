import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

// Needs the generated Prisma client (npm install runs prisma generate), but not a running database:
// Prisma connects only on the first query.
describe('createApp', () => {
  it('returns 404 NOT_FOUND for an unknown route', async () => {
    // A path outside /api/v1: everything under /api/v1 that is not public first asks for login (401)
    const response = await request(createApp()).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });
});
