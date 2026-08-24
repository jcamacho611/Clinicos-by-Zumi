#!/usr/bin/env node
/**
 * The canonical release gate: one command that proves a candidate can actually ship
 * through Klinikos' production host, Render.
 *
 * The full gate deliberately reproduces the repository's Render contract:
 *
 *   npm ci --include=dev --ignore-scripts
 *   npm run render:build
 *   npm start
 *
 * It adds schema, security, type, lint, tests, disposable-database migration proof,
 * MVP journeys, startup, and health around that host contract. The extra checks make the
 * gate stricter than Render without creating a second build path.
 *
 * Database safety is enforced. The full gate may run only against an empty disposable
 * database. Both DATABASE_URL and DIRECT_DATABASE_URL are pinned to that same verified
 * disposable URL before `render:build`, because the production build script prefers
 * DIRECT_DATABASE_URL when it exists.
 *
 * Usage:
 *   npm run verify:release          full Render-aligned gate; needs disposable DATABASE_URL
 *   npm run verify:code             code-only gate; no migration/journey/startup proof
 */

import { spawn, spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const CODE_ONLY = process.argv.includes("--code-only");
const startedAt = Date.now();
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

/** Hosts that are never acceptable targets for a gate that migrates an empty database. */
const PRODUCTION_MARKERS = [
  "neon.tech", "supabase.co", "rds.amazonaws.com", "render.com", "railway.app",
  "planetscale", "azure.com", "digitalocean.com", "heroku",
];

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
async function assertDisposableDatabase(url) {
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. The release gate reproduces Render against an EMPTY " +
      "disposable database and will not guess a target. Point it at a disposable database, " +
      "or run `npm run verify:code`.",
    );
  }
  if (process.env.VERIFY_ALLOW_PRODUCTION_DATABASE === "true") {
    log("info", "VERIFY_ALLOW_PRODUCTION_DATABASE=true — managed-host check bypassed by explicit request");
  } else {
    const marker = PRODUCTION_MARKERS.find((host) => url.includes(host));
    if (marker) {
      throw new Error(
        `DATABASE_URL points at ${marker}, which looks like a managed production host. ` +
        "This gate reproduces Render migrations and must never run there. " +
        "Set VERIFY_ALLOW_PRODUCTION_DATABASE=true only for a genuinely disposable target.",
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
        `The target database already has ${tables} table(s). The Render migration path ` +
        "must be proven against an EMPTY database before release.",
      );
    }
  } finally {
    await client.$disconnect();
  }
}

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

  // Render's install command, verbatim from render.yaml.
  await record("Render install integrity", () => run(
    "Render install integrity",
    npmCommand,
    ["ci", "--include=dev", "--ignore-scripts"],
    { quiet: true },
  ));

  const parseOnlyUrl = { DATABASE_URL: schemaParseUrl(process.env.DATABASE_URL) };
  await record("prisma generate", () => run("prisma generate", "npx", ["prisma", "generate"], { quiet: true, env: parseOnlyUrl }));
  await record("prisma validate", () => run("prisma validate", "npx", ["prisma", "validate"], { quiet: true, env: parseOnlyUrl }));

  // Confidentiality is checked before any production bundle is created.
  await record("source confidentiality", () => run("source confidentiality", npmCommand, ["run", "security:check"]));

  await record("type-check", () => run("type-check", "npx", ["tsc", "--noEmit"]));
  await record("lint", () => run("lint", "npx", ["eslint", "."]));
  await record("tests", () => run("tests", "npx", ["vitest", "run"], { quiet: true }));

  if (CODE_ONLY) {
    // Code-only still proves the production compilation path, but intentionally avoids
    // render:build because that command owns migrate deploy when a database URL exists.
    await record("production build", () => run("production build", npmCommand, ["run", "build"], {
      quiet: true,
      env: { NODE_ENV: "production" },
    }));
    await record("post-build confidentiality", () => run("post-build confidentiality", npmCommand, ["run", "security:check"]));
    log("skip", "Render migration, MVP journeys, production startup and health (skipped: --code-only)");
  } else {
    const disposableDatabaseUrl = process.env.DATABASE_URL;
    await record("disposable database safety", () => assertDisposableDatabase(disposableDatabaseUrl));

    const renderEnv = {
      NODE_ENV: "production",
      DATABASE_URL: disposableDatabaseUrl,
      DIRECT_DATABASE_URL: disposableDatabaseUrl,
    };

    // Render's build command, including build-before-migrate ordering, exactly as the
    // production host invokes it after npm ci.
    await record("Render build + migration", () => run(
      "Render build + migration",
      npmCommand,
      ["run", "render:build"],
      { quiet: true, env: renderEnv },
    ));

    // Re-scan after the production bundle exists.
    await record("post-build confidentiality", () => run("post-build confidentiality", npmCommand, ["run", "security:check"]));

    await record("MVP journeys", () => run(
      "MVP journeys",
      "node",
      ["scripts/mvp/run-all.mjs"],
      { quiet: true, env: renderEnv },
    ));

    // Render's start command is `npm start`; reproduce that command rather than invoking
    // the implementation script directly.
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
    log("info", "This was --code-only: Render migration, journeys, startup and health were NOT proven.");
  }
}

main().catch((error) => {
  log("fail", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
