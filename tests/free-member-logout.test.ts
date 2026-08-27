import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/app/api/auth/logout/route.ts", "utf8");

describe("free member logout", () => {
  it("revokes and clears both account and legacy clinic session rails", () => {
    expect(source).toContain("getAccountSession");
    expect(source).toContain("revokeAccountSession");
    expect(source).toContain("ACCOUNT_SESSION_COOKIE_NAME");
    expect(source).toContain("revokeClinicSession");
    expect(source).toContain("SESSION_COOKIE_NAME");
  });
});
