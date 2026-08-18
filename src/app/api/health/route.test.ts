import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

const originalCommit = process.env.RENDER_GIT_COMMIT;
const originalBranch = process.env.RENDER_GIT_BRANCH;
const originalDatabase = process.env.DATABASE_URL;

afterEach(() => {
  if (originalCommit === undefined) delete process.env.RENDER_GIT_COMMIT;
  else process.env.RENDER_GIT_COMMIT = originalCommit;
  if (originalBranch === undefined) delete process.env.RENDER_GIT_BRANCH;
  else process.env.RENDER_GIT_BRANCH = originalBranch;
  if (originalDatabase === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabase;
});

describe("production health release identity", () => {
  it("surfaces the Render deploy commit and branch without exposing environment secrets", async () => {
    process.env.RENDER_GIT_COMMIT = "69d8ebdf5d542b53e99591e88f21e9723562726c";
    process.env.RENDER_GIT_BRANCH = "main";
    process.env.DATABASE_URL = "postgresql://secret-value-that-must-not-be-returned";

    const response = GET();
    const body = await response.json();

    expect(body.release).toEqual({
      commit: "69d8ebdf5d542b53e99591e88f21e9723562726c",
      shortCommit: "69d8ebdf5d5",
      branch: "main",
    });
    expect(body.databaseConfigured).toBe(true);
    expect(JSON.stringify(body)).not.toContain("postgresql://");
    expect(JSON.stringify(body)).not.toContain("secret-value");
  });

  it("returns null release fields outside a provider that supplies them", async () => {
    delete process.env.RENDER_GIT_COMMIT;
    delete process.env.RENDER_GIT_BRANCH;
    delete process.env.GIT_COMMIT_SHA;

    const response = GET();
    const body = await response.json();
    expect(body.release).toEqual({ commit: null, shortCommit: null, branch: null });
  });
});
