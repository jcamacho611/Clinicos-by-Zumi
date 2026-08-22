import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

/**
 * What code is actually running.
 *
 * The host's own environment is the most trustworthy answer, so it is tried first. The
 * build-time stamp is the fallback for hosts that set nothing — without it this reports
 * null forever, and the question becomes unanswerable during exactly the incident where
 * it matters. Nothing here is secret: a commit SHA and branch name.
 */
function buildStamp(): { commit?: string; branch?: string } {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "release-identity.json"), "utf8"));
  } catch {
    return {};
  }
}

function nonSecretReleaseIdentity() {
  const stamp = buildStamp();
  const commit = process.env.RENDER_GIT_COMMIT?.trim() || process.env.GIT_COMMIT_SHA?.trim() || stamp.commit?.trim() || null;
  const branch = process.env.RENDER_GIT_BRANCH?.trim() || stamp.branch?.trim() || null;
  return { commit, shortCommit: commit ? commit.slice(0, 12) : null, branch };
}

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "klinikos",
    mode: "demo",
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    liveIntegrations: false,
    release: nonSecretReleaseIdentity(),
    timestamp: new Date().toISOString(),
  });
}
