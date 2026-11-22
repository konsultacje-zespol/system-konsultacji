import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { AppError, ErrorCode, errorHandler, notFoundHandler } from './errors.js';

// A tiny app only for these tests: a few routes that throw, and the error middleware at the end
function buildTestApp() {
  const app = express();
  app.use(express.json());

  app.get('/slot-full', () => {
    throw new AppError(ErrorCode.SLOT_FULL, 'Slot is full');
  });

  app.get('/overlap', () => {
    throw new AppError(ErrorCode.OFFICE_HOUR_OVERLAP, 'Office hours overlap', {
      conflicts: [{ startsAt: '2026-11-25T13:00:00.000Z' }],
    });
  });

  app.get('/crash', () => {
    throw new Error('db password wrong');
  });

  app.post('/echo', (req, res) => {
    res.json(req.body);
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('returns 409 and the code for AppError SLOT_FULL', async () => {
    const response = await request(buildTestApp()).get('/slot-full');

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ statusCode: 409, code: 'SLOT_FULL', message: 'Slot is full' });
  });

  it('adds "extra" to the response body', async () => {
    const response = await request(buildTestApp()).get('/overlap');

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('OFFICE_HOUR_OVERLAP');
    expect(response.body.conflicts).toEqual([{ startsAt: '2026-11-25T13:00:00.000Z' }]);
  });

  it('returns 400 VALIDATION_FAILED for invalid JSON', async () => {
    const response = await request(buildTestApp())
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send('{"topic": ');

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_FAILED');
    expect(response.body.message).toBe('Invalid JSON');
  });

  it('returns 500 without the original message for an unexpected error', async () => {
    const response = await request(buildTestApp()).get('/crash');

    expect(response.status).toBe(500);
    expect(response.body.code).toBe('INTERNAL_ERROR');
    expect(response.text).not.toContain('db password wrong');
  });

  it('returns 404 NOT_FOUND for an unknown route', async () => {
    const response = await request(buildTestApp()).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });
});
