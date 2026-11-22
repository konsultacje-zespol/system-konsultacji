import { prisma } from '../src/db.js';
import { logger } from '../src/logger.js';
import { seedDemo } from '../src/seed/seed-demo.js';

// `npx prisma db seed` runs this file (see "prisma.seed" in package.json).
// It wipes the database from .env and fills it with the demo data.
try {
  const { durationMs, counts } = await seedDemo(new Date());
  logger.info({ counts }, `Dane demo wczytane w ${durationMs} ms`);
} finally {
  await prisma.$disconnect();
}
