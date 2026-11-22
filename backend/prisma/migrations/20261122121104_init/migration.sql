-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'LECTURER', 'ADMIN');

-- CreateEnum
CREATE TYPE "LocationMode" AS ENUM ('IN_PERSON', 'ONLINE');

-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('ONCE', 'WEEKLY');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('OPEN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED_BY_STUDENT', 'CANCELLED_BY_LECTURER');

-- CreateEnum
CREATE TYPE "OutboxType" AS ENUM ('BOOKING_CONFIRMED', 'BOOKING_CANCELLED_BY_STUDENT', 'BOOKING_CANCELLED_BY_LECTURER');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "search_name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "title" TEXT,
    "department" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "office_hours" (
    "id" UUID NOT NULL,
    "lecturer_id" UUID NOT NULL,
    "recurrence" "Recurrence" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "weekdays" INTEGER[],
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "slot_duration_min" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "mode" "LocationMode" NOT NULL,
    "location" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "office_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slots" (
    "id" UUID NOT NULL,
    "office_hour_id" UUID NOT NULL,
    "lecturer_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "booked_count" INTEGER NOT NULL DEFAULT 0,
    "mode" "LocationMode" NOT NULL,
    "location" TEXT NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'OPEN',
    "cancel_reason" TEXT,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "slot_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "topic" VARCHAR(300) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "cancel_reason" TEXT,
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "type" "OutboxType" NOT NULL,
    "booking_id" UUID NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "office_hours_lecturer_id_idx" ON "office_hours"("lecturer_id");

-- CreateIndex
CREATE INDEX "slots_lecturer_id_starts_at_idx" ON "slots"("lecturer_id", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "slots_office_hour_id_starts_at_key" ON "slots"("office_hour_id", "starts_at");

-- CreateIndex
CREATE INDEX "bookings_student_id_status_idx" ON "bookings"("student_id", "status");

-- CreateIndex
CREATE INDEX "outbox_events_status_created_at_idx" ON "outbox_events"("status", "created_at");

-- AddForeignKey
ALTER TABLE "office_hours" ADD CONSTRAINT "office_hours_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_office_hour_id_fkey" FOREIGN KEY ("office_hour_id") REFERENCES "office_hours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
