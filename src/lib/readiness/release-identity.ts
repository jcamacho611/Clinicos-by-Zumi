import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

type ReleaseStamp = { commit?: unknown; branch?: unknown };
type ReleaseEnvironment = {
  RENDER_GIT_COMMIT?: string;
  GIT_COMMIT_SHA?: string;
  RENDER_GIT_BRANCH?: string;
};

export type NonSecretReleaseIdentity = {
  commit: string | null;
  shortCommit: string | null;
  branch: string | null;
};

export function normalizeReleaseCommit(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  return /^[0-9a-f]{40,64}$/i.test(candidate) ? candidate.toLowerCase() : null;
}

function normalizeReleaseBranch(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  return candidate.length > 0
    && candidate.length <= 128
    && /^[a-z0-9._/-]+$/i.test(candidate)
    && !candidate.includes("..")
    ? candidate
    : null;
}

export function resolveReleaseIdentity({
  environment,
  stamp,
}: {
  environment: ReleaseEnvironment;
  stamp: ReleaseStamp;
}): NonSecretReleaseIdentity {
  const hostCommit = normalizeReleaseCommit(environment.RENDER_GIT_COMMIT)
    ?? normalizeReleaseCommit(environment.GIT_COMMIT_SHA);
  const stampCommit = normalizeReleaseCommit(stamp.commit);
  const commit = hostCommit ?? stampCommit;
  const hostBranch = normalizeReleaseBranch(environment.RENDER_GIT_BRANCH);
  const branch = hostBranch ?? normalizeReleaseBranch(stamp.branch);

  return {
    commit,
    shortCommit: commit?.slice(0, 12) ?? null,
    branch,
  };
}

/** The exact non-secret identity written before Next compiles the browser document. */
export function readBuildReleaseIdentity(): NonSecretReleaseIdentity {
  let stamp: ReleaseStamp = {};
  try {
    stamp = JSON.parse(readFileSync(join(process.cwd(), "release-identity.json"), "utf8"));
  } catch {
    // Source trees and local development may have no build stamp yet.
  }

  return resolveReleaseIdentity({ environment: {}, stamp });
}

/** Host-declared runtime identity wins for health; the compiled build stamp is fallback. */
export function readRuntimeReleaseIdentity(): NonSecretReleaseIdentity {
  return resolveReleaseIdentity({
    environment: {
      RENDER_GIT_COMMIT: process.env.RENDER_GIT_COMMIT,
      GIT_COMMIT_SHA: process.env.GIT_COMMIT_SHA,
      RENDER_GIT_BRANCH: process.env.RENDER_GIT_BRANCH,
    },
    stamp: readBuildReleaseIdentity(),
  });
}
