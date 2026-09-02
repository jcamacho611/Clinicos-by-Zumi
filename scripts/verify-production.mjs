#!/usr/bin/env node
/**
 * Read-only verification of what is actually running in production.
 *
 * This is the external runtime complement to exact-head CI and local release gates.
 * CI and local gates establish whether a candidate is safe to ship; this read-only
 * external check establishes what commit and customer surface are actually serving.
 * It does not replace CI, browser evidence, or release review. It checks the serving
 * commit, branch delta, public surface, and — the part worth the most — whether anything
 * private is reachable without signing in.
 *
 * Strictly read-only. It performs GET requests against public endpoints and nothing
 * else: no writes, no authentication, no state. A verification script that can change
 * production is a liability, not a check.
 *
 *   npm run verify:production
 *   npm run verify:production -- --base https://staging.example.com
 */

import { execFileSync } from "node:child_process";

const DEFAULT_BASE = "https://www.klinikos.io";
const TIMEOUT_MS = 20_000;
const DEFAULT_DOCUMENT_LIMIT = 4_000;
const ROOT_DOCUMENT_LIMIT = 256 * 1024;

const baseFlag = process.argv.indexOf("--base");
const BASE = (baseFlag > -1 ? process.argv[baseFlag + 1] : process.env.KLINIKOS_PRODUCTION_URL) || DEFAULT_BASE;

/** Public marketing and entry surfaces. A non-200 here is a customer hitting a wall. */
const PUBLIC_ROUTES = ["/", "/pricing", "/trust", "/sales", "/grid", "/edu", "/login"];

/**
 * Surfaces that must never render to an anonymous visitor. A 200 with content here is a
 * data exposure, not a broken link, which is why they are checked separately and why a
 * redirect to sign-in is the expected pass.
 */
const PRIVATE_ROUTES = ["/dashboard", "/patients", "/billing", "/settings", "/quality", "/insights"];

const failures = [];
const notes = [];

function log(kind, message) {
  process.stdout.write(`${{ ok: "✓", fail: "✗", info: " ", run: "→" }[kind] ?? " "} ${message}\n`);
}

async function get(path, redirect = "manual", documentLimit = DEFAULT_DOCUMENT_LIMIT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE}${path}`, { redirect, signal: controller.signal });
    const body = response.status === 200 ? (await response.text()).slice(0, documentLimit) : "";
    return { status: response.status, location: response.headers.get("location"), body };
  } catch (error) {
    return { status: 0, location: null, body: "", error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

function namedMetaContent(document, name) {
  const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tag = document.match(new RegExp(`<meta\\b[^>]*\\bname=["']${safeName}["'][^>]*>`, "i"))?.[0] ?? "";
  return tag.match(/\bcontent=["']([^"']+)["']/i)?.[1] ?? null;
}

function localCommits() {
  try {
    execFileSync("git", ["fetch", "origin", "main"], { stdio: "ignore" });
    return execFileSync("git", ["rev-list", "origin/main"], { encoding: "utf8" }).trim().split("\n");
  } catch {
    return [];
  }
}

async function main() {
  log("run", `Verifying ${BASE}`);
  let liveCommit = null;
  let rootDocument = "";

  // 1. Health, and the identity of what is serving.
  const health = await get("/api/health", "follow");
  if (health.status !== 200) {
    failures.push(`/api/health returned ${health.status || health.error}`);
    log("fail", `health ${health.status || health.error}`);
  } else {
    let payload;
    try {
      payload = JSON.parse(health.body);
    } catch {
      failures.push("/api/health did not return JSON");
    }

    if (payload) {
      if (payload.status !== "ok") failures.push(`health status is "${payload.status}"`);
      if (!payload.databaseConfigured) failures.push("production reports no database configured");

      const commit = payload.release?.commit ?? null;
      liveCommit = commit;
      if (!commit) {
        // Before the build stamped its own commit this was always null, and "what is
        // running?" was unanswerable during exactly the incident where it matters.
        failures.push("production cannot name the commit it is running");
      } else {
        const history = localCommits();
        const index = history.indexOf(commit);
        if (history.length === 0) {
          notes.push("could not read local git history; deployed commit not compared to main");
        } else if (index === -1) {
          failures.push(`deployed commit ${commit.slice(0, 12)} is not on origin/main`);
        } else {
          log("ok", `serving ${commit.slice(0, 12)} (${index} commit${index === 1 ? "" : "s"} behind origin/main)`);
          if (index > 0) notes.push(`production is ${index} commit(s) behind origin/main`);
        }
      }

      // A health endpoint is public, so it must carry nothing sensitive.
      const serialized = JSON.stringify(payload);
      for (const secret of ["postgres://", "postgresql://", "sk_live", "whsec_", "AUTH_SECRET", "password"]) {
        if (serialized.includes(secret)) failures.push(`health response leaks ${secret}`);
      }
      log("ok", "health payload carries no connection string or secret");
    }
  }

  // 2. Public surface.
  for (const route of PUBLIC_ROUTES) {
    const response = await get(route, "follow", route === "/" ? ROOT_DOCUMENT_LIMIT : DEFAULT_DOCUMENT_LIMIT);
    if (response.status !== 200) {
      failures.push(`public ${route} returned ${response.status || response.error}`);
      log("fail", `${route} → ${response.status || response.error}`);
    }
    if (route === "/" && response.status === 200) rootDocument = response.body;
  }
  log("ok", `${PUBLIC_ROUTES.length} public routes answer`);

  if (rootDocument) {
    const htmlCommit = namedMetaContent(rootDocument, "klinikos-release");
    if (!htmlCommit || !/^[0-9a-f]{40,64}$/i.test(htmlCommit)) {
      failures.push("root HTML does not expose a valid klinikos-release commit");
    } else if (liveCommit && htmlCommit !== liveCommit) {
      failures.push(`root HTML ${htmlCommit.slice(0, 12)} does not match running health ${liveCommit.slice(0, 12)}`);
    } else {
      log("ok", `browser HTML matches running release ${htmlCommit.slice(0, 12)}`);
    }

    const requiredExperience = [
      'data-public-universe-shell="true"',
      'data-public-object-stage="true"',
      'data-public-plane-lens="true"',
      'data-public-inspector="true"',
      'data-public-action-dock="true"',
      'data-public-intent-constellation="true"',
      "What do you need today?",
    ];
    for (const marker of requiredExperience) {
      if (!rootDocument.includes(marker)) failures.push(`root HTML is missing Living Universe marker: ${marker}`);
    }

    const publicActionIds = new Set(
      Array.from(rootDocument.matchAll(/\bdata-public-action-id=["']([a-z0-9-]+)["']/gi), (match) => match[1]),
    );
    if (publicActionIds.size < 12) {
      failures.push(`root HTML exposes only ${publicActionIds.size} distinct public intent action(s); expected at least 12`);
    }
    for (const side of ["need", "have"]) {
      if (!rootDocument.includes(`data-public-action-side="${side}"`)) {
        failures.push(`root HTML is missing the ${side} public intent side`);
      }
    }

    for (const retired of ["One system, three extensions", "What it actually does"]) {
      if (rootDocument.includes(retired)) failures.push(`root HTML still contains retired brochure copy: ${retired}`);
    }
  }

  // 3. Private surface must not render to an anonymous visitor.
  for (const route of PRIVATE_ROUTES) {
    const response = await get(route, "manual");
    const redirectedToAuth = [301, 302, 303, 307, 308].includes(response.status)
      && /login|signin|sign-in/i.test(response.location ?? "");
    const refused = [401, 403, 404].includes(response.status);

    if (redirectedToAuth || refused) continue;

    if (response.status === 200) {
      // A sign-in page rendered at a private URL is acceptable; leaked records are not.
      const looksLikeAuthWall = /sign in|log in|password/i.test(response.body);
      failures.push(
        looksLikeAuthWall
          ? `${route} returns 200 to an anonymous visitor (renders an auth wall rather than redirecting — verify no data is included)`
          : `${route} RENDERS TO AN ANONYMOUS VISITOR`,
      );
      log("fail", `${route} → 200 without authentication`);
    } else {
      failures.push(`${route} returned an unexpected ${response.status || response.error}`);
    }
  }
  if (!failures.some((failure) => PRIVATE_ROUTES.some((route) => failure.startsWith(route)))) {
    log("ok", `${PRIVATE_ROUTES.length} private routes refuse anonymous access`);
  }

  for (const note of notes) log("info", note);

  if (failures.length) {
    log("fail", `production verification failed — ${failures.length} problem(s)`);
    for (const failure of failures) process.stdout.write(`    - ${failure}\n`);
    process.exitCode = 1;
    return;
  }
  log("ok", "production verification passed");
}

main().catch((error) => {
  log("fail", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
