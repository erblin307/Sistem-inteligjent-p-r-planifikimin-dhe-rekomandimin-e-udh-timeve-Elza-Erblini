import { z } from "zod";

/**
 * Server environment, validated on use. Fails with a clear message instead
 * of a driver error deep inside a request. Parsing a handful of variables is
 * cheap, so nothing is cached and tests can change the environment.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .refine((v) => /^postgres(ql)?:\/\//.test(v), "DATABASE_URL must be a postgres:// URL"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /**
   * Development-only stand-in for sign-in until Auth.js is added: requests
   * act as this user. Ignored when NODE_ENV is production.
   */
  DEV_AUTH_EMAIL: z.email().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function serverEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid server environment: ${issues}`);
  }
  return parsed.data;
}
