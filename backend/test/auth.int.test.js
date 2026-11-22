import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { config } from '../src/config.js';
import { prisma } from '../src/db.js';
import { cleanDatabase } from './helpers/clean-database.js';
import { createUser } from './helpers/factories.js';
import { loginAs } from './helpers/login-as.js';
import { createTestAgent } from './helpers/test-agent.js';

describe('auth (demo login)', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(() => {
    config.AUTH_MOCK_ENABLED = true;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('login sets an httpOnly SameSite=Strict cookie and /auth/me returns the student', async () => {
    const student = await createUser({ role: Role.STUDENT });
    const agent = createTestAgent();

    const loginResponse = await agent.post('/api/v1/auth/mock-login').send({ userId: student.id });

    expect(loginResponse.status).toBe(200);
    const cookie = loginResponse.headers['set-cookie'][0];
    expect(cookie).toContain('access_token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');

    const meResponse = await agent.get('/api/v1/auth/me');
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.id).toBe(student.id);
    expect(meResponse.body.role).toBe(Role.STUDENT);
  });

  it('rejects an extra "role" field with 400', async () => {
    const student = await createUser({ role: Role.STUDENT });

    const response = await createTestAgent()
      .post('/api/v1/auth/mock-login')
      .send({ userId: student.id, role: Role.ADMIN });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_FAILED');
  });

  it('GET /auth/me without a cookie returns 401 UNAUTHENTICATED', async () => {
    const response = await createTestAgent().get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHENTICATED');
  });

  it('a token signed with another secret returns 401', async () => {
    const student = await createUser({ role: Role.STUDENT });
    const fakeToken = jwt.sign({ sub: student.id }, 'some-other-secret-that-is-not-ours');

    const response = await createTestAgent()
      .get('/api/v1/auth/me')
      .set('Cookie', `access_token=${fakeToken}`);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHENTICATED');
  });

  it('an unknown userId returns 404', async () => {
    const response = await createTestAgent()
      .post('/api/v1/auth/mock-login')
      .send({ userId: 'b0000000-0000-4000-8000-000000000099' });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('after logout /auth/me returns 401', async () => {
    const student = await createUser({ role: Role.STUDENT });
    const agent = createTestAgent();
    await loginAs(agent, student.id);

    const logoutResponse = await agent.post('/api/v1/auth/logout');
    expect(logoutResponse.status).toBe(204);

    const meResponse = await agent.get('/api/v1/auth/me');
    expect(meResponse.status).toBe(401);
  });

  it('with AUTH_MOCK_ENABLED = false the demo login returns 404', async () => {
    const student = await createUser({ role: Role.STUDENT });
    config.AUTH_MOCK_ENABLED = false;

    const loginResponse = await createTestAgent()
      .post('/api/v1/auth/mock-login')
      .send({ userId: student.id });
    const usersResponse = await createTestAgent().get('/api/v1/auth/mock-users');

    expect(loginResponse.status).toBe(404);
    expect(usersResponse.status).toBe(404);
  });
});
