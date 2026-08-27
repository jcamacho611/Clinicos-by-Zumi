import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("free member relogin", () => {
  it("preserves legacy clinic login as the first authentication rail", () => {
    const route = read("src/app/api/auth/login/route.ts");
    const legacyIndex = route.indexOf("authenticateCredentials(");
    const accountIndex = route.indexOf("authenticateAccountCredentials(");
    expect(legacyIndex).toBeGreaterThanOrEqual(0);
    expect(accountIndex).toBeGreaterThan(legacyIndex);
  });

  it("allows only organization-free account identities through the member fallback", () => {
    const route = read("src/app/api/auth/login/route.ts");
    expect(route).toContain("accountIdentityHasClinicContext");
    expect(route).toContain("if (!accountIdentity || accountIdentityHasClinicContext(accountIdentity))");
    expect(route).toContain("createAccountSession(accountIdentity");
    expect(route).toContain("ACCOUNT_SESSION_COOKIE_NAME");
    expect(route).toContain('redirectTo: "/member"');
  });

  it("does not turn the account fallback into Clinic OS authority", () => {
    const route = read("src/app/api/auth/login/route.ts");
    const fallbackStart = route.indexOf("authenticateAccountCredentials(");
    expect(fallbackStart).toBeGreaterThanOrEqual(0);
    const fallback = route.slice(fallbackStart);
    expect(fallback).not.toContain("createClinicSession(accountIdentity");
    expect(fallback).not.toContain("response.cookies.set(SESSION_COOKIE_NAME, accountToken");
  });
});
