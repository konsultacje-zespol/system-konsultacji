import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { cleanDatabase } from './helpers/clean-database.js';
import { createTestAgent } from './helpers/test-agent.js';

describe('GET /api/v1/health', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns 200 and status ok when the database responds', async () => {
    const response = await createTestAgent().get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
