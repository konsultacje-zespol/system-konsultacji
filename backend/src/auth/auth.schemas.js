import { z } from 'zod';

// .strict() rejects any extra field — e.g. { userId, role: 'ADMIN' } gets 400
export const mockLoginSchema = z.object({
  userId: z.string().uuid(),
}).strict();
