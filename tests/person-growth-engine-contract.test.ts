import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("P02 reuse contract", () => {
  it("uses the canonical Path continuation", () => {
    expect(read("src/lib/orchestration/public-living-universe.ts")).toContain("continuationHrefForPathId");
    expect(read("src/lib/orchestration/public-living-universe.ts")).toContain("/member?path=");
    expect(read("src/components/marketing/public-living-universe-stage.tsx")).toContain("Join free and start here");
    expect(read("src/lib/auth/return-to.ts")).toContain("safeMemberReturnTo");
    expect(read("src/app/member/page.tsx")).toContain("klinikosPathCatalog.find");
    expect(read("src/lib/member/member-home-repository.ts")).toContain("Continue this path");
  });

  it("does not create parallel signup or intent-token rails", () => {
    expect(existsSync("src/app/signup-v2/page.tsx")).toBe(false);
    expect(existsSync("src/lib/auth/entry-intent.ts")).toBe(false);
    expect(existsSync("src/app/api/account/entry-intent/route.ts")).toBe(false);
  });
});
