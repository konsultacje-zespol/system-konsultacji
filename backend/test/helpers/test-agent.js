import request from 'supertest';
import { createApp } from '../../src/app.js';

// A supertest "agent" works like one browser tab: it remembers the cookies the server sets
// and sends them with every next request. So after loginAs(agent, ...) every request from
// this agent is logged in. Plain request(app) forgets cookies after each request.
// Each call gives a fresh app, i.e. a new, not logged-in "browser". More: docs/tests.md.
export function createTestAgent() {
  return request.agent(createApp());
}
