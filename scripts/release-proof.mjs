import { spawn, spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const codeOnly = args.has("--code-only");
const allowDatabaseMigrations = args.has("--allow-database-migrations");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const startedAt = Date.now();
const evidence = [];

function elapsed() {
  return `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
}

function record(name, status, detail = "") {
  evidence.push({ name, status, detail });
  const suffix = detail ? ` — ${detail}` : "";
  console.log(`[release-proof] ${status.toUpperCase()} ${name}${suffix}`);
}

function run(name, command, commandArgs, options = {}) {
  const stepStartedAt = Date.now();
  console.log(`\n[release-proof] START ${name}`);
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    env: process.env,
    ...options,
  });

  if (result.error) {
    record(name, "failed", result.error.message);
    throw result.error;
  }

  if (result.status !== 0) {
    record(name, "failed", `exit ${result.status ?? 1}`);
    process.exit(result.status ?? 1);
  }

  record(name, "passed", `${((Date.now() - stepStartedAt) / 1000).toFixed(1)}s`);
}

async function waitForHttp(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.ok || (response.status >= 300 && response.status < 400)) {
        return response;
      }
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw lastError ?? new Error(`${url} did not become ready before timeout`);
}

async function startupSmoke() {
  const name = "production startup smoke";
  const port = process.env.KLINIKOS_RELEASE_PROOF_PORT || "3100";
  const env = {
    ...process.env,
    NODE_ENV: "production",
    PORT: port,
  };

  console.log(`\n[release-proof] START ${name} on port ${port}`);
  const child = spawn(npmCommand, ["start"], {
    env,
    stdio: "inherit",
  });

  let exited = false;
  let exitCode = null;
  child.once("exit", (code) => {
    exited = true;
    exitCode = code;
  });

  try {
    const health = `http://127.0.0.1:${port}/api/health`;
    const root = `http://127.0.0.1:${port}/`;
    await waitForHttp(health, 45000);
    if (exited) {
      throw new Error(`server exited before smoke completed (exit ${exitCode ?? "unknown"})`);
    }
    await waitForHttp(root, 15000);
    record(name, "passed", `${health} and / responded`);
  } catch (error) {
    record(name, "failed", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    if (!exited) child.kill("SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  if (process.exitCode) process.exit(process.exitCode);
}

console.log("Klinikos release proof");
console.log(`[release-proof] node ${process.version}`);
console.log(`[release-proof] mode ${codeOnly ? "code-only" : "full-release"}`);
console.log(
  `[release-proof] candidate ${process.env.GITHUB_SHA || process.env.RENDER_GIT_COMMIT || process.env.KLINIKOS_CANDIDATE_SHA || "local-working-tree"}`,
);

run("Prisma client generation", npmCommand, ["run", "db:generate"]);
run("Prisma schema validation", npmCommand, ["run", "db:validate"]);
run("TypeScript", npmCommand, ["run", "type-check"]);
run("ESLint", npmCommand, ["run", "lint"]);
run("unit and contract tests", npmCommand, ["test"]);
run("production build", npmCommand, ["run", "build"]);

if (!codeOnly) {
  const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error(
      "\n[release-proof] FULL RELEASE PROOF REFUSED: DATABASE_URL or DIRECT_DATABASE_URL is required for migration and MVP-journey proof.",
    );
    process.exit(2);
  }

  if (!allowDatabaseMigrations) {
    console.error(
      "\n[release-proof] FULL RELEASE PROOF REFUSED: pass --allow-database-migrations only when the configured database is a disposable/test database you are authorized to migrate.",
    );
    process.exit(2);
  }

  run("database migration deploy", process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  });
  run("database-backed MVP journeys", npmCommand, ["run", "test:mvp"]);
  await startupSmoke();
}

console.log(`\n[release-proof] COMPLETE in ${elapsed()}`);
for (const item of evidence) {
  console.log(`[release-proof] ${item.status.toUpperCase()} ${item.name}${item.detail ? ` — ${item.detail}` : ""}`);
}
