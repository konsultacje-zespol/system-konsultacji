import { describe, expect, it } from 'vitest';
import { sampleBookingEmailData } from './booking-email-data.js';
import {
  bookingCancelledByLecturerEmail,
  bookingCancelledByStudentEmail,
  bookingConfirmedEmail,
} from './email-texts.js';

const APP_URL = 'http://localhost:5173';

describe('e-mail texts', () => {
  it('every e-mail has the Polish part, "---" and the English part', () => {
    const lecturerCancel = { ...sampleBookingEmailData, cancelReason: 'Choroba prowadzącego' };
    const emails = [
      bookingConfirmedEmail(sampleBookingEmailData, APP_URL),
      bookingCancelledByStudentEmail(sampleBookingEmailData),
      bookingCancelledByLecturerEmail(lecturerCancel, APP_URL),
    ];

    for (const email of emails) {
      expect(email.text).toContain('Dzień dobry');
      expect(email.text).toContain('\n---\n');
      expect(email.text).toContain('Hello');
      expect(email.subject).toContain(' / ');
    }
  });

  it('the confirmation for IN_PERSON shows the room and a link to the bookings', () => {
    const email = bookingConfirmedEmail(sampleBookingEmailData, APP_URL);

    expect(email.text).toContain('Miejsce: C-13, sala 2.14');
    expect(email.text).toContain('Place: C-13, sala 2.14');
    expect(email.text).toContain('http://localhost:5173/student/bookings');
  });

  it('the confirmation for ONLINE shows the Teams link', () => {
    const teamsLink = 'https://teams.microsoft.com/l/meetup-join/abc';
    const data = { ...sampleBookingEmailData, mode: 'ONLINE', location: teamsLink };

    const email = bookingConfirmedEmail(data, APP_URL);

    expect(email.text).toContain(`Microsoft Teams: ${teamsLink}`);
  });

  it('the lecturer cancellation contains the reason exactly as typed', () => {
    const data = { ...sampleBookingEmailData, cancelReason: 'Choroba prowadzącego' };

    const email = bookingCancelledByLecturerEmail(data, APP_URL);

    expect(email.text).toContain('Powód: „Choroba prowadzącego”');
    expect(email.text).toContain('Reason: "Choroba prowadzącego"');
    expect(email.text).toContain('http://localhost:5173/student/dashboard');
  });

  it('shows 2026-11-25T13:00:00Z as 14:00 Polish time', () => {
    const email = bookingConfirmedEmail(sampleBookingEmailData, APP_URL);

    expect(email.subject).toContain('25.11.2026 14:00');
    expect(email.text).toContain('25 listopada 2026, 14:00–14:15 (czas polski)');
    expect(email.text).toContain('25 November 2026, 14:00–14:15 (Polish time)');
  });
});
