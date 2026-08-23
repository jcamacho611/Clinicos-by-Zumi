import "dotenv/config";
import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    console.error(`Render build failed to start ${command}.`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function migrationStatus(env) {
  return spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "status"],
    { stdio: "inherit", env },
  );
}

const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

// Compile first so an invalid candidate never changes a database.
console.log("Building Klinikos for production before database verification...");
run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
  env: process.env,
});

if (!databaseUrl) {
  console.warn(
    "DATABASE_URL is not configured during the build. The application was built without database migration verification.",
  );
  process.exit(0);
}

const databaseEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_DATABASE_URL: databaseUrl,
};

if (process.env.RENDER === "true") {
  console.log("Render build detected. Verifying migration status without mutating the database...");
  const status = migrationStatus(databaseEnv);
  if (status.error) {
    console.error("Render could not verify Klinikos migration status.", status.error);
    process.exit(1);
  }
  if (status.status !== 0) {
    console.error(
      "Render will not apply database migrations automatically. Production migration history must be reconciled through an explicit reviewed migration operation before this commit can deploy.",
    );
    process.exit(status.status ?? 1);
  }
  console.log("Klinikos production migration history is current. No database migration was executed by Render.");
  process.exit(0);
}

if (process.env.KLINIKOS_ALLOW_MIGRATION_DEPLOY === "disposable-verification") {
  console.log("Disposable verification build detected. Applying migrations to the verified disposable database...");
  run(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { env: databaseEnv },
  );
  process.exit(0);
}

console.error(
  "Database migration deployment is disabled by default. Use the reviewed production migration workflow, or set KLINIKOS_ALLOW_MIGRATION_DEPLOY=disposable-verification only inside the canonical release gate after its disposable-database safety check.",
);
process.exit(1);
