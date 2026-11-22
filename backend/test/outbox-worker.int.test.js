import { BookingStatus, OutboxStatus, OutboxType, Role } from '@prisma/client';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../src/db.js';
import { sendMail } from '../src/notifications/mail.js';
import { processPending } from '../src/notifications/outbox-worker.js';
import { cleanDatabase } from './helpers/clean-database.js';
import { createBooking, createOfficeHourWithSlot, createUser } from './helpers/factories.js';

// No real e-mails in tests: sendMail is replaced with a fake function
vi.mock('../src/notifications/mail.js', () => ({ sendMail: vi.fn() }));

// A booking plus one PENDING outbox row for it
async function createPendingEvent(type, bookingStatus = BookingStatus.CONFIRMED) {
  const lecturer = await createUser({ role: Role.LECTURER });
  const student = await createUser({ role: Role.STUDENT });
  const { slot } = await createOfficeHourWithSlot({ lecturerId: lecturer.id });
  const booking = await createBooking({ slotId: slot.id, studentId: student.id, status: bookingStatus });

  const event = await prisma.outboxEvent.create({
    data: { type, bookingId: booking.id, recipient: student.email },
  });
  return { event, student, booking };
}

describe('outbox worker', () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.mocked(sendMail).mockReset();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('sends a confirmation and marks the row SENT', async () => {
    vi.mocked(sendMail).mockResolvedValue(undefined);
    const { event, student } = await createPendingEvent(OutboxType.BOOKING_CONFIRMED);

    const processed = await processPending();

    expect(processed).toBe(1);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: student.email, subject: expect.stringContaining('Potwierdzenie') }),
    );
    const saved = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(saved.status).toBe(OutboxStatus.SENT);
    expect(saved.sentAt).not.toBeNull();
  });

  it('after 3 failed attempts the row is FAILED with lastError', async () => {
    vi.mocked(sendMail).mockRejectedValue(new Error('SMTP is down'));
    const { event } = await createPendingEvent(OutboxType.BOOKING_CONFIRMED);

    await processPending();
    await processPending();
    await processPending();

    const saved = await prisma.outboxEvent.findUnique({ where: { id: event.id } });
    expect(saved.attempts).toBe(3);
    expect(saved.status).toBe(OutboxStatus.FAILED);
    expect(saved.lastError).toBe('SMTP is down');
  });

  it('BOOKING_CANCELLED_BY_LECTURER uses the lecturer-cancellation text', async () => {
    vi.mocked(sendMail).mockResolvedValue(undefined);
    const { booking } = await createPendingEvent(
      OutboxType.BOOKING_CANCELLED_BY_LECTURER,
      BookingStatus.CANCELLED_BY_LECTURER,
    );
    await prisma.booking.update({
      where: { id: booking.id },
      data: { cancelReason: 'Choroba prowadzącego', cancelledAt: new Date() },
    });

    await processPending();

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining('cancelled by the lecturer') }),
    );
  });
});
