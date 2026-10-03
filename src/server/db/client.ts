import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { serverEnv } from "@/server/platform/env";
import * as schema from "./schema";

/**
 * One pool per process. In development Next.js reloads modules, so the pool
 * is kept on globalThis to avoid exhausting connections.
 *
 * This module has no `server-only` guard because scripts (seed, migrate) use
 * it too. Repositories that Next.js imports carry the guard.
 */

export type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __itineraPool?: Pool };

function createPool() {
  return new Pool({ connectionString: serverEnv().DATABASE_URL, max: 10 });
}

export function getPool(): Pool {
  globalForDb.__itineraPool ??= createPool();
  return globalForDb.__itineraPool;
}

let dbInstance: Database | undefined;

export function getDb(): Database {
  dbInstance ??= drizzle(getPool(), { schema, casing: "snake_case" });
  return dbInstance;
}

export function createDb(pool: Pool): Database {
  return drizzle(pool, { schema, casing: "snake_case" });
}
