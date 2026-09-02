#!/usr/bin/env node
/**
 * The canonical release gate: one command that proves a candidate can actually ship
 * through Klinikos' production host, Render.
 *
 * The full gate deliberately reproduces the repository's Render install/build/start
 * contract while keeping database mutation isolated to a verified disposable target.
 *
 *   npm ci --include=dev --ignore-scripts
 *   npm run render:build
 *   npm start
 *
 * It adds schema, security, type, lint, tests, disposable-database migration proof,
 * MVP journeys, startup, and health around that host contract. Production Render builds
 * are status-only for migrations; this verifier explicitly unlocks migration deployment
 * only after proving its target is an empty disposable database.
 *
 * Usage:
 *   npm run verify:release          full Render-aligned gate; needs disposable DATABASE_URL
 *   npm run verify:code             code-only gate; no migration/journey/startup proof
 */

import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { assertDisposableDatabase } from "./release/disposable-database-safety.mjs";

const CODE_ONLY = process.argv.includes("--code-only");
const startedAt = Date.now();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
// These suites intentionally prove PostgreSQL behavior and therefore belong to the
// full disposable-database gate. Keep this list exact: broad filename globs would skip
// pure persistence/domain tests that still must run without a database.
const CODE_ONLY_DATABASE_TESTS = [
  "tests/career-artifact.test.ts",
  "tests/clinical-placement-persistence.test.ts",
  "tests/person-context-db.test.ts",
  "tests/person-context-db-ambiguity.test.ts",
  "tests/person-relationship-db.test.ts",
  "tests/person-account-signup-db.test.ts",
  "src/features/zumi/phi-provider-evidence-repository.test.ts",
];

function codeOnlyVitestArgs() {
  return [
    "vitest",
    "run",
    ...CODE_ONLY_DATABASE_TESTS.flatMap((testFile) => ["--exclude", testFile]),
  ];
}

/** Hosts that are never acceptable targets for a gate that migrates an empty database. */
/**
 * Prisma generate/validate parse the schema but do not need a live connection. Give them
 * a syntactically valid URL when no usable database URL is configured so failures report
 * schema truth rather than an irrelevant connection-string error.
 */
function schemaParseUrl(configured) {
  const usable = configured?.startsWith("postgresql://") || configured?.startsWith("postgres://");
  return usable ? configured : "postgresql://schema-parse-only@127.0.0.1:5432/schema-parse-only";
}

function log(kind, message) {
  const glyph = { run: "→", ok: "✓", fail: "✗", skip: "·", info: " " }[kind] ?? " ";
  process.stdout.write(`${glyph} ${message}\n`);
}

function run(name, command, args, options = {}) {
  log("run", name);
  const result = spawnSync(command, args, {
    stdio: options.quiet ? "pipe" : "inherit",
    env: { ...process.env, ...options.env },
    encoding: "utf8",
  });
  if (result.status !== 0) {
    if (options.quiet) process.stdout.write(`${result.stdout ?? ""}${result.stderr ?? ""}\n`);
    throw new Error(`${name} failed (exit ${result.status ?? "signal " + result.signal})`);
  }
  return result.stdout ?? "";
}

/** Refuse to run the migration gate against anything that could be real. */
/** Poll until the server answers or the deadline passes. Never use a blind sleep. */
async function waitForHealth(url, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no response";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      const body = await response.text();
      if (response.ok) return body;
      lastError = `HTTP ${response.status}: ${body.slice(0, 200)}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(1000);
  }
  throw new Error(`${url} never became healthy within ${timeoutMs}ms. Last: ${lastError}`);
}

async function main() {
  const steps = [];
  const record = async (name, fn) => {
    const began = Date.now();
    await fn();
    steps.push({ name, ms: Date.now() - began });
    log("ok", `${name} (${((Date.now() - began) / 1000).toFixed(1)}s)`);
  };

  await record("Render install integrity", () => run(
    "Render install integrity",
    npmCommand,
    ["ci", "--include=dev", "--ignore-scripts"],
    { quiet: true },
  ));

  const parseOnlyUrl = { DATABASE_URL: schemaParseUrl(process.env.DATABASE_URL) };
  await record("prisma generate", () => run("prisma generate", "npx", ["prisma", "generate"], { quiet: true, env: parseOnlyUrl }));
  await record("prisma validate", () => run("prisma validate", "npx", ["prisma", "validate"], { quiet: true, env: parseOnlyUrl }));

  await record("source confidentiality", () => run("source confidentiality", npmCommand, ["run", "security:check"]));
  await record("type-check", () => run("type-check", "npx", ["tsc", "--noEmit"]));
  await record("lint", () => run("lint", "npx", ["eslint", "."]));

  if (CODE_ONLY) {
    // Code-only deliberately has no database. Explicit PostgreSQL suites run in the full
    // gate after migration; every deterministic suite still runs here.
    await record("tests", () => run("tests", "npx", codeOnlyVitestArgs(), { quiet: true }));
    await record("production build", () => run("production build", npmCommand, ["run", "build"], {
      quiet: true,
      env: { NODE_ENV: "production" },
    }));
    await record("post-build confidentiality", () => run("post-build confidentiality", npmCommand, ["run", "security:check"]));
    log("skip", "Disposable migration, MVP journeys, production startup and health (skipped: --code-only)");
  } else {
    const disposableDatabaseUrl = process.env.DATABASE_URL;
    await record("disposable database safety", () => assertDisposableDatabase(disposableDatabaseUrl));

    const renderEnv = {
      NODE_ENV: "production",
      DATABASE_URL: disposableDatabaseUrl,
      DIRECT_DATABASE_URL: disposableDatabaseUrl,
      KLINIKOS_ALLOW_MIGRATION_DEPLOY: "disposable-verification",
    };

    await record("Render build + disposable migration", () => run(
      "Render build + disposable migration",
      npmCommand,
      ["run", "render:build"],
      { quiet: true, env: renderEnv },
    ));

    await record("post-build confidentiality", () => run("post-build confidentiality", npmCommand, ["run", "security:check"]));

    // Full-gate DATABASE_URL points at the initially empty target. Run the suite only
    // after the governed Render migration path has created the schema; otherwise every
    // database-aware test sees a configured but structurally empty database and fails
    // before the migration proof can execute.
    await record("tests", () => run(
      "tests",
      "npx",
      ["vitest", "run"],
      { quiet: true, env: renderEnv },
    ));

    await record("MVP journeys", () => run(
      "MVP journeys",
      "node",
      ["scripts/mvp/run-all.mjs"],
      { quiet: true, env: renderEnv },
    ));

    await record("Render startup and health", async () => {
      const port = process.env.VERIFY_PORT ?? "3111";
      const child = spawn(npmCommand, ["start"], {
        env: { ...process.env, ...renderEnv, PORT: port },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let output = "";
      child.stdout.on("data", (chunk) => { output += chunk; });
      child.stderr.on("data", (chunk) => { output += chunk; });
      try {
        const body = await waitForHealth(`http://127.0.0.1:${port}/api/health`);
        log("info", `  /api/health → ${body.slice(0, 160)}`);
      } catch (error) {
        process.stdout.write(`${output.slice(-4000)}\n`);
        throw error;
      } finally {
        child.kill("SIGTERM");
      }
    });
  }

  const total = ((Date.now() - startedAt) / 1000).toFixed(1);
  log("ok", `release gate passed — ${steps.length} checks in ${total}s`);
  if (CODE_ONLY) {
    log("info", "This was --code-only: disposable migration, journeys, startup and health were NOT proven.");
  }
}

main().catch((error) => {
  log("fail", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
