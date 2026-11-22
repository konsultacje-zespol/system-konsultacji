import { LocationMode, Recurrence } from '@prisma/client';
import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;
const ALLOWED_SLOT_DURATIONS = [10, 15, 20, 30, 45, 60];

// body of POST /lecturer/office-hours. rules that compare fields with each other
// (dates, hours, the online link) are checked in office-hours.service.js.
export const createOfficeHourSchema = z
  .object({
    recurrence: z.nativeEnum(Recurrence),
    startDate: z.string().regex(DATE_REGEX, 'startDate must have the format YYYY-MM-DD'),
    endDate: z.string().regex(DATE_REGEX, 'endDate must have the format YYYY-MM-DD'),
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .refine((days) => new Set(days).size === days.length, 'weekdays must not contain duplicates'),
    startTime: z.string().regex(TIME_REGEX, 'startTime must have the format HH:mm'),
    endTime: z.string().regex(TIME_REGEX, 'endTime must have the format HH:mm'),
    slotDurationMin: z
      .number()
      .int()
      .refine((minutes) => ALLOWED_SLOT_DURATIONS.includes(minutes), 'slotDurationMin must be one of 10, 15, 20, 30, 45, 60'),
    capacity: z.number().int().min(1).max(20),
    mode: z.nativeEnum(LocationMode),
    location: z.string().trim().min(2).max(500),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export const idParamsSchema = z.object({
  id: z.string().uuid(),
});
