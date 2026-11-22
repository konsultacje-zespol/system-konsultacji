import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError, ErrorCode } from '../errors.js';
import { validate } from '../middleware/validate.js';
import { mockLoginSchema } from './auth.schemas.js';
import { getUserById, listMockUsers, loginWithMockUser } from './auth.service.js';

// Two routers: publicAuthRouter is mounted BEFORE requireAuth, authRouter AFTER it (see src/app.js)
export const publicAuthRouter = express.Router();
export const authRouter = express.Router();

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: false, // the demo runs on http://localhost
  path: '/',
};

// With AUTH_MOCK_ENABLED=false the demo login behaves as if it did not exist
function requireMockAuthEnabled(req, res, next) {
  if (!config.AUTH_MOCK_ENABLED) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Demo login is disabled');
  }
  next();
}

/**
 * @openapi
 * /auth/mock-users:
 *   get:
 *     tags: [Auth]
 *     summary: Demo accounts for the login page (demo only)
 *     security: []
 *     responses:
 *       200:
 *         description: The three demo accounts and all users
 *         content:
 *           application/json:
 *             example:
 *               featured:
 *                 - { id: a0000000-0000-4000-8000-000000000001, email: student@demo.konsultacje.local, firstName: Anna, lastName: Nowak, title: null, role: STUDENT }
 *               users:
 *                 - { id: a0000000-0000-4000-8000-000000000001, email: student@demo.konsultacje.local, firstName: Anna, lastName: Nowak, title: null, role: STUDENT }
 *       404:
 *         description: Demo login is disabled (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
publicAuthRouter.get('/auth/mock-users', requireMockAuthEnabled, async (req, res) => {
  const result = await listMockUsers();
  res.json(result);
});

/**
 * @openapi
 * /auth/mock-login:
 *   post:
 *     tags: [Auth]
 *     summary: Logs in as the chosen user and sets the access_token cookie (demo only)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example: { userId: a0000000-0000-4000-8000-000000000001 }
 *     responses:
 *       200:
 *         description: Logged in; the httpOnly cookie access_token is set
 *         content:
 *           application/json:
 *             example:
 *               user: { id: a0000000-0000-4000-8000-000000000001, email: student@demo.konsultacje.local, firstName: Anna, lastName: Nowak, title: null, role: STUDENT }
 *       400:
 *         description: Invalid body, e.g. an extra "role" field (VALIDATION_FAILED)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Unknown user or demo login disabled (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
publicAuthRouter.post(
  '/auth/mock-login',
  requireMockAuthEnabled,
  validate(mockLoginSchema),
  async (req, res) => {
    const user = await loginWithMockUser(req.validated.body.userId);

    // The token holds only the user id; the role is read from the database on every request
    const token = jwt.sign({ sub: user.id }, config.JWT_SECRET, { expiresIn: '8h' });

    res.cookie('access_token', token, { ...COOKIE_OPTIONS, maxAge: SESSION_DURATION_MS });
    res.json({ user });
  },
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logs out (clears the access_token cookie)
 *     responses:
 *       204:
 *         description: Logged out
 *       401:
 *         description: Not logged in (UNAUTHENTICATED)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
authRouter.post('/auth/logout', (req, res) => {
  res.clearCookie('access_token', COOKIE_OPTIONS);
  res.status(204).end();
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: The currently logged-in user
 *     responses:
 *       200:
 *         description: The user
 *         content:
 *           application/json:
 *             example: { id: a0000000-0000-4000-8000-000000000001, email: student@demo.konsultacje.local, firstName: Anna, lastName: Nowak, title: null, role: STUDENT }
 *       401:
 *         description: Not logged in (UNAUTHENTICATED)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
authRouter.get('/auth/me', async (req, res) => {
  const user = await getUserById(req.user.id);
  res.json(user);
});
