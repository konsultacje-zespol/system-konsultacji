import express from 'express';
import { validate } from '../middleware/validate.js';
import { createOfficeHourSchema, idParamsSchema } from './office-hours.schemas.js';
import { createOfficeHour, deleteOfficeHour, listOfficeHours } from './office-hours.service.js';

// mounted in src/app.js under /lecturer with requireRole(Role.LECTURER).
// the lecturer is always the logged-in user (req.user.id), never a value from the request.
export const officeHoursRouter = express.Router();

/**
 * @openapi
 * /lecturer/office-hours:
 *   get:
 *     tags: [Office hours]
 *     summary: The logged-in lecturer's office hours with future slots and bookings counts
 *     responses:
 *       200:
 *         description: Office hours, newest start date first
 *         content:
 *           application/json:
 *             example:
 *               - id: c0000000-0000-4000-8000-000000000001
 *                 lecturerId: a0000000-0000-4000-8000-000000000002
 *                 recurrence: WEEKLY
 *                 startDate: '2026-11-23T00:00:00.000Z'
 *                 endDate: '2026-12-06T00:00:00.000Z'
 *                 weekdays: [1, 3]
 *                 startTime: '14:00'
 *                 endTime: '16:00'
 *                 slotDurationMin: 15
 *                 capacity: 2
 *                 mode: IN_PERSON
 *                 location: 'Sala 204, bud. B-1'
 *                 note: null
 *                 createdAt: '2026-11-22T10:00:00.000Z'
 *                 futureSlots: 32
 *                 bookingsCount: 3
 *       401:
 *         description: Not logged in (UNAUTHENTICATED)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Not a lecturer (FORBIDDEN)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
officeHoursRouter.get('/office-hours', async (req, res) => {
  const officeHours = await listOfficeHours(req.user.id);
  res.json(officeHours);
});

/**
 * @openapi
 * /lecturer/office-hours:
 *   post:
 *     tags: [Office hours]
 *     summary: Creates an office hour and generates its slots immediately
 *     description: >
 *       For ONCE the endDate and weekdays are ignored (endDate = startDate, weekdays = []).
 *       Times are Polish time. Rules: range at most 140 days, start not in the past, hours 06:00–22:00,
 *       the window divides evenly into slots, ONLINE needs an https:// link.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             recurrence: WEEKLY
 *             startDate: '2026-11-23'
 *             endDate: '2026-12-06'
 *             weekdays: [1, 3]
 *             startTime: '14:00'
 *             endTime: '16:00'
 *             slotDurationMin: 15
 *             capacity: 2
 *             mode: IN_PERSON
 *             location: 'Sala 204, bud. B-1'
 *             note: Please bring your project
 *     responses:
 *       201:
 *         description: Created; slotsCreated is the number of generated slots
 *         content:
 *           application/json:
 *             example:
 *               officeHour: { id: c0000000-0000-4000-8000-000000000001, recurrence: WEEKLY, startDate: '2026-11-23T00:00:00.000Z', endDate: '2026-12-06T00:00:00.000Z', weekdays: [1, 3], startTime: '14:00', endTime: '16:00', slotDurationMin: 15, capacity: 2, mode: IN_PERSON, location: 'Sala 204, bud. B-1' }
 *               slotsCreated: 32
 *       400:
 *         description: Invalid data, e.g. an http:// link for an online office hour (VALIDATION_FAILED)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *             example: { statusCode: 400, code: VALIDATION_FAILED, message: 'An online office hour needs an https:// meeting link as its location' }
 *       401:
 *         description: Not logged in (UNAUTHENTICATED)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Not a lecturer (FORBIDDEN)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: Overlaps the lecturer's existing open slots (OFFICE_HOUR_OVERLAP); up to 5 conflicts are listed
 *         content:
 *           application/json:
 *             example:
 *               statusCode: 409
 *               code: OFFICE_HOUR_OVERLAP
 *               message: The office hour overlaps your existing slots
 *               conflicts:
 *                 - { startsAt: '2026-11-23T13:00:00.000Z', endsAt: '2026-11-23T13:15:00.000Z' }
 */
officeHoursRouter.post('/office-hours', validate(createOfficeHourSchema), async (req, res) => {
  const result = await createOfficeHour(req.user.id, req.validated.body);
  res.status(201).json(result);
});

/**
 * @openapi
 * /lecturer/office-hours/{id}:
 *   delete:
 *     tags: [Office hours]
 *     summary: Deletes an office hour without bookings (its slots are deleted too)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Deleted
 *       400:
 *         description: The id is not a UUID (VALIDATION_FAILED)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not logged in (UNAUTHENTICATED)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       403:
 *         description: Not a lecturer (FORBIDDEN)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: No such office hour, or it belongs to another lecturer (NOT_FOUND)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       409:
 *         description: The office hour has bookings (OFFICE_HOUR_HAS_BOOKINGS)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
officeHoursRouter.delete('/office-hours/:id', validate(idParamsSchema, 'params'), async (req, res) => {
  await deleteOfficeHour(req.user.id, req.validated.params.id);
  res.status(204).end();
});
