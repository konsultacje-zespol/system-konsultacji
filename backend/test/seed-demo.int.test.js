import { BookingStatus, OutboxStatus, Role } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { DEMO_ADMIN, DEMO_LECTURER, DEMO_STUDENT } from '../src/seed/demo-accounts.js';
import { seedDemo } from '../src/seed/seed-demo.js';

afterAll(async () => {
  await prisma.$disconnect();
});

// One seed for this group: the tests below only read the data
describe('seedDemo', () => {
  const now = new Date();
  let firstRun;
  let secondRun;

  beforeAll(async () => {
    firstRun = await seedDemo(now);
    secondRun = await seedDemo(now);
  });

  it('runs twice with the same counts and keeps the demo account UUIDs', async () => {
    expect(secondRun.counts).toEqual(firstRun.counts);

    const demoIds = [DEMO_STUDENT.id, DEMO_LECTURER.id, DEMO_ADMIN.id];
    const demoUsers = await prisma.user.findMany({ where: { id: { in: demoIds } } });
    expect(demoUsers).toHaveLength(3);
  });

  it('finishes in under 5 seconds', () => {
    expect(firstRun.durationMs).toBeLessThan(5000);
    expect(secondRun.durationMs).toBeLessThan(5000);
  });

  it('creates 1 admin, 5 lecturers and 20 students', async () => {
    expect(await prisma.user.count({ where: { role: Role.ADMIN } })).toBe(1);
    expect(await prisma.user.count({ where: { role: Role.LECTURER } })).toBe(5);
    expect(await prisma.user.count({ where: { role: Role.STUDENT } })).toBe(20);
    expect(secondRun.counts.students).toBe(20);
  });

  it('bookedCount of every slot equals the number of its CONFIRMED bookings', async () => {
    const slots = await prisma.slot.findMany({
      include: {
        _count: { select: { bookings: { where: { status: BookingStatus.CONFIRMED } } } },
      },
    });

    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      expect(slot.bookedCount).toBe(slot._count.bookings);
    }
  });

  it('no student has more than 3 future CONFIRMED bookings', async () => {
    const futureBookings = await prisma.booking.findMany({
      where: { status: BookingStatus.CONFIRMED, slot: { startsAt: { gt: now } } },
    });

    const countByStudent = {};
    for (const booking of futureBookings) {
      countByStudent[booking.studentId] = (countByStudent[booking.studentId] || 0) + 1;
    }
    for (const count of Object.values(countByStudent)) {
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  it('dr Kowalski has exactly 3 future CONFIRMED bookings (the day used by the E2E tests)', async () => {
    const kowalskiBookings = await prisma.booking.count({
      where: {
        status: BookingStatus.CONFIRMED,
        slot: { lecturerId: DEMO_LECTURER.id, startsAt: { gt: now } },
      },
    });

    expect(kowalskiBookings).toBe(3);
  });

  it('the demo student has a booking that starts in about 30 minutes', async () => {
    const soonBooking = await prisma.booking.findFirst({
      where: {
        studentId: DEMO_STUDENT.id,
        status: BookingStatus.CONFIRMED,
        slot: { startsAt: { gt: now, lte: new Date(now.getTime() + 35 * 60 * 1000) } },
      },
    });

    expect(soonBooking).not.toBeNull();
  });

  it('creates 4 SENT and 1 FAILED notifications', async () => {
    expect(await prisma.outboxEvent.count({ where: { status: OutboxStatus.SENT } })).toBe(4);
    expect(await prisma.outboxEvent.count({ where: { status: OutboxStatus.FAILED } })).toBe(1);
  });
});

// The data depends on the moment of seeding, so check a few tricky moments as well
describe('seedDemo at any time of day', () => {
  const trickyMoments = [
    '2026-11-22T22:50:00Z', // Sunday 23:50 in Poland: the "30 minutes" slot starts after midnight
    '2026-10-25T00:30:00Z', // the day the clock goes back (Polish time)
    '2026-03-28T23:55:00Z', // just before the clock goes forward
    '2026-12-31T13:00:00Z', // during the 14:00–16:00 weekly hours, end of the year
  ];

  for (const moment of trickyMoments) {
    it(`works for now = ${moment}`, async () => {
      const now = new Date(moment);

      const { counts } = await seedDemo(now);

      expect(counts.students).toBe(20);
      const kowalskiBookings = await prisma.booking.count({
        where: {
          status: BookingStatus.CONFIRMED,
          slot: { lecturerId: DEMO_LECTURER.id, startsAt: { gt: now } },
        },
      });
      expect(kowalskiBookings).toBe(3);
      const slots = await prisma.slot.findMany({
        include: {
          _count: { select: { bookings: { where: { status: BookingStatus.CONFIRMED } } } },
        },
      });
      for (const slot of slots) {
        expect(slot.bookedCount).toBe(slot._count.bookings);
      }
    });
  }
});
