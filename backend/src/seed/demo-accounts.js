import { Role } from '@prisma/client';

// The three demo accounts shown as big buttons on the login page.
// Fixed UUIDs: after "Reset demo data" the ids stay the same, so open sessions keep working.
// The seed task (S1-DQ-4) inserts these users into the database.

export const DEMO_STUDENT = {
  id: 'a0000000-0000-4000-8000-000000000001',
  email: 'student@demo.konsultacje.local',
  firstName: 'Anna',
  lastName: 'Nowak',
  title: null,
  role: Role.STUDENT,
};

export const DEMO_LECTURER = {
  id: 'a0000000-0000-4000-8000-000000000002',
  email: 'lecturer@demo.konsultacje.local',
  firstName: 'Jan',
  lastName: 'Kowalski',
  title: 'dr',
  role: Role.LECTURER,
};

export const DEMO_ADMIN = {
  id: 'a0000000-0000-4000-8000-000000000003',
  email: 'admin@demo.konsultacje.local',
  firstName: 'Administrator',
  lastName: 'Systemu',
  title: null,
  role: Role.ADMIN,
};
