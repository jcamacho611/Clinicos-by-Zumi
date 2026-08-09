import "dotenv/config";
import { spawn, spawnSync } from "node:child_process";

const databaseConfigured = Boolean(process.env.DATABASE_URL);

if (databaseConfigured) {
  const migrationEnv = {
    ...process.env,
    DATABASE_URL: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
  };
  const migration = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    { env: migrationEnv, stdio: "inherit" },
  );

  if (migration.status !== 0) {
    console.error("ClinicOS startup stopped because the configured database migration failed.");
    process.exit(migration.status ?? 1);
  }
} else {
  console.warn(
    "DATABASE_URL is not configured. Starting the public ClinicOS demonstration shell; authenticated and persisted workflows remain unavailable.",
  );
}

const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start"],
  { env: process.env, stdio: "inherit" },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", (code, signal) => {
  process.exit(signal === "SIGTERM" ? 0 : (code ?? 1));
});

server.on("error", (error) => {
  console.error("ClinicOS server failed to start.", error);
  process.exit(1);
});
