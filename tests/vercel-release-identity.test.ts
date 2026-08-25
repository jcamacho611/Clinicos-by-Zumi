import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const healthRoute = readFileSync("src/app/api/health/route.ts", "utf8");

describe("host-portable release identity", () => {
  it("recognizes Vercel Git release identity", () => {
    expect(healthRoute).toContain("VERCEL_GIT_COMMIT_SHA");
    expect(healthRoute).toContain("VERCEL_GIT_COMMIT_REF");
  });

  it("preserves Render and generic release identity fallbacks", () => {
    expect(healthRoute).toContain("RENDER_GIT_COMMIT");
    expect(healthRoute).toContain("RENDER_GIT_BRANCH");
    expect(healthRoute).toContain("GIT_COMMIT_SHA");
    expect(healthRoute).toContain("release-identity.json");
  });
});
