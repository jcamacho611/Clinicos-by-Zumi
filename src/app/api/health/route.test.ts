import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

/** What the build stamped, if a build has run in this tree. */
function buildStamp(): { commit?: string; branch?: string } {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "release-identity.json"), "utf8"));
  } catch {
    return {};
  }
}

const originalCommit = process.env.RENDER_GIT_COMMIT;
const originalBranch = process.env.RENDER_GIT_BRANCH;
const originalFallbackCommit = process.env.GIT_COMMIT_SHA;
const originalDatabase = process.env.DATABASE_URL;

afterEach(() => {
  if (originalCommit === undefined) delete process.env.RENDER_GIT_COMMIT; else process.env.RENDER_GIT_COMMIT = originalCommit;
  if (originalBranch === undefined) delete process.env.RENDER_GIT_BRANCH; else process.env.RENDER_GIT_BRANCH = originalBranch;
  if (originalFallbackCommit === undefined) delete process.env.GIT_COMMIT_SHA; else process.env.GIT_COMMIT_SHA = originalFallbackCommit;
  if (originalDatabase === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = originalDatabase;
});

describe("production health release identity", () => {
  it("surfaces the Render deploy commit and branch without exposing environment secrets", async () => {
    process.env.RENDER_GIT_COMMIT = "69d8ebdf5d542b53e99591e88f21e9723562726c";
    process.env.RENDER_GIT_BRANCH = "main";
    process.env.DATABASE_URL = "postgresql://secret-value-that-must-not-be-returned";
    const body = await GET().json();
    expect(body.release).toEqual({ commit: "69d8ebdf5d542b53e99591e88f21e9723562726c", shortCommit: "69d8ebdf5d54", branch: "main" });
    expect(body.databaseConfigured).toBe(true);
    expect(JSON.stringify(body)).not.toContain("postgresql://");
    expect(JSON.stringify(body)).not.toContain("secret-value");
  });

  it("falls back to the commit the build stamped, and to null when there is none", async () => {
    // The host's own environment is the most trustworthy answer and wins. When the host
    // supplies nothing, the build stamp is the next best thing — not an invention, but
    // the commit that was actually compiled. Without either, this stays null rather than
    // guessing, because a wrong SHA during an incident is worse than an absent one.
    delete process.env.RENDER_GIT_COMMIT;
    delete process.env.RENDER_GIT_BRANCH;
    delete process.env.GIT_COMMIT_SHA;
    const stamp = buildStamp();
    const body = await GET().json();

    expect(body.release.commit).toEqual(stamp.commit ?? null);
    expect(body.release.branch).toEqual(stamp.branch ?? null);
    expect(body.release.shortCommit).toEqual(stamp.commit ? stamp.commit.slice(0, 12) : null);
  });

  it("prefers the host's declared commit over the build stamp", async () => {
    // A stale stamp inside an image must never outrank what the platform says it
    // deployed, which is the case that makes health lie about the running version.
    process.env.RENDER_GIT_COMMIT = "1111111111111111111111111111111111111111";
    process.env.RENDER_GIT_BRANCH = "release";
    const body = await GET().json();
    expect(body.release.commit).toBe("1111111111111111111111111111111111111111");
    expect(body.release.branch).toBe("release");
  });
});
