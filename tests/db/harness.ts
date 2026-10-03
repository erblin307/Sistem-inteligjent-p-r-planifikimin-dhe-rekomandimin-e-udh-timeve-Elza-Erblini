import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import { createDb, type Database } from "@/server/db/client";
import { seedReferenceData } from "@/server/db/seed/reference";

/**
 * Integration tests need TEST_DATABASE_URL pointing at a database whose name
 * ends in "_test". The schema is dropped and rebuilt from the migrations, so
 * the guard keeps this away from real data.
 */
export const testDatabaseUrl = process.env.TEST_DATABASE_URL;

export async function setupTestDatabase(): Promise<{ db: Database; pool: Pool }> {
  if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL is not set");
  const name = new URL(testDatabaseUrl).pathname.slice(1);
  if (!name.endsWith("_test")) {
    throw new Error(`Refusing to reset "${name}": test database names must end in _test`);
  }
  const pool = new Pool({ connectionString: testDatabaseUrl, max: 4 });
  const db = createDb(pool);
  await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  await migrate(db, { migrationsFolder: "drizzle" });
  await seedReferenceData(db);
  return { db, pool };
}

/** Postgres error code and constraint name, for asserting which rule fired. */
export async function pgError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    const cause = (error as { cause?: { code?: string; constraint?: string } }).cause ?? error;
    const { code, constraint } = cause as { code?: string; constraint?: string };
    return { code, constraint };
  }
  throw new Error("Expected the statement to fail");
}

export const PG = {
  uniqueViolation: "23505",
  foreignKeyViolation: "23503",
  checkViolation: "23514",
  notNullViolation: "23502",
} as const;
