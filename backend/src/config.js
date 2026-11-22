import dotenv from 'dotenv';
import { z } from 'zod';

// Vitest always sets VITEST, so tests read .env.test and the app reads .env
dotenv.config({ path: process.env.VITEST ? '.env.test' : '.env' });

// Flags in .env are the text "true" or "false"; here they become real booleans
const booleanFlag = z.enum(['true', 'false']).transform((value) => value === 'true');

const envSchema = z.object({
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  AUTH_MOCK_ENABLED: booleanFlag,
  DEMO_RESET_ENABLED: booleanFlag,
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  MAIL_FROM: z.string().min(1),
  APP_URL: z.string().url(),
  BOOKING_CUTOFF_MINUTES: z.coerce.number().int().min(0),
  CANCEL_CUTOFF_MINUTES: z.coerce.number().int().min(0),
  MAX_ACTIVE_BOOKINGS_PER_STUDENT: z.coerce.number().int().min(1),
  OUTBOX_ENABLED: booleanFlag,
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  // The logger is not available yet (it needs LOG_LEVEL), so we print directly
  console.error('Błędne albo brakujące zmienne środowiskowe (sprawdź plik .env):');
  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

// The ONLY place that reads process.env. Everywhere else: import { config } from './config.js'
export const config = result.data;
