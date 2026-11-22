import { LocationMode, Recurrence, Role } from '@prisma/client';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { cleanDatabase } from './helpers/clean-database.js';
import { createBooking, createOfficeHourWithSlot, createUser } from './helpers/factories.js';
import { loginAs } from './helpers/login-as.js';
import { createTestAgent } from './helpers/test-agent.js';

// adds days to a 'YYYY-MM-DD' string
function addDays(date, days) {
  const result = new Date(date + 'T00:00:00Z');
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

// a Monday at least a week ahead, so every generated slot is safely in the future
function upcomingMonday() {
  let date = addDays(new Date().toISOString().slice(0, 10), 7);
  while (new Date(date + 'T00:00:00Z').getUTCDay() !== 1) {
    date = addDays(date, 1);
  }
  return date;
}

// weekly Mon + Wed for two weeks, 14:00–15:00, 15-minute slots -> 2 weeks × 2 days × 4 slots = 16 slots
function weeklyOfficeHour(changes = {}) {
  const startDate = upcomingMonday();
  return {
    recurrence: Recurrence.WEEKLY,
    startDate,
    endDate: addDays(startDate, 13),
    weekdays: [1, 3],
    startTime: '14:00',
    endTime: '15:00',
    slotDurationMin: 15,
    capacity: 1,
    mode: LocationMode.IN_PERSON,
    location: 'Sala 204',
    ...changes,
  };
}

async function loggedIn(role) {
  const user = await createUser({ role });
  const agent = createTestAgent();
  await loginAs(agent, user.id);
  return { user, agent };
}

describe('office hours API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /lecturer/office-hours', () => {
    it('creates a weekly office hour and its 16 slots', async () => {
      const { user: lecturer, agent } = await loggedIn(Role.LECTURER);

      const response = await agent.post('/api/v1/lecturer/office-hours').send(weeklyOfficeHour());

      expect(response.status).toBe(201);
      expect(response.body.slotsCreated).toBe(16);
      const slotsInDatabase = await prisma.slot.count({
        where: { officeHourId: response.body.officeHour.id, lecturerId: lecturer.id },
      });
      expect(slotsInDatabase).toBe(16);
    });

    it('rejects an online office hour with an http:// link (400)', async () => {
      const { agent } = await loggedIn(Role.LECTURER);

      const response = await agent
        .post('/api/v1/lecturer/office-hours')
        .send(weeklyOfficeHour({ mode: LocationMode.ONLINE, location: 'http://teams.example' }));

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
    });

    it('rejects a start date in the past (400)', async () => {
      const { agent } = await loggedIn(Role.LECTURER);
      const lastWeek = addDays(new Date().toISOString().slice(0, 10), -7);

      const response = await agent
        .post('/api/v1/lecturer/office-hours')
        .send(weeklyOfficeHour({ recurrence: Recurrence.ONCE, startDate: lastWeek, endDate: lastWeek, weekdays: [] }));

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
    });

    it('rejects a window that does not divide into whole slots (400)', async () => {
      const { agent } = await loggedIn(Role.LECTURER);

      const response = await agent
        .post('/api/v1/lecturer/office-hours')
        .send(weeklyOfficeHour({ startTime: '14:00', endTime: '14:50' }));

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_FAILED');
    });

    it('rejects an office hour that overlaps existing slots (409 with conflicts)', async () => {
      const { agent } = await loggedIn(Role.LECTURER);
      await agent.post('/api/v1/lecturer/office-hours').send(weeklyOfficeHour());

      const response = await agent
        .post('/api/v1/lecturer/office-hours')
        .send(weeklyOfficeHour({ startTime: '14:30', endTime: '15:30' }));

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('OFFICE_HOUR_OVERLAP');
      // 8 slots overlap (14:30 and 14:45 on 4 days), the response lists at most 5
      expect(response.body.conflicts).toHaveLength(5);
      expect(response.body.conflicts[0]).toHaveProperty('startsAt');
      expect(response.body.conflicts[0]).toHaveProperty('endsAt');
      // nothing new was saved
      expect(await prisma.slot.count()).toBe(16);
    });

    it('the same office hour sent twice in parallel: one 201 and one 409', async () => {
      const { agent } = await loggedIn(Role.LECTURER);
      const body = weeklyOfficeHour();

      const responses = await Promise.all([
        agent.post('/api/v1/lecturer/office-hours').send(body),
        agent.post('/api/v1/lecturer/office-hours').send(body),
      ]);

      const statuses = responses.map((response) => response.status).sort();
      expect(statuses).toEqual([201, 409]);
      const rejected = responses.find((response) => response.status === 409);
      expect(rejected.body.code).toBe('OFFICE_HOUR_OVERLAP');
      expect(await prisma.officeHour.count()).toBe(1);
      expect(await prisma.slot.count()).toBe(16);
    });
  });

  describe('GET /lecturer/office-hours', () => {
    it('lists only own office hours with futureSlots and bookingsCount', async () => {
      const { user: lecturer, agent } = await loggedIn(Role.LECTURER);
      const otherLecturer = await createUser({ role: Role.LECTURER });
      const student = await createUser({ role: Role.STUDENT });
      const { slot } = await createOfficeHourWithSlot({ lecturerId: lecturer.id });
      await createBooking({ slotId: slot.id, studentId: student.id });
      await createOfficeHourWithSlot({ lecturerId: otherLecturer.id });

      const response = await agent.get('/api/v1/lecturer/office-hours');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].futureSlots).toBe(1);
      expect(response.body[0].bookingsCount).toBe(1);
    });

    it('a student gets 403 FORBIDDEN', async () => {
      const { agent } = await loggedIn(Role.STUDENT);

      const response = await agent.get('/api/v1/lecturer/office-hours');

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('FORBIDDEN');
    });
  });

  describe('DELETE /lecturer/office-hours/:id', () => {
    it('deletes an office hour without bookings together with its slots (204)', async () => {
      const { user: lecturer, agent } = await loggedIn(Role.LECTURER);
      const { officeHour } = await createOfficeHourWithSlot({ lecturerId: lecturer.id });

      const response = await agent.delete(`/api/v1/lecturer/office-hours/${officeHour.id}`);

      expect(response.status).toBe(204);
      expect(await prisma.officeHour.count()).toBe(0);
      expect(await prisma.slot.count()).toBe(0);
    });

    it("another lecturer's office hour returns 404 and stays", async () => {
      const owner = await createUser({ role: Role.LECTURER });
      const { agent } = await loggedIn(Role.LECTURER);
      const { officeHour } = await createOfficeHourWithSlot({ lecturerId: owner.id });

      const response = await agent.delete(`/api/v1/lecturer/office-hours/${officeHour.id}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
      expect(await prisma.officeHour.count()).toBe(1);
    });

    it('an office hour with a booking returns 409 OFFICE_HOUR_HAS_BOOKINGS', async () => {
      const { user: lecturer, agent } = await loggedIn(Role.LECTURER);
      const student = await createUser({ role: Role.STUDENT });
      const { officeHour, slot } = await createOfficeHourWithSlot({ lecturerId: lecturer.id });
      await createBooking({ slotId: slot.id, studentId: student.id });

      const response = await agent.delete(`/api/v1/lecturer/office-hours/${officeHour.id}`);

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('OFFICE_HOUR_HAS_BOOKINGS');
      expect(await prisma.officeHour.count()).toBe(1);
    });
  });
});
