import { logger } from './logger.js';

// The complete list of error codes (plan, section 2.3). Do not add new codes.
export const ErrorCode = Object.freeze({
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SLOT_FULL: 'SLOT_FULL',
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
  ALREADY_BOOKED: 'ALREADY_BOOKED',
  MAX_ACTIVE_BOOKINGS_REACHED: 'MAX_ACTIVE_BOOKINGS_REACHED',
  CANCELLATION_CUTOFF_PASSED: 'CANCELLATION_CUTOFF_PASSED',
  OFFICE_HOUR_OVERLAP: 'OFFICE_HOUR_OVERLAP',
  OFFICE_HOUR_HAS_BOOKINGS: 'OFFICE_HOUR_HAS_BOOKINGS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
});

export const STATUS_BY_CODE = Object.freeze({
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SLOT_FULL: 409,
  SLOT_UNAVAILABLE: 409,
  ALREADY_BOOKED: 409,
  MAX_ACTIVE_BOOKINGS_REACHED: 422,
  CANCELLATION_CUTOFF_PASSED: 422,
  OFFICE_HOUR_OVERLAP: 409,
  OFFICE_HOUR_HAS_BOOKINGS: 409,
  INTERNAL_ERROR: 500,
});

// Usage: throw new AppError(ErrorCode.SLOT_FULL, 'Slot is full');
// extra is added to the response body, e.g. { conflicts: [...] } or { errors: [...] }
export class AppError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.extra = extra;
  }
}

// Registered after all routes: no route matched the request
export function notFoundHandler(req, res, next) {
  next(new AppError(ErrorCode.NOT_FOUND, 'Route not found'));
}

// Express recognises an error middleware only when it has FOUR parameters,
// so "next" must stay even though it is not used.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      statusCode: err.status,
      code: err.code,
      message: err.message,
      ...err.extra,
    });
  }

  // express.json() could not read the request body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      statusCode: 400,
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Invalid JSON',
    });
  }

  // Unexpected error: full details go to the log, the client gets a generic message only
  logger.error(err);
  return res.status(500).json({
    statusCode: 500,
    code: ErrorCode.INTERNAL_ERROR,
    message: 'Internal server error',
  });
}
