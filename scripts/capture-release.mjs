/**
 * Stamp the commit being built into a file the running server can read.
 *
 * The health endpoint already reports RENDER_GIT_COMMIT / GIT_COMMIT_SHA, which is the
 * right first choice — the host knows what it deployed. But when the host sets neither,
 * health reports `commit: null` forever, and "what code is actually running in
 * production?" becomes unanswerable at exactly the moment it matters: during an incident,
 * or when a deploy silently served a stale build.
 *
 * So the build writes what it can prove — the commit in the working tree it is compiling
 * — as a fallback. Best effort by design: a source tree without git still builds, it just
 * reports null the way it does today. This never fails a build.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

function git(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null;
  } catch {
    return null;
  }
}

const identity = {
  commit: process.env.RENDER_GIT_COMMIT?.trim() || process.env.GIT_COMMIT_SHA?.trim() || git(["rev-parse", "HEAD"]),
  branch: process.env.RENDER_GIT_BRANCH?.trim() || git(["rev-parse", "--abbrev-ref", "HEAD"]),
  builtAt: new Date().toISOString(),
};

try {
  writeFileSync(join(process.cwd(), "release-identity.json"), `${JSON.stringify(identity, null, 2)}\n`);
  process.stdout.write(`Release identity: ${identity.commit?.slice(0, 12) ?? "unknown"} (${identity.branch ?? "unknown branch"})\n`);
} catch (error) {
  // A read-only filesystem is not a reason to fail a build.
  process.stdout.write(`Release identity not written: ${error instanceof Error ? error.message : String(error)}\n`);
}
