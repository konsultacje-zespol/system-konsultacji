// "Booking e-mail data" — the plain object every e-mail text function receives:
// {
//   bookingId,       // string (uuid) — used by the calendar invitation in sprint 2
//   studentName,     // e.g. 'Anna Nowak'
//   studentEmail,
//   lecturerName,    // e.g. 'dr Jan Kowalski'
//   lecturerEmail,   // used by the calendar invitation in sprint 2
//   startsAt,        // Date
//   endsAt,          // Date
//   mode,            // 'IN_PERSON' | 'ONLINE'
//   location,        // room (IN_PERSON) or the https:// Teams link (ONLINE)
//   topic,
//   cancelReason,    // string or null
// }

// Example data for scripts/send-test-email.js and the unit tests
export const sampleBookingEmailData = {
  bookingId: '00000000-0000-4000-8000-000000000001',
  studentName: 'Anna Nowak',
  studentEmail: 'student@demo.konsultacje.local',
  lecturerName: 'dr Jan Kowalski',
  lecturerEmail: 'lecturer@demo.konsultacje.local',
  startsAt: new Date('2026-11-25T13:00:00Z'),
  endsAt: new Date('2026-11-25T13:15:00Z'),
  mode: 'IN_PERSON',
  location: 'C-13, sala 2.14',
  topic: 'Zadanie 3 z listy 5',
  cancelReason: null,
};
