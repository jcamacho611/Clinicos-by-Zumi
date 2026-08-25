/**
 * `npm run release:status`
 *
 * Asks the live site what it is running and compares it to what should be live.
 * Read-only: it fetches one public health endpoint and reads local git. It changes
 * nothing, needs no credentials, and touches no database.
 *
 * Exit code is the point — 0 when production is current, 1 when it is not — so this can
 * gate a release or run on a schedule instead of relying on somebody noticing.
 */
import { spawnSync } from "node:child_process";
import { compareRelease, describeRelease } from "./production-currency.mjs";

const HEALTH_URL =
  process.env.KLINIKOS_HEALTH_URL || "https://www.klinikos.io/api/health";
const EXPECTED_REF = process.env.KLINIKOS_EXPECTED_REF || "origin/main";
const TIMEOUT_MS = Number(process.env.KLINIKOS_HEALTH_TIMEOUT_MS || 60_000);

function git(...args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

async function readLiveCommit() {
  // A free-tier instance can be asleep, and a cold start is a slow response rather than a
  // failure, so the timeout is generous. Distinguishing "asleep" from "down" is not this
  // script's job; reporting that the version is unknown is.
  const response = await fetch(HEALTH_URL, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "cache-control": "no-cache" },
  });

  if (!response.ok) {
    throw new Error(`Health endpoint returned HTTP ${response.status}.`);
  }

  const body = await response.json();
  return body?.release?.commit ?? null;
}

const expectedCommit = git("rev-parse", EXPECTED_REF);
if (!expectedCommit) {
  console.error(
    `Could not resolve ${EXPECTED_REF}. Fetch it first, or set KLINIKOS_EXPECTED_REF.`,
  );
  process.exit(1);
}

let liveCommit = null;
let fetchError = null;
try {
  liveCommit = await readLiveCommit();
} catch (error) {
  fetchError = error;
}

// Only meaningful when the live commit is an ancestor of the expected one. Anything else
// is deliberately left as an unknown distance rather than guessed at.
let commitsBehind = null;
if (liveCommit && git("cat-file", "-e", `${liveCommit}^{commit}`) !== null) {
  const isAncestor = spawnSync(
    "git",
    ["merge-base", "--is-ancestor", liveCommit, expectedCommit],
    { encoding: "utf8" },
  );
  if (isAncestor.status === 0) {
    const count = git("rev-list", "--count", `${liveCommit}..${expectedCommit}`);
    if (count !== null) commitsBehind = Number(count);
  }
}

const result = compareRelease({ liveCommit, expectedCommit, commitsBehind });

console.log(`Live site:   ${HEALTH_URL}`);
console.log(`Should be:   ${expectedCommit.slice(0, 12)} (${EXPECTED_REF})`);
console.log("");
console.log(describeRelease(result, { liveCommit, expectedCommit }));

if (fetchError) {
  console.log("");
  console.log(`Could not read the live version: ${fetchError.message}`);
}

process.exit(result.ok ? 0 : 1);
