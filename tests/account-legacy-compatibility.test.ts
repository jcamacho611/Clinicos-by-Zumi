import { readFileSync } from "node:fs";
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
});
