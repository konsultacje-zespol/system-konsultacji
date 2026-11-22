import { PrismaClient } from '@prisma/client';

// the only PrismaClient in the whole app — every service imports this one.
// the configuration task (S1-BE2-1) will later pass the database URL from src/config.js here.
export const prisma = new PrismaClient();
