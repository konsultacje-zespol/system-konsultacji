import { PrismaClient } from '@prisma/client';
import { config } from './config.js';

// the only PrismaClient in the whole app — every service imports this one.
// the database URL comes from src/config.js (checked at start-up), not straight from process.env.
export const prisma = new PrismaClient({
  datasources: { db: { url: config.DATABASE_URL } },
});
