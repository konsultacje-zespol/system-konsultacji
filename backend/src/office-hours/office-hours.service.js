import { LocationMode, Recurrence, SlotStatus } from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';
import { APP_TIMEZONE } from '../common/time.js';
import { prisma } from '../db.js';
import { AppError, ErrorCode } from '../errors.js';
import { generateSlots, timeToMinutes } from './slot-generator.js';

const MAX_RANGE_DAYS = 140; // 20 weeks
const EARLIEST_TIME = '06:00';
const LATEST_TIME = '22:00';
const MAX_CONFLICTS_IN_RESPONSE = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

function validationError(message) {
  return new AppError(ErrorCode.VALIDATION_FAILED, message);
}

// the regex only checks the shape; javascript would silently turn '2026-02-31' into 3 March
function isRealDate(date) {
  const parsed = new Date(date + 'T00:00:00Z');
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function isRealTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours <= 23 && minutes <= 59;
}

function daysBetween(startDate, endDate) {
  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');
  return (end.getTime() - start.getTime()) / DAY_MS;
}

function isHttpsUrl(text) {
  try {
    return new URL(text).protocol === 'https:';
  } catch {
    return false;
  }
}

// checks the rules from the plan in a fixed order and returns the data ready for the generator.
function checkOfficeHourRules(data, now) {
  // a one-off office hour has a single day and no weekdays
  const endDate = data.recurrence === Recurrence.ONCE ? data.startDate : data.endDate;
  const weekdays = data.recurrence === Recurrence.ONCE ? [] : data.weekdays;

  if (!isRealDate(data.startDate) || !isRealDate(endDate)) {
    throw validationError('startDate and endDate must be real calendar dates');
  }
  if (!isRealTime(data.startTime) || !isRealTime(data.endTime)) {
    throw validationError('startTime and endTime must be real times');
  }
  if (data.recurrence === Recurrence.WEEKLY && weekdays.length === 0) {
    throw validationError('A weekly office hour needs at least one weekday');
  }
  if (endDate < data.startDate) {
    throw validationError('endDate must not be before startDate');
  }
  if (daysBetween(data.startDate, endDate) > MAX_RANGE_DAYS) {
    throw validationError(`The date range must not be longer than ${MAX_RANGE_DAYS} days`);
  }

  const todayInPoland = formatInTimeZone(now, APP_TIMEZONE, 'yyyy-MM-dd');
  if (data.startDate < todayInPoland) {
    throw validationError('startDate must not be in the past');
  }

  const startMinute = timeToMinutes(data.startTime);
  const endMinute = timeToMinutes(data.endTime);
  if (startMinute < timeToMinutes(EARLIEST_TIME) || endMinute > timeToMinutes(LATEST_TIME)) {
    throw validationError(`Office hours must be between ${EARLIEST_TIME} and ${LATEST_TIME}`);
  }
  if (startMinute >= endMinute) {
    throw validationError('startTime must be before endTime');
  }
  if ((endMinute - startMinute) % data.slotDurationMin !== 0) {
    throw validationError('The time window must divide evenly into slots of slotDurationMin minutes');
  }

  if (data.mode === LocationMode.ONLINE && !isHttpsUrl(data.location)) {
    throw validationError('An online office hour needs an https:// meeting link as its location');
  }

  return { ...data, endDate, weekdays };
}

// returns the existing slots that overlap at least one of the new slots (at most 5).
function findConflicts(newSlots, existingSlots) {
  const conflicts = [];

  for (const existing of existingSlots) {
    const overlaps = newSlots.some(
      (newSlot) => newSlot.startsAt < existing.endsAt && existing.startsAt < newSlot.endsAt,
    );
    if (overlaps) {
      conflicts.push({ startsAt: existing.startsAt, endsAt: existing.endsAt });
    }
    if (conflicts.length === MAX_CONFLICTS_IN_RESPONSE) {
      break;
    }
  }

  return conflicts;
}

export async function createOfficeHour(lecturerId, data, now = new Date()) {
  const officeHourData = checkOfficeHourRules(data, now);

  const newSlots = generateSlots(officeHourData, now);
  if (newSlots.length === 0) {
    throw validationError('No future slots in this range');
  }

  return prisma.$transaction(async (tx) => {
    // a lock per lecturer, released automatically when the transaction ends: two parallel requests
    // of the same lecturer are checked one after another, so the second one sees the first one's slots.
    // ($executeRaw, not $queryRaw, because pg_advisory_xact_lock returns void)
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lecturerId}))`;

    const firstStart = newSlots[0].startsAt;
    const lastEnd = newSlots[newSlots.length - 1].endsAt;
    const existingSlots = await tx.slot.findMany({
      where: {
        lecturerId,
        status: SlotStatus.OPEN,
        startsAt: { lt: lastEnd },
        endsAt: { gt: firstStart },
      },
      select: { startsAt: true, endsAt: true },
      orderBy: { startsAt: 'asc' },
    });

    const conflicts = findConflicts(newSlots, existingSlots);
    if (conflicts.length > 0) {
      throw new AppError(ErrorCode.OFFICE_HOUR_OVERLAP, 'The office hour overlaps your existing slots', {
        conflicts,
      });
    }

    const officeHour = await tx.officeHour.create({
      data: {
        lecturerId,
        recurrence: officeHourData.recurrence,
        startDate: new Date(officeHourData.startDate + 'T00:00:00Z'),
        endDate: new Date(officeHourData.endDate + 'T00:00:00Z'),
        weekdays: officeHourData.weekdays,
        startTime: officeHourData.startTime,
        endTime: officeHourData.endTime,
        slotDurationMin: officeHourData.slotDurationMin,
        capacity: officeHourData.capacity,
        mode: officeHourData.mode,
        location: officeHourData.location,
        note: officeHourData.note,
      },
    });

    await tx.slot.createMany({
      data: newSlots.map((slot) => ({
        officeHourId: officeHour.id,
        lecturerId,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        capacity: officeHour.capacity,
        mode: officeHour.mode,
        location: officeHour.location,
      })),
    });

    return { officeHour, slotsCreated: newSlots.length };
  });
}

export async function listOfficeHours(lecturerId, now = new Date()) {
  const officeHours = await prisma.officeHour.findMany({
    where: { lecturerId },
    orderBy: { startDate: 'desc' },
  });

  // a lecturer has only a few office hours, so two small count queries per item are fine
  return Promise.all(
    officeHours.map(async (officeHour) => {
      const [futureSlots, bookingsCount] = await Promise.all([
        prisma.slot.count({
          where: { officeHourId: officeHour.id, status: SlotStatus.OPEN, startsAt: { gt: now } },
        }),
        prisma.booking.count({
          where: { slot: { officeHourId: officeHour.id } },
        }),
      ]);
      return { ...officeHour, futureSlots, bookingsCount };
    }),
  );
}

export async function deleteOfficeHour(lecturerId, officeHourId) {
  const officeHour = await prisma.officeHour.findUnique({ where: { id: officeHourId } });

  // another lecturer's office hour looks exactly like a missing one
  if (!officeHour || officeHour.lecturerId !== lecturerId) {
    throw new AppError(ErrorCode.NOT_FOUND, 'Office hour not found');
  }

  // any booking counts, also a cancelled one: bookings are history and are never deleted
  const bookingsCount = await prisma.booking.count({
    where: { slot: { officeHourId } },
  });
  if (bookingsCount > 0) {
    throw new AppError(ErrorCode.OFFICE_HOUR_HAS_BOOKINGS, 'An office hour with bookings cannot be deleted');
  }

  // its slots are deleted together with it (onDelete: Cascade)
  await prisma.officeHour.delete({ where: { id: officeHourId } });
}
