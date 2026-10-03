/**
 * pnpm db:seed              reference data + development fixtures
 * pnpm db:seed --reference  reference data only (safe for any environment)
 */
import { loadEnvConfig } from "@next/env";

import { getDb, getPool } from "@/server/db/client";
import { serverEnv } from "@/server/platform/env";
import { seedDevFixtures } from "./dev-fixtures";
import { seedReferenceData } from "./reference";

async function main() {
  // The environment is read lazily, so loading it here is early enough.
  loadEnvConfig(process.cwd());
  const referenceOnly = process.argv.includes("--reference");
  const db = getDb();

  try {
    await seedReferenceData(db);
    console.log("Seeded reference data (activity categories, amenities).");

    if (!referenceOnly) {
      if (serverEnv().NODE_ENV === "production") {
        throw new Error("Refusing to load development fixtures with NODE_ENV=production.");
      }
      await seedDevFixtures(db);
      console.log('Seeded development fixtures (source = "fixture").');
    }
  } finally {
    await getPool().end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
