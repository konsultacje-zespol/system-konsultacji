-- two integrity rules Prisma cannot express in schema.prisma.
-- description and manual checks: docs/database.md.

-- 1) the booked count must never be negative nor exceed the slot capacity.
--    this is the last line of defence against overbooking (next to the atomic UPDATE in the booking service).
ALTER TABLE slots
  ADD CONSTRAINT chk_slots_booked_count CHECK (booked_count >= 0 AND booked_count <= capacity);

-- 2) a student may have only ONE active (CONFIRMED) booking for a given slot.
--    the index is partial (WHERE status = 'CONFIRMED'), so after cancelling a booking
--    the student can book the same slot again.
CREATE UNIQUE INDEX uq_bookings_active ON bookings (slot_id, student_id) WHERE status = 'CONFIRMED';
