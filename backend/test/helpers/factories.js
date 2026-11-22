import { randomUUID } from 'node:crypto';
import { BookingStatus, LocationMode, Recurrence } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';
import { normalizeSearchName } from '../../src/common/search-name.js';
import { APP_TIMEZONE } from '../../src/common/time.js';
import { prisma } from '../../src/db.js';

// Simple functions that insert test rows straight into the database and return them.

const SLOT_DURATION_MIN = 15;

export async function createUser({ role, firstName = 'Jan', lastName = 'Testowy' }) {
  return prisma.user.create({
    data: {
      // random part: e-mail must be unique, also across test files
      email: `user-${randomUUID()}@test.local`,
      firstName,
      lastName,
      searchName: normalizeSearchName(firstName, lastName),
      role,
    },
  });
}

// Tomorrow at 12:00 UTC — far enough from "now" that no booking cut-off applies
function tomorrowAtNoonUtc() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  date.setUTCHours(12, 0, 0, 0);
  return date;
}

// One ONCE office hour with exactly one OPEN slot. Returns { officeHour, slot }.
export async function createOfficeHourWithSlot({ lecturerId, startsAt = tomorrowAtNoonUtc(), capacity = 1 }) {
  const endsAt = new Date(startsAt.getTime() + SLOT_DURATION_MIN * 60 * 1000);

  // office hours store the date and times in Polish time, like the real form does
  const localDate = formatInTimeZone(startsAt, APP_TIMEZONE, 'yyyy-MM-dd');
  const startTime = formatInTimeZone(startsAt, APP_TIMEZONE, 'HH:mm');
  const endTime = formatInTimeZone(endsAt, APP_TIMEZONE, 'HH:mm');

  const officeHour = await prisma.officeHour.create({
    data: {
      lecturerId,
      recurrence: Recurrence.ONCE,
      startDate: new Date(`${localDate}T00:00:00Z`),
      endDate: new Date(`${localDate}T00:00:00Z`),
      weekdays: [],
      startTime,
      endTime,
      slotDurationMin: SLOT_DURATION_MIN,
      capacity,
      mode: LocationMode.IN_PERSON,
      location: 'Sala 101',
    },
  });

  const slot = await prisma.slot.create({
    data: {
      officeHourId: officeHour.id,
      lecturerId,
      startsAt,
      endsAt,
      capacity,
      mode: officeHour.mode,
      location: officeHour.location,
    },
  });

  return { officeHour, slot };
}

// A CONFIRMED booking also takes a place in the slot (booked_count + 1), like the real booking does.
export async function createBooking({ slotId, studentId, status = BookingStatus.CONFIRMED }) {
  const bookingData = { slotId, studentId, status, topic: 'Pytanie o projekt' };

  if (status !== BookingStatus.CONFIRMED) {
    return prisma.booking.create({ data: bookingData });
  }

  const [booking] = await prisma.$transaction([
    prisma.booking.create({ data: bookingData }),
    prisma.slot.update({ where: { id: slotId }, data: { bookedCount: { increment: 1 } } }),
  ]);
  return booking;
}
