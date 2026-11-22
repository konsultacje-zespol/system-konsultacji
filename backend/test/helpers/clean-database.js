import { prisma } from '../../src/db.js';

// Empties every table (call it in beforeEach), so each test starts from an empty database.
export async function cleanDatabase() {
  await prisma.$executeRaw`TRUNCATE outbox_events, bookings, slots, office_hours, users CASCADE`;
}
