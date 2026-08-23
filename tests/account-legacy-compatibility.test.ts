import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("legacy user to canonical Account compatibility", () => {
  it("compares exact password hashes and security state instead of reconstructing credentials", () => {
    const source = read("src/lib/auth/account-compatibility.ts");
    expect(source).toContain("accountCredential.passwordHash === legacyCredential.passwordHash");
    expect(source).toContain("accountCredential.mustReset === legacyCredential.mustReset");
    expect(source).toContain("accountCredential.failedAttempts === legacyCredential.failedAttempts");
    expect(source).toContain("passwordChangedAt.getTime()");
  });

  it("anchors clinic compatibility to the legacy user's current organization membership", () => {
    const source = read("src/lib/auth/account-compatibility.ts");
    expect(source).toContain("organizationId: legacyUser.organizationId");
    expect(source).toContain("matchingMemberships.length === 1");
    expect(source).toContain("normalizeClinicRole");
  });

  it("never uses another membership to silently switch the authenticated tenant", () => {
    const repository = read("src/lib/auth/account-repository.ts");
    expect(repository).toContain("account.legacyLinks.length !== 1");
    expect(repository).toContain("return member");
  });

  it("provides a batch proof for every active credentialed legacy staff user", () => {
    const source = read("src/lib/auth/account-compatibility.ts");
    expect(source).toContain("verifyAllActiveLegacyAccountCompatibility");
    expect(source).toContain('status: "active"');
    expect(source).toContain("authCredential: { isNot: null }");
    expect(source).toContain("incompatibleCount");
    expect(source).toContain("allCompatible");
  });

  it("provides a fail-closed assertion for rollout gates", () => {
    const source = read("src/lib/auth/account-compatibility.ts");
    expect(source).toContain("assertAllActiveLegacyAccountsCompatible");
    expect(source).toContain("throw new Error");
  });

  it("exposes the compatibility proof as an operator command", () => {
    expect(existsSync("scripts/verify-universal-account-compatibility.ts")).toBe(true);
    const script = read("scripts/verify-universal-account-compatibility.ts");
    expect(script).toContain("verifyAllActiveLegacyAccountCompatibility");
    expect(script).toContain("process.exitCode = 1");
    expect(read("package.json")).toContain('"verify:account-compatibility"');
  });
});
