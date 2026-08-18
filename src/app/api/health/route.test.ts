import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

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

describe("public health disclosure boundary", () => {
  it("proves liveness without exposing deployment, database, mode, or integration state", async () => {
    process.env.RENDER_GIT_COMMIT = "69d8ebdf5d542b53e99591e88f21e9723562726c";
    process.env.RENDER_GIT_BRANCH = "private-release-branch";
    process.env.GIT_COMMIT_SHA = "0123456789abcdef0123456789abcdef01234567";
    process.env.DATABASE_URL = "postgresql://user:secret-value@db.internal/klinikos";

    const response = GET();
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(body).toEqual({ status: "ok" });
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(serialized).not.toContain("69d8ebdf");
    expect(serialized).not.toContain("0123456789");
    expect(serialized).not.toContain("private-release-branch");
    expect(serialized).not.toContain("postgresql://");
    expect(serialized).not.toContain("database");
    expect(serialized).not.toContain("integration");
    expect(serialized).not.toContain("demo");
  });

  it("keeps the same minimal shape when operational environment values are absent", async () => {
    delete process.env.RENDER_GIT_COMMIT;
    delete process.env.RENDER_GIT_BRANCH;
    delete process.env.GIT_COMMIT_SHA;
    delete process.env.DATABASE_URL;

    const response = GET();
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
