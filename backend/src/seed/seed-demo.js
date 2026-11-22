import { randomUUID } from 'node:crypto';
import {
  BookingStatus,
  LocationMode,
  OutboxStatus,
  OutboxType,
  Recurrence,
  Role,
  SlotStatus,
} from '@prisma/client';
import { formatInTimeZone } from 'date-fns-tz';
import { normalizeSearchName, normalizeSearchText } from '../common/search-name.js';
import { APP_TIMEZONE } from '../common/time.js';
import { prisma } from '../db.js';
import { generateSlots } from '../office-hours/slot-generator.js';
import { DEMO_ADMIN, DEMO_LECTURER, DEMO_STUDENT } from './demo-accounts.js';

// Demo data for the presentation. Used by `npx prisma db seed` (prisma/seed.js)
// and by the admin "Reset demo database" button. All dates are counted from `now`.

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// generateSlots skips slots before its "now"; a date far in the past keeps the past slots too (history)
const FAR_PAST = new Date('2000-01-01T00:00:00Z');

const TEAMS_LINK_LUKASIEWICZ = 'https://teams.microsoft.com/l/meetup-join/demo-1';
const TEAMS_LINK_ZIELINSKI = 'https://teams.microsoft.com/l/meetup-join/demo-2';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const OTHER_LECTURERS = [
  { key: 'lukasiewicz', title: 'prof.', firstName: 'Ewa', lastName: 'Łukasiewicz', department: 'Katedra Matematyki' },
  { key: 'zolkiewski', title: 'dr', firstName: 'Marek', lastName: 'Żółkiewski', department: 'Katedra Fizyki' },
  { key: 'wisniewska', title: 'dr hab.', firstName: 'Anna', lastName: 'Wiśniewska', department: 'Katedra Informatyki' },
  { key: 'zielinski', title: 'mgr', firstName: 'Piotr', lastName: 'Zieliński', department: 'Katedra Ekonomii' },
];

// 16 Polish students + 3 Erasmus students; with Anna Nowak (DEMO_STUDENT) that is 20 students
const OTHER_STUDENTS = [
  { firstName: 'Jakub', lastName: 'Wójcik' },
  { firstName: 'Zuzanna', lastName: 'Kamińska' },
  { firstName: 'Mateusz', lastName: 'Lewandowski' },
  { firstName: 'Julia', lastName: 'Dąbrowska' },
  { firstName: 'Kacper', lastName: 'Kozłowski' },
  { firstName: 'Maja', lastName: 'Jankowska' },
  { firstName: 'Szymon', lastName: 'Mazur' },
  { firstName: 'Natalia', lastName: 'Krawczyk' },
  { firstName: 'Filip', lastName: 'Piotrowski' },
  { firstName: 'Oliwia', lastName: 'Grabowska' },
  { firstName: 'Michał', lastName: 'Pawłowski' },
  { firstName: 'Aleksandra', lastName: 'Michalska' },
  { firstName: 'Bartosz', lastName: 'Król' },
  { firstName: 'Wiktoria', lastName: 'Wieczorek' },
  { firstName: 'Paweł', lastName: 'Jabłoński' },
  { firstName: 'Karolina', lastName: 'Nowicka' },
  { firstName: 'Lucas', lastName: 'Martin', department: 'Erasmus+' },
  { firstName: 'Sofia', lastName: 'Rossi', department: 'Erasmus+' },
  { firstName: 'Emma', lastName: 'Johnson', department: 'Erasmus+' },
];

// "Łukasiewicz" -> "lukasiewicz", used to build plain ASCII e-mail addresses
function emailPart(text) {
  return normalizeSearchText(text).replaceAll(' ', '-');
}

function buildUser({ id, email, firstName, lastName, title = null, department = null, role }) {
  return {
    id,
    email,
    firstName,
    lastName,
    searchName: normalizeSearchName(firstName, lastName),
    role,
    title,
    department,
  };
}

function buildUsers() {
  const admin = buildUser(DEMO_ADMIN);
  const kowalski = buildUser({ ...DEMO_LECTURER, department: 'Katedra Informatyki' });
  const annaNowak = buildUser({ ...DEMO_STUDENT, department: 'Informatyka, II rok' });

  const lecturers = { kowalski };
  for (const lecturer of OTHER_LECTURERS) {
    lecturers[lecturer.key] = buildUser({
      id: randomUUID(),
      email: `${emailPart(lecturer.firstName)}.${emailPart(lecturer.lastName)}@demo.konsultacje.local`,
      firstName: lecturer.firstName,
      lastName: lecturer.lastName,
      title: lecturer.title,
      department: lecturer.department,
      role: Role.LECTURER,
    });
  }

  const students = [annaNowak];
  for (const student of OTHER_STUDENTS) {
    students.push(
      buildUser({
        id: randomUUID(),
        email: `${emailPart(student.firstName)}.${emailPart(student.lastName)}@student.demo.konsultacje.local`,
        firstName: student.firstName,
        lastName: student.lastName,
        department: student.department || 'Informatyka',
        role: Role.STUDENT,
      }),
    );
  }

  return { admin, lecturers, students };
}

// ---------------------------------------------------------------------------
// Dates (office hours are defined in Polish time, like in the real form)
// ---------------------------------------------------------------------------

// the Polish calendar date of a moment, e.g. '2026-11-22'
function polishDate(date) {
  return formatInTimeZone(date, APP_TIMEZONE, 'yyyy-MM-dd');
}

// the Polish clock time of a moment, e.g. '14:05'
function polishTime(date) {
  return formatInTimeZone(date, APP_TIMEZONE, 'HH:mm');
}

// '2026-11-22' + 3 days -> '2026-11-25' (calculated at UTC midnight, so a clock change does not matter)
function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// office_hours.start_date is a DATE column; Prisma expects a Date at UTC midnight
function toDbDate(dateText) {
  return new Date(`${dateText}T00:00:00Z`);
}

// now + 30 min, rounded up to a full 5 minutes (e.g. 14:02 -> 14:35)
function inThirtyMinutesRounded(now) {
  const fiveMinutesMs = 5 * MINUTE_MS;
  const target = now.getTime() + 30 * MINUTE_MS;
  return new Date(Math.ceil(target / fiveMinutesMs) * fiveMinutesMs);
}

// ---------------------------------------------------------------------------
// Office hours and slots
// ---------------------------------------------------------------------------

// One office hour row + its slot rows, both built in memory (inserted later with createMany).
function buildOfficeHour(lecturer, definition) {
  const officeHour = {
    id: randomUUID(),
    lecturerId: lecturer.id,
    recurrence: definition.recurrence,
    startDate: toDbDate(definition.startDate),
    endDate: toDbDate(definition.endDate),
    weekdays: definition.weekdays,
    startTime: definition.startTime,
    endTime: definition.endTime,
    slotDurationMin: definition.slotDurationMin,
    capacity: definition.capacity,
    mode: definition.mode,
    location: definition.location,
    note: definition.note || null,
  };

  const generatedSlots = generateSlots(definition, FAR_PAST);
  const slots = generatedSlots.map((generated) => ({
    id: randomUUID(),
    officeHourId: officeHour.id,
    lecturerId: lecturer.id,
    startsAt: generated.startsAt,
    endsAt: generated.endsAt,
    capacity: officeHour.capacity,
    bookedCount: 0, // filled in later from the CONFIRMED bookings
    mode: officeHour.mode,
    location: officeHour.location,
    status: SlotStatus.OPEN,
    cancelReason: null,
  }));

  return { officeHour, slots };
}

// Every lecturer: one WEEKLY office hour from 7 days ago to 14 days ahead, two weekdays, 14:00–16:00, 15 min slots
function weeklyDefinition(today, weekdays, capacity, mode, location) {
  return {
    recurrence: Recurrence.WEEKLY,
    startDate: addDays(today, -7),
    endDate: addDays(today, 14),
    weekdays,
    startTime: '14:00',
    endTime: '16:00',
    slotDurationMin: 15,
    capacity,
    mode,
    location,
  };
}

// A small ONCE office hour on one day (the scenario slots, outside 14:00–16:00)
function onceDefinition(date, startTime, endTime, slotDurationMin, capacity, mode, location) {
  return {
    recurrence: Recurrence.ONCE,
    startDate: date,
    endDate: date,
    weekdays: [],
    startTime,
    endTime,
    slotDurationMin,
    capacity,
    mode,
    location,
  };
}

// Scenario a: one slot starting exactly at `startsAt`. Built by hand instead of with generateSlots,
// because near midnight the 15 minutes may end on the next day.
function buildSingleSlotOfficeHour(lecturer, startsAt, mode, location) {
  const endsAt = new Date(startsAt.getTime() + 15 * MINUTE_MS);
  const date = polishDate(startsAt);

  const officeHour = {
    id: randomUUID(),
    lecturerId: lecturer.id,
    recurrence: Recurrence.ONCE,
    startDate: toDbDate(date),
    endDate: toDbDate(date),
    weekdays: [],
    startTime: polishTime(startsAt),
    endTime: polishTime(endsAt),
    slotDurationMin: 15,
    capacity: 1,
    mode,
    location,
    note: null,
  };

  const slot = {
    id: randomUUID(),
    officeHourId: officeHour.id,
    lecturerId: lecturer.id,
    startsAt,
    endsAt,
    capacity: 1,
    bookedCount: 0,
    mode,
    location,
    status: SlotStatus.OPEN,
    cancelReason: null,
  };

  return { officeHour, slots: [slot] };
}

// the first slot that starts after `after`
function firstSlotAfter(slots, after) {
  return slots.find((slot) => slot.startsAt > after);
}

// slots that have already ended
function finishedSlots(slots, now) {
  return slots.filter((slot) => slot.endsAt <= now);
}

// ---------------------------------------------------------------------------
// Bookings and outbox
// ---------------------------------------------------------------------------

function buildBooking(slot, student, topic, now) {
  return {
    id: randomUUID(),
    slotId: slot.id,
    studentId: student.id,
    topic,
    status: BookingStatus.CONFIRMED,
    cancelReason: null,
    cancelledAt: null,
    // booked two days before the slot, but never "in the future"
    createdAt: new Date(Math.min(slot.startsAt.getTime() - 2 * DAY_MS, now.getTime())),
  };
}

function buildCancelledBooking(slot, student, topic, status, reason, now) {
  return {
    ...buildBooking(slot, student, topic, now),
    status,
    cancelReason: reason,
    // booked yesterday, cancelled two hours ago
    createdAt: new Date(now.getTime() - DAY_MS),
    cancelledAt: new Date(now.getTime() - 2 * HOUR_MS),
  };
}

function buildSentEvent(booking, student, now) {
  return {
    id: randomUUID(),
    type: OutboxType.BOOKING_CONFIRMED,
    bookingId: booking.id,
    recipient: student.email,
    status: OutboxStatus.SENT,
    attempts: 1,
    lastError: null,
    createdAt: booking.createdAt,
    sentAt: new Date(Math.min(booking.createdAt.getTime() + 10 * 1000, now.getTime())),
  };
}

function buildFailedEvent(booking, student) {
  return {
    id: randomUUID(),
    type: OutboxType.BOOKING_CONFIRMED,
    bookingId: booking.id,
    recipient: student.email,
    status: OutboxStatus.FAILED,
    attempts: 3,
    lastError: 'connect ECONNREFUSED 127.0.0.1:1025',
    createdAt: booking.createdAt,
    sentAt: null,
  };
}

// slots.booked_count must equal the number of CONFIRMED bookings of the slot (the CHECK in the database
// and the booking logic rely on it), so we count them before inserting the slots
function fillBookedCounts(slots, bookings) {
  for (const booking of bookings) {
    if (booking.status !== BookingStatus.CONFIRMED) {
      continue;
    }
    const slot = slots.find((candidate) => candidate.id === booking.slotId);
    slot.bookedCount += 1;
  }
}

// ---------------------------------------------------------------------------
// All demo data in memory
// ---------------------------------------------------------------------------

function buildDemoData(now) {
  const today = polishDate(now);
  const { admin, lecturers, students } = buildUsers();
  const { kowalski, lukasiewicz, zolkiewski, wisniewska, zielinski } = lecturers;

  const studentByName = (firstName, lastName) =>
    students.find((student) => student.firstName === firstName && student.lastName === lastName);
  const annaNowak = studentByName('Anna', 'Nowak');
  const lucasMartin = studentByName('Lucas', 'Martin');
  const sofiaRossi = studentByName('Sofia', 'Rossi');
  const emmaJohnson = studentByName('Emma', 'Johnson');
  const jakubWojcik = studentByName('Jakub', 'Wójcik');
  const zuzannaKaminska = studentByName('Zuzanna', 'Kamińska');
  const mateuszLewandowski = studentByName('Mateusz', 'Lewandowski');
  const juliaDabrowska = studentByName('Julia', 'Dąbrowska');
  const kacperKozlowski = studentByName('Kacper', 'Kozłowski');
  const majaJankowska = studentByName('Maja', 'Jankowska');

  // Weekly office hours (weekdays: 1 = Mon … 7 = Sun)
  const weeklyKowalski = buildOfficeHour(
    kowalski,
    weeklyDefinition(today, [1, 3], 1, LocationMode.IN_PERSON, 'Sala 204, bud. B-1'),
  );
  const weeklyLukasiewicz = buildOfficeHour(
    lukasiewicz,
    weeklyDefinition(today, [2, 4], 1, LocationMode.ONLINE, TEAMS_LINK_LUKASIEWICZ),
  );
  const weeklyZolkiewski = buildOfficeHour(
    zolkiewski,
    weeklyDefinition(today, [2, 5], 1, LocationMode.IN_PERSON, 'Sala 112, bud. A-2'),
  );
  const weeklyWisniewska = buildOfficeHour(
    wisniewska,
    weeklyDefinition(today, [1, 4], 2, LocationMode.IN_PERSON, 'Pokój 305, bud. B-1'),
  );
  const weeklyZielinski = buildOfficeHour(
    zielinski,
    weeklyDefinition(today, [3, 5], 2, LocationMode.ONLINE, TEAMS_LINK_ZIELINSKI),
  );

  // Scenario a: Anna Nowak, dr hab. Wiśniewska, starts in ~30 min (inside the 60 min cancellation cut-off)
  const soonWisniewska = buildSingleSlotOfficeHour(
    wisniewska,
    inThirtyMinutesRounded(now),
    LocationMode.IN_PERSON,
    'Pokój 305, bud. B-1',
  );

  // Scenario b: Anna Nowak, prof. Łukasiewicz, in 3 days at 10:00, ONLINE (can be cancelled)
  const inThreeDaysLukasiewicz = buildOfficeHour(
    lukasiewicz,
    onceDefinition(addDays(today, 3), '10:00', '10:15', 15, 1, LocationMode.ONLINE, TEAMS_LINK_LUKASIEWICZ),
  );

  // Scenario c: the day after tomorrow dr Jan Kowalski 10:00–11:00, three 20 min slots, each booked ("Odwołaj dzień")
  const dayAfterTomorrowKowalski = buildOfficeHour(
    kowalski,
    onceDefinition(addDays(today, 2), '10:00', '11:00', 20, 1, LocationMode.IN_PERSON, 'Sala 204, bud. B-1'),
  );

  const officeHourGroups = [
    weeklyKowalski,
    weeklyLukasiewicz,
    weeklyZolkiewski,
    weeklyWisniewska,
    weeklyZielinski,
    soonWisniewska,
    inThreeDaysLukasiewicz,
    dayAfterTomorrowKowalski,
  ];

  const bookings = [];

  // a.
  const soonBooking = buildBooking(
    soonWisniewska.slots[0],
    annaNowak,
    'Pytanie o wymagania do projektu zaliczeniowego',
    now,
  );
  bookings.push(soonBooking);

  // b.
  const lukasiewiczBooking = buildBooking(
    inThreeDaysLukasiewicz.slots[0],
    annaNowak,
    'Omówienie zadań z kolokwium z analizy matematycznej',
    now,
  );
  bookings.push(lukasiewiczBooking);

  // c. (dr Kowalski has NO other future CONFIRMED bookings — the E2E tests rely on it)
  const [kowalskiSlot1, kowalskiSlot2, kowalskiSlot3] = dayAfterTomorrowKowalski.slots;
  const kowalskiBooking1 = buildBooking(kowalskiSlot1, jakubWojcik, 'Konsultacja tematu pracy inżynierskiej', now);
  const kowalskiBooking2 = buildBooking(kowalskiSlot2, lucasMartin, 'Questions about the database project', now);
  const kowalskiBooking3 = buildBooking(kowalskiSlot3, zuzannaKaminska, 'Poprawa sprawozdania z laboratorium', now);
  bookings.push(kowalskiBooking1, kowalskiBooking2, kowalskiBooking3);

  // d. a full future slot: capacity 2, two CONFIRMED bookings
  const fullSlot = firstSlotAfter(weeklyWisniewska.slots, new Date(now.getTime() + DAY_MS));
  const fullSlotBooking1 = buildBooking(fullSlot, sofiaRossi, 'Help with the algorithms assignment', now);
  const fullSlotBooking2 = buildBooking(fullSlot, mateuszLewandowski, 'Pytanie o złożoność algorytmów sortowania', now);
  bookings.push(fullSlotBooking1, fullSlotBooking2);

  // e. history: 5 past CONFIRMED bookings
  const pastLukasiewicz = finishedSlots(weeklyLukasiewicz.slots, now);
  const pastZolkiewski = finishedSlots(weeklyZolkiewski.slots, now);
  const pastWisniewska = finishedSlots(weeklyWisniewska.slots, now);
  const pastZielinski = finishedSlots(weeklyZielinski.slots, now);
  bookings.push(
    buildBooking(pastLukasiewicz[0], annaNowak, 'Przygotowanie do kolokwium z algebry', now),
    buildBooking(pastZolkiewski[1], annaNowak, 'Wyjaśnienie wyników ćwiczenia laboratoryjnego', now),
    buildBooking(pastWisniewska[2], juliaDabrowska, 'Wybór tematu projektu semestralnego', now),
    buildBooking(pastZielinski[0], emmaJohnson, 'Questions about the microeconomics exam', now),
    buildBooking(pastZielinski[3], kacperKozlowski, 'Omówienie oceny z kolokwium', now),
  );

  // e. two bookings cancelled by students (future slots, so the places are free again)
  const zielinskiFutureSlot = firstSlotAfter(weeklyZielinski.slots, new Date(now.getTime() + DAY_MS));
  const zolkiewskiFutureSlots = weeklyZolkiewski.slots.filter((slot) => slot.startsAt > now);
  bookings.push(
    buildCancelledBooking(
      zielinskiFutureSlot,
      annaNowak,
      'Pytanie o termin oddania eseju',
      BookingStatus.CANCELLED_BY_STUDENT,
      'Sprawa wyjaśniona mailowo',
      now,
    ),
    buildCancelledBooking(
      zolkiewskiFutureSlots[3],
      majaJankowska,
      'Konsultacja zadań domowych z mechaniki',
      BookingStatus.CANCELLED_BY_STUDENT,
      'Kolizja z innymi zajęciami',
      now,
    ),
  );

  // e. one slot cancelled by the lecturer, with its booking CANCELLED_BY_LECTURER
  const cancelledSlot = zolkiewskiFutureSlots[1];
  cancelledSlot.status = SlotStatus.CANCELLED;
  cancelledSlot.cancelReason = 'Wyjazd na konferencję naukową';
  bookings.push(
    buildCancelledBooking(
      cancelledSlot,
      annaNowak,
      'Pytanie o zakres materiału na egzamin z fizyki',
      BookingStatus.CANCELLED_BY_LECTURER,
      'Wyjazd na konferencję naukową',
      now,
    ),
  );

  // Notifications: 4 sent confirmations and 1 that failed three times (to show "Ponów" in the admin panel)
  const outboxEvents = [
    buildSentEvent(soonBooking, annaNowak, now),
    buildSentEvent(lukasiewiczBooking, annaNowak, now),
    buildSentEvent(kowalskiBooking1, jakubWojcik, now),
    buildSentEvent(fullSlotBooking1, sofiaRossi, now),
    buildFailedEvent(kowalskiBooking2, lucasMartin),
  ];

  const officeHours = officeHourGroups.map((group) => group.officeHour);
  const slots = officeHourGroups.flatMap((group) => group.slots);
  fillBookedCounts(slots, bookings);

  const users = [admin, ...Object.values(lecturers), ...students];

  return { users, officeHours, slots, bookings, outboxEvents };
}

// ---------------------------------------------------------------------------
// The exported function
// ---------------------------------------------------------------------------

// Wipes ALL data and inserts the demo data. Returns { durationMs, counts }.
export async function seedDemo(now) {
  const startedAt = Date.now();
  const data = buildDemoData(now);

  // one transaction: if anything fails, the old data stays untouched
  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`TRUNCATE outbox_events, bookings, slots, office_hours, users CASCADE`;
      await tx.user.createMany({ data: data.users });
      await tx.officeHour.createMany({ data: data.officeHours });
      await tx.slot.createMany({ data: data.slots });
      await tx.booking.createMany({ data: data.bookings });
      await tx.outboxEvent.createMany({ data: data.outboxEvents });
    },
    { timeout: 30000 },
  );

  const counts = {
    users: data.users.length,
    admins: data.users.filter((user) => user.role === Role.ADMIN).length,
    lecturers: data.users.filter((user) => user.role === Role.LECTURER).length,
    students: data.users.filter((user) => user.role === Role.STUDENT).length,
    officeHours: data.officeHours.length,
    slots: data.slots.length,
    bookings: data.bookings.length,
    outboxEvents: data.outboxEvents.length,
  };

  return { durationMs: Date.now() - startedAt, counts };
}
