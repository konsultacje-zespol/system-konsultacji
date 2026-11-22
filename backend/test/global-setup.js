import { execSync } from 'node:child_process';
import dotenv from 'dotenv';

// Runs ONCE before all integration test files: rebuilds the test database from the migrations.
export default function setup() {
  dotenv.config({ path: '.env.test' });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Brak DATABASE_URL — skopiuj backend/.env.test.example do backend/.env.test');
  }

  // Safety check: "migrate reset" deletes ALL data, so it may run only on a test database
  const databaseName = new URL(databaseUrl).pathname.slice(1);
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Testy integracyjne wyczyściłyby bazę "${databaseName}". ` +
        'DATABASE_URL w .env.test musi wskazywać bazę, której nazwa kończy się na "_test".',
    );
  }

  // --skip-generate: the Prisma client already exists after npm install (and on Windows
  // regenerating it fails when another process, e.g. npm run dev, holds the engine file)
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
}
