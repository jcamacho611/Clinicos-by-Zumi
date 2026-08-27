import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/app/auth/page.tsx", "utf8");

describe("universal entry to member signup", () => {
  it("surfaces person-level account creation only when the deployment flag is enabled", () => {
    expect(source).toContain("KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED");
    expect(source).toContain('href="/signup"');
    expect(source).toContain("Create account");
  });
});
