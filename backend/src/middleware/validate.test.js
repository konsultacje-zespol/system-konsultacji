import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { errorHandler } from '../errors.js';
import { validate } from './validate.js';

const topicSchema = z.object({ topic: z.string().min(3) });

function buildTestApp() {
  const app = express();
  app.use(express.json());

  app.post('/topics', validate(topicSchema), (req, res) => {
    res.json({ received: req.validated.body });
  });

  app.use(errorHandler);
  return app;
}

describe('validate', () => {
  it('returns 400 VALIDATION_FAILED with the field name for invalid data', async () => {
    const response = await request(buildTestApp()).post('/topics').send({ topic: 'ab' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_FAILED');
    expect(response.body.errors[0].field).toBe('topic');
  });

  it('puts the checked data into req.validated.body', async () => {
    const response = await request(buildTestApp()).post('/topics').send({ topic: 'zadanie 3' });

    expect(response.status).toBe(200);
    expect(response.body.received).toEqual({ topic: 'zadanie 3' });
  });
});
