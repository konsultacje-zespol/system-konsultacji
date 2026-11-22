import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';

// Checks the login cookie and sets req.user = { id, role }.
// The role is ALWAYS read from the database, never from the token or the request.
export async function requireAuth(req, res, next) {
  const token = req.cookies.access_token;
  if (!token) {
    throw new AppError(ErrorCode.UNAUTHENTICATED, 'Not logged in');
  }

  let payload;
  try {
    payload = jwt.verify(token, config.JWT_SECRET);
  } catch {
    throw new AppError(ErrorCode.UNAUTHENTICATED, 'Invalid or expired session');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true },
  });
  if (!user) {
    throw new AppError(ErrorCode.UNAUTHENTICATED, 'User no longer exists');
  }

  req.user = { id: user.id, role: user.role };
  next();
}

// Usage: requireRole(Role.LECTURER) — always values of the Role enum from @prisma/client
export function requireRole(...roles) {
  return function checkRole(req, res, next) {
    if (!roles.includes(req.user.role)) {
      throw new AppError(ErrorCode.FORBIDDEN, 'You do not have access to this resource');
    }
    next();
  };
}
