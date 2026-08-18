import { NextResponse } from "next/server";

function nonSecretReleaseIdentity() {
  const commit = process.env.RENDER_GIT_COMMIT?.trim() || process.env.GIT_COMMIT_SHA?.trim() || null;
  const branch = process.env.RENDER_GIT_BRANCH?.trim() || null;
  return {
    commit,
    shortCommit: commit ? commit.slice(0, 12) : null,
    branch,
  };
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
