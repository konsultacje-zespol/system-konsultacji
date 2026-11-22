import { enGB, pl } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import { APP_TIMEZONE } from '../common/time.js';

// Every e-mail is plain text: Polish first, then a line "---", then English.
// Each function returns { subject, text }. Data shape: see booking-email-data.js.

// "25.11.2026 14:00" — used in the subject
function formatSubjectDate(date) {
  return formatInTimeZone(date, APP_TIMEZONE, 'dd.MM.yyyy HH:mm');
}

// "25 listopada 2026, 14:00–14:15 (czas polski)"
function formatTermPl(startsAt, endsAt) {
  const day = formatInTimeZone(startsAt, APP_TIMEZONE, 'd MMMM yyyy', { locale: pl });
  const start = formatInTimeZone(startsAt, APP_TIMEZONE, 'HH:mm');
  const end = formatInTimeZone(endsAt, APP_TIMEZONE, 'HH:mm');
  return `${day}, ${start}–${end} (czas polski)`;
}

// "25 November 2026, 14:00–14:15 (Polish time)"
function formatTermEn(startsAt, endsAt) {
  const day = formatInTimeZone(startsAt, APP_TIMEZONE, 'd MMMM yyyy', { locale: enGB });
  const start = formatInTimeZone(startsAt, APP_TIMEZONE, 'HH:mm');
  const end = formatInTimeZone(endsAt, APP_TIMEZONE, 'HH:mm');
  return `${day}, ${start}–${end} (Polish time)`;
}

// The room as typed by the lecturer, or the Teams link for online office hours
function formatPlace(mode, location) {
  if (mode === 'ONLINE') {
    return `Microsoft Teams: ${location}`;
  }
  return location;
}

export function bookingConfirmedEmail(data, appUrl) {
  const subject = `Potwierdzenie konsultacji / Consultation confirmed — ${formatSubjectDate(data.startsAt)}`;
  const bookingsLink = `${appUrl}/student/bookings`;
  const place = formatPlace(data.mode, data.location);

  const text = `Dzień dobry ${data.studentName},

potwierdzamy zapis na konsultacje.

Prowadzący: ${data.lecturerName}
Termin: ${formatTermPl(data.startsAt, data.endsAt)}
Miejsce: ${place}
Temat: ${data.topic}

Rezerwację możesz odwołać najpóźniej 60 minut przed rozpoczęciem:
${bookingsLink}

---

Hello ${data.studentName},

your consultation booking is confirmed.

Lecturer: ${data.lecturerName}
Date: ${formatTermEn(data.startsAt, data.endsAt)}
Place: ${place}
Topic: ${data.topic}

You can cancel the booking up to 60 minutes before the start:
${bookingsLink}
`;

  return { subject, text };
}

export function bookingCancelledByStudentEmail(data) {
  const subject = `Odwołanie konsultacji / Consultation cancelled — ${formatSubjectDate(data.startsAt)}`;

  const text = `Dzień dobry ${data.studentName},

potwierdzamy odwołanie Twojej rezerwacji.

Prowadzący: ${data.lecturerName}
Termin: ${formatTermPl(data.startsAt, data.endsAt)}
Temat: ${data.topic}

---

Hello ${data.studentName},

your booking has been cancelled as you requested.

Lecturer: ${data.lecturerName}
Date: ${formatTermEn(data.startsAt, data.endsAt)}
Topic: ${data.topic}
`;

  return { subject, text };
}

export function bookingCancelledByLecturerEmail(data, appUrl) {
  const subject = `Konsultacje odwołane / Consultation cancelled by the lecturer — ${formatSubjectDate(data.startsAt)}`;
  const dashboardLink = `${appUrl}/student/dashboard`;

  // The reason is shown exactly as the lecturer typed it — it is never translated
  const text = `Dzień dobry ${data.studentName},

prowadzący ${data.lecturerName} odwołał(a) konsultacje.

Termin: ${formatTermPl(data.startsAt, data.endsAt)}
Temat: ${data.topic}
Powód: „${data.cancelReason}”

Inny termin możesz znaleźć tutaj:
${dashboardLink}

---

Hello ${data.studentName},

${data.lecturerName} has cancelled the consultation.

Date: ${formatTermEn(data.startsAt, data.endsAt)}
Topic: ${data.topic}
Reason: "${data.cancelReason}"

You can find another date here:
${dashboardLink}
`;

  return { subject, text };
}
