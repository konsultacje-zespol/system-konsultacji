import { AppError, ErrorCode } from '../errors.js';

// Usage: router.post('/bookings', validate(createBookingSchema), handler)
//        router.get('/schedule', validate(scheduleQuerySchema, 'query'), handler)
// The handler reads the checked data from req.validated.body / .query / .params.
// We never overwrite req.query — in Express 5 it is read-only.
export function validate(schema, source = 'body') {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new AppError(ErrorCode.VALIDATION_FAILED, 'Invalid data', { errors });
    }

    if (!req.validated) {
      req.validated = {};
    }
    req.validated[source] = result.data;
    next();
  };
}
