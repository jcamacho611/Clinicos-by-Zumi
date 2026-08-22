#!/usr/bin/env node
/**
 * The canonical release gate: one command that proves a candidate can actually ship.
 *
 * Why this exists in this form:
 *
 * Every check below already existed as a separate npm script, and each was run by hand
 * in whatever order someone remembered. That is how a candidate reaches production with
 * a green test suite and migrations that cannot apply — the repository has done exactly
 * that before, when nine migrations referenced Prisma model names instead of their
 * mapped table names and nothing ever tried them against an empty database.
 *
 * So the ordering here is deliberate rather than cosmetic:
 *
 *   - Schema validation precedes migration, because an invalid schema makes every later
 *     failure a misleading symptom of itself.
 *   - Migrations run against a DISPOSABLE, EMPTY database. A migration that only works
 *     on a database which already has the tables is not a migration, and running this
 *     against a populated database would prove the opposite of what it claims.
 *   - The production build runs before startup, and startup before health, because each
 *     is meaningless without the one before it.
 *
 * The database rule is enforced, not documented. `assertDisposableDatabase` refuses to
 * run when the target looks like production or when it is not empty, because "verify"
 * that drops someone's data is worse than no verify at all.
 *
 * Usage:
 *   npm run verify:release          full gate, needs a disposable DATABASE_URL
 *   npm run verify:code             the checks that need no database
 */

import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const CODE_ONLY = process.argv.includes("--code-only");
const startedAt = Date.now();

/** Hosts that are never acceptable targets for a gate that migrates an empty database. */
const PRODUCTION_MARKERS = [
  "neon.tech", "supabase.co", "rds.amazonaws.com", "render.com", "railway.app",
  "planetscale", "azure.com", "digitalocean.com", "heroku",
];

/**
 * A connection string that `prisma generate` and `prisma validate` can parse.
 *
 * Neither command opens a connection, so the value only has to be well-formed. Returning
 * the real URL when there is one keeps the check honest for anyone reading the output;
 * the placeholder only stands in when the environment has nothing usable.
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

/**
 * Refuse to run the migration gate against anything that could be real.
 *
 * Two independent checks, because either alone is easy to fool: the URL must not look
 * like a managed production host, and the database must actually be empty. An empty
 * database cannot be someone's production data, whatever the hostname claims.
 */
async function assertDisposableDatabase(url) {
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. The release gate migrates an empty database and will not " +
      "guess a target. Point it at a disposable database, or run `npm run verify:code`.",
    );
  }
  if (process.env.VERIFY_ALLOW_PRODUCTION_DATABASE === "true") {
    log("info", "VERIFY_ALLOW_PRODUCTION_DATABASE=true — production-host check bypassed by explicit request");
  } else {
    const marker = PRODUCTION_MARKERS.find((host) => url.includes(host));
    if (marker) {
      throw new Error(
        `DATABASE_URL points at ${marker}, which looks like a managed production host. ` +
        "This gate applies migrations to an empty database and must never run there. " +
        "Set VERIFY_ALLOW_PRODUCTION_DATABASE=true only if you genuinely intend that.",
      );
    }
  }

  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    const rows = await client.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name NOT LIKE '\\_prisma%'`,
    );
    const tables = Number(rows?.[0]?.count ?? 0);
    if (tables > 0) {
      throw new Error(
        `The target database already has ${tables} table(s). Migrations must be proven ` +
        "against an EMPTY database — applying them to a populated one proves nothing " +
        "about a fresh deploy, which is the failure this gate exists to catch.",
      );
    }
  } finally {
    await client.$disconnect();
  }
}

/** Poll until the server answers or the deadline passes. Never a bare sleep. */
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

  // 1. Install integrity. `npm ci` is the only install that proves the lockfile
  //    describes a resolvable, complete tree — which is what the host will install.
  await record("install integrity", () => run("install integrity", "npm", ["ci", "--ignore-scripts"], { quiet: true }));

  // 2-3. The client must generate and the schema must be valid before anything reads it.
  //
  // Both only parse the schema; neither connects. But the datasource block reads
  // DATABASE_URL, so an unset or placeholder value fails them with a connection-string
  // error that has nothing to do with the schema. Supply a syntactically valid throwaway
  // URL when the real one is missing or obviously a placeholder, so these steps report on
  // the schema rather than on the environment.
  const parseOnlyUrl = { DATABASE_URL: schemaParseUrl(process.env.DATABASE_URL) };
  await record("prisma generate", () => run("prisma generate", "npx", ["prisma", "generate"], { quiet: true, env: parseOnlyUrl }));
  await record("prisma validate", () => run("prisma validate", "npx", ["prisma", "validate"], { quiet: true, env: parseOnlyUrl }));

  // 4. Migrations, against an empty disposable database.
  if (CODE_ONLY) {
    log("skip", "empty-database migration (skipped: --code-only)");
  } else {
    await record("empty-database migration", async () => {
      await assertDisposableDatabase(process.env.DATABASE_URL);
      run("migrate deploy", "npx", ["prisma", "migrate", "deploy"], { quiet: true });
    });
  }

  // 5-7. Static and behavioural correctness.
  await record("type-check", () => run("type-check", "npx", ["tsc", "--noEmit"]));
  await record("lint", () => run("lint", "npx", ["eslint", "."]));
  await record("tests", () => run("tests", "npx", ["vitest", "run"], { quiet: true }));

  // 8. Journeys exercise the database end to end, so they need the migrated schema.
  if (CODE_ONLY) {
    log("skip", "MVP journeys (skipped: --code-only)");
  } else {
    await record("MVP journeys", () => run("MVP journeys", "node", ["scripts/mvp/run-all.mjs"], { quiet: true }));
  }

  // 9. The production build. A candidate that does not compile cannot ship.
  await record("production build", () => run("production build", "npm", ["run", "build"], { quiet: true }));

  // 10-11. Startup and health. A build that will not boot is not a release.
  if (CODE_ONLY) {
    log("skip", "production startup and health (skipped: --code-only)");
  } else {
    await record("production startup and health", async () => {
      const port = process.env.VERIFY_PORT ?? "3111";
      const child = spawn("node", ["scripts/start.mjs"], {
        env: { ...process.env, PORT: port, NODE_ENV: "production" },
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
    log("info", "This was --code-only: migrations, journeys, startup and health were NOT proven.");
  }
}

main().catch((error) => {
  log("fail", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
