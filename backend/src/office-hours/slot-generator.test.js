import { describe, it, expect } from 'vitest';
import {
  generateSlots,
  listDates,
  timeToMinutes,
  minutesToTime,
} from './slot-generator.js';

// unless a test says otherwise, "now" is far before every slot, so nothing is skipped.
const DEFAULT_NOW = new Date('2026-01-01T00:00:00Z');

describe('timeToMinutes / minutesToTime', () => {
  it('converts both ways', () => {
    expect(timeToMinutes('14:30')).toBe(870);
    expect(minutesToTime(870)).toBe('14:30');
    expect(minutesToTime(600)).toBe('10:00');
  });
});

describe('listDates', () => {
  it('ONCE returns only the start date', () => {
    expect(
      listDates({ recurrence: 'ONCE', startDate: '2026-11-25', endDate: '2026-11-25', weekdays: [] }),
    ).toEqual(['2026-11-25']);
  });

  it('WEEKLY returns every matching weekday in the range (inclusive)', () => {
    // Mon (1) and Wed (3) from Mon 2026-11-23 to Wed 2026-12-09
    const dates = listDates({ recurrence: 'WEEKLY', startDate: '2026-11-23', endDate: '2026-12-09', weekdays: [1, 3] });
    expect(dates).toEqual(['2026-11-23', '2026-11-25', '2026-11-30', '2026-12-02', '2026-12-07', '2026-12-09']);
  });
});

describe('generateSlots', () => {
  it('ONCE 14:00-15:00 every 15 min -> 4 slots, first at 13:00Z', () => {
    const slots = generateSlots(
      { recurrence: 'ONCE', startDate: '2026-11-25', endDate: '2026-11-25', weekdays: [], startTime: '14:00', endTime: '15:00', slotDurationMin: 15 },
      DEFAULT_NOW,
    );
    expect(slots).toHaveLength(4);
    expect(slots[0].startsAt.toISOString()).toBe('2026-11-25T13:00:00.000Z');
    expect(slots[0].endsAt.toISOString()).toBe('2026-11-25T13:15:00.000Z');
  });

  it('WEEKLY Mon+Wed for 3 weeks, 30 min -> 12 slots, last on the end date', () => {
    const slots = generateSlots(
      { recurrence: 'WEEKLY', startDate: '2026-11-23', endDate: '2026-12-09', weekdays: [1, 3], startTime: '14:00', endTime: '15:00', slotDurationMin: 30 },
      DEFAULT_NOW,
    );
    expect(slots).toHaveLength(12);
    // last slot is on the end date 2026-12-09 at 14:30 Polish winter time = 13:30Z
    expect(slots[slots.length - 1].startsAt.toISOString()).toBe('2026-12-09T13:30:00.000Z');
  });

  it('14:00-16:00 every 20 min -> 6 slots per day', () => {
    const slots = generateSlots(
      { recurrence: 'ONCE', startDate: '2026-11-25', endDate: '2026-11-25', weekdays: [], startTime: '14:00', endTime: '16:00', slotDurationMin: 20 },
      DEFAULT_NOW,
    );
    expect(slots).toHaveLength(6);
  });

  it('skips slots that are not after now', () => {
    const now = new Date('2026-11-25T13:20:00Z');
    const slots = generateSlots(
      { recurrence: 'ONCE', startDate: '2026-11-25', endDate: '2026-11-25', weekdays: [], startTime: '14:00', endTime: '15:00', slotDurationMin: 15 },
      now,
    );
    // the 13:00Z and 13:15Z slots are in the past; only 13:30Z and 13:45Z remain
    expect(slots).toHaveLength(2);
    expect(slots[0].startsAt.toISOString()).toBe('2026-11-25T13:30:00.000Z');
  });

  it('clock change in October: summer 12:00Z before, winter 13:00Z after', () => {
    const slots = generateSlots(
      { recurrence: 'WEEKLY', startDate: '2026-10-21', endDate: '2026-10-28', weekdays: [3], startTime: '14:00', endTime: '14:15', slotDurationMin: 15 },
      DEFAULT_NOW,
    );
    expect(slots).toHaveLength(2);
    expect(slots[0].startsAt.toISOString()).toBe('2026-10-21T12:00:00.000Z');
    expect(slots[1].startsAt.toISOString()).toBe('2026-10-28T13:00:00.000Z');
  });

  it('clock change in March: winter 13:00Z before, summer 12:00Z after', () => {
    const slots = generateSlots(
      { recurrence: 'WEEKLY', startDate: '2026-03-25', endDate: '2026-04-01', weekdays: [3], startTime: '14:00', endTime: '14:15', slotDurationMin: 15 },
      DEFAULT_NOW,
    );
    expect(slots).toHaveLength(2);
    expect(slots[0].startsAt.toISOString()).toBe('2026-03-25T13:00:00.000Z');
    expect(slots[1].startsAt.toISOString()).toBe('2026-04-01T12:00:00.000Z');
  });
});
