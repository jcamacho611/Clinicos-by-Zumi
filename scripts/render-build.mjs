import "dotenv/config";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import {
  parsePendingMigrationNames,
  validatePendingMigrations,
} from "./release/production-migration-policy.mjs";

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
    { encoding: "utf8", env },
  );
}

function printProcessOutput(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

// Compile first so an invalid candidate never changes a database.
// During a rolling deploy the old and new application versions can overlap, so only
// explicitly approved additive migrations may advance automatically on Render.
// Destructive, unknown, modified-after-approval, or unparsable migration states fail closed.
console.log("Building Klinikos for production before database verification...");
run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
  env: process.env,
});

if (!databaseUrl) {
  if (process.env.RENDER === "true") {
    console.error(
      "Render database verification requires DATABASE_URL or DIRECT_DATABASE_URL. Refusing to deploy without a verified production database contract.",
    );
    process.exit(1);
  }

  console.warn(
    "DATABASE_URL is not configured. The application was built without database migration verification.",
  );
  process.exit(0);
}

const databaseEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_DATABASE_URL: databaseUrl,
};

if (process.env.RENDER === "true") {
  console.log("Render build detected. Verifying production migration status...");
  const status = migrationStatus(databaseEnv);
  printProcessOutput(status);

  if (status.error) {
    console.error("Render could not verify Klinikos migration status.", status.error);
    process.exit(1);
  }

  if (status.status === 0) {
    console.log("Klinikos production migration history is current.");
    process.exit(0);
  }

  const migrationOutput = `${status.stdout ?? ""}\n${status.stderr ?? ""}`;
  const pendingMigrationNames = parsePendingMigrationNames(migrationOutput);

  try {
    const approved = validatePendingMigrations({
      pendingMigrationNames,
      migrationsDir: join(process.cwd(), "prisma", "migrations"),
    });
    console.log(
      `Approved additive production migrations: ${approved
        .map(({ migrationName }) => migrationName)
        .join(", ")}`,
    );
  } catch (error) {
    console.error(
      "Production migration state is not approved for automatic deployment. Refusing to mutate the database.",
      error,
    );
    process.exit(status.status ?? 1);
  }

  console.log("Applying explicitly approved additive production migrations...");
  run(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { env: databaseEnv },
  );

  console.log("Re-verifying production migration status after deploy...");
  const postDeployStatus = migrationStatus(databaseEnv);
  printProcessOutput(postDeployStatus);
  if (postDeployStatus.error || postDeployStatus.status !== 0) {
    console.error(
      "Approved migration deployment ran, but production migration history is still not current. Refusing the application deploy.",
      postDeployStatus.error ?? "",
    );
    process.exit(postDeployStatus.status ?? 1);
  }

  console.log("Klinikos production migration history is current after governed migration deploy.");
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
  "Database migration deployment is disabled by default outside Render's governed additive path. Use the reviewed production migration workflow, or set KLINIKOS_ALLOW_MIGRATION_DEPLOY=disposable-verification only inside the canonical release gate after its disposable-database safety check.",
);
process.exit(1);
