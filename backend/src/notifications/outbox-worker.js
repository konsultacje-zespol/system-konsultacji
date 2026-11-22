import { OutboxStatus, OutboxType } from '@prisma/client';
import { config } from '../config.js';
import { prisma } from '../db.js';
import { logger } from '../logger.js';
import { loadBookingEmailData } from './booking-email-data.js';
import {
  bookingCancelledByLecturerEmail,
  bookingCancelledByStudentEmail,
  bookingConfirmedEmail,
} from './email-texts.js';
import { sendMail } from './mail.js';

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 20;
const INTERVAL_MS = 10000; // every 10 seconds

// Sends up to 20 oldest PENDING e-mails, one after another. Returns how many were processed.
export async function processPending() {
  const events = await prisma.outboxEvent.findMany({
    where: { status: OutboxStatus.PENDING },
    orderBy: { createdAt: 'asc' },
    take: BATCH_SIZE,
  });

  for (const event of events) {
    await sendOne(event);
  }

  return events.length;
}

function buildEmail(type, data) {
  switch (type) {
    case OutboxType.BOOKING_CONFIRMED:
      return bookingConfirmedEmail(data, config.APP_URL);
    case OutboxType.BOOKING_CANCELLED_BY_STUDENT:
      return bookingCancelledByStudentEmail(data);
    case OutboxType.BOOKING_CANCELLED_BY_LECTURER:
      return bookingCancelledByLecturerEmail(data, config.APP_URL);
    default:
      throw new Error(`Unknown outbox event type: ${type}`);
  }
}

async function sendOne(event) {
  try {
    const data = await loadBookingEmailData(event.bookingId);
    if (!data) {
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: OutboxStatus.FAILED, lastError: 'Booking not found' },
      });
      return;
    }

    const { subject, text } = buildEmail(event.type, data);
    await sendMail({ to: event.recipient, subject, text });

    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: { status: OutboxStatus.SENT, sentAt: new Date() },
    });
  } catch (error) {
    // After the 3rd failed attempt we give up (FAILED); the admin can retry it from the panel
    const attempts = event.attempts + 1;
    let status = OutboxStatus.PENDING;
    if (attempts >= MAX_ATTEMPTS) {
      status = OutboxStatus.FAILED;
    }

    await prisma.outboxEvent.update({
      where: { id: event.id },
      data: { attempts, status, lastError: String(error.message).slice(0, 500) },
    });
    logger.error({ err: error, eventId: event.id }, 'Sending an outbox e-mail failed');
  }
}

// Started by server.js (never by createApp, so tests are not affected).
// Returns a function that stops the worker.
export function startOutboxWorker() {
  // isRunning prevents a second round from starting while the previous one is still sending
  let isRunning = false;

  const timer = setInterval(async () => {
    if (isRunning) {
      return;
    }
    isRunning = true;
    try {
      await processPending();
    } catch (error) {
      logger.error(error);
    } finally {
      isRunning = false;
    }
  }, INTERVAL_MS);

  return function stopOutboxWorker() {
    clearInterval(timer);
  };
}
