import "server-only";

import { sql } from "drizzle-orm";

import type { Database } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { UnauthorizedError } from "./errors";
import { serverEnv } from "./env";

export type RequestUser = { id: string; email: string };

/**
 * Resolves the signed-in user for a request.
 *
 * There is no sign-in provider yet (Auth.js is planned, docs/ARCHITECTURE.md
 * §13). Until it lands, development and test environments can set
 * DEV_AUTH_EMAIL to act as one user; everywhere else every request is
 * unauthenticated and owner-scoped endpoints answer 401. This function is the
 * only place that changes when real sessions are added.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- sessions will read the cookie from it
export async function requireUser(db: Database, request: Request): Promise<RequestUser> {
  const env = serverEnv();
  if (env.NODE_ENV !== "production" && env.DEV_AUTH_EMAIL) {
    const email = env.DEV_AUTH_EMAIL.toLowerCase();
    const [user] = await db
      .insert(users)
      .values({ email })
      .onConflictDoUpdate({ target: users.email, set: { updatedAt: sql`${users.updatedAt}` } })
      .returning({ id: users.id, email: users.email });
    if (user) return user;
  }
  throw new UnauthorizedError();
}
