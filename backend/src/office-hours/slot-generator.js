import { fromZonedTime } from 'date-fns-tz';
import { APP_TIMEZONE } from '../common/time.js';

// turns an office-hour definition into concrete slots with correct UTC times.
// input = {
//   recurrence: 'ONCE' | 'WEEKLY',
//   startDate, endDate: 'YYYY-MM-DD',
//   weekdays: numbers 1 = Mon … 7 = Sun (empty for ONCE),
//   startTime, endTime: 'HH:mm' (Polish time),
//   slotDurationMin: number
// }
// now is a Date; returns an array of { startsAt, endsAt } (both Date objects), sorted by startsAt.

// "14:30" -> 870
export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// 870 -> "14:30"
export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${pad(hours)}:${pad(minutes)}`;
}

function pad(number) {
  return String(number).padStart(2, '0');
}

// builds the list of 'YYYY-MM-DD' dates the slots should be generated for.
export function listDates(input) {
  if (input.recurrence === 'ONCE') {
    return [input.startDate];
  }

  const dates = [];
  // parse as UTC midnight so adding days never trips on a clock change.
  const current = new Date(input.startDate + 'T00:00:00Z');
  const end = new Date(input.endDate + 'T00:00:00Z');

  while (current <= end) {
    // getUTCDay() gives 0 = Sunday … 6 = Saturday; turn it into ISO 1 = Mon … 7 = Sun.
    const day = current.getUTCDay();
    const isoWeekday = day === 0 ? 7 : day;
    if (input.weekdays.includes(isoWeekday)) {
      dates.push(current.toISOString().slice(0, 10));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export function generateSlots(input, now) {
  const startMinute = timeToMinutes(input.startTime);
  const endMinute = timeToMinutes(input.endTime);
  const duration = input.slotDurationMin;
  const slots = [];

  for (const date of listDates(input)) {
    for (let start = startMinute; start + duration <= endMinute; start += duration) {
      // convert the local Polish time to UTC — fromZonedTime picks the right offset
      // for that exact date, so a clock change does not shift the hour.
      const localString = `${date}T${minutesToTime(start)}`;
      const startsAt = fromZonedTime(localString, APP_TIMEZONE);
      const endsAt = new Date(startsAt.getTime() + duration * 60000);

      // skip slots that have already started (or start exactly now).
      if (startsAt > now) {
        slots.push({ startsAt, endsAt });
      }
    }
  }

  slots.sort((a, b) => a.startsAt - b.startsAt);
  return slots;
}
