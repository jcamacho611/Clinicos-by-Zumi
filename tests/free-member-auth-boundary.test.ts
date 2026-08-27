import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("free member authentication boundary", () => {
  it("uses discriminated member and clinic account sessions", () => {
    const source = read("src/lib/auth/account-types.ts");
    expect(source).toContain('kind: "member"');
    expect(source).toContain('kind: "clinic"');
    expect(source).toContain("accountId");
    expect(source).toContain("personId");
  });

  it("requires a real clinic context before projecting ClinicSession", () => {
    const source = read("src/lib/auth/account-session.ts");
    expect(source).toContain("requireAccountSession");
    expect(source).toContain("requireAccountClinicSession");
    expect(source).toContain('session.kind !== "clinic"');
    expect(source).toContain("legacyLinks");
    expect(source).toContain("organization");
  });

  it("never downgrades a legacy-linked account into free-member authentication", () => {
    const source = read("src/lib/auth/account-repository.ts");
    expect(source).toContain("if (account.legacyLinks.length === 0) return member;");
    expect(source).toContain("if (account.legacyLinks.length !== 1) return null;");
    expect(source).not.toContain("if (account.legacyLinks.length !== 1) return member;");
  });

  it("does not test copied clinic credentials on the free-member fallback rail", () => {
    const source = read("src/lib/auth/account-credentials.ts");
    const legacyGuard = source.indexOf("account.legacyLinks.length > 0");
    const passwordCompare = source.indexOf("compare(password, credential.passwordHash)");
    expect(legacyGuard).toBeGreaterThan(-1);
    expect(passwordCompare).toBeGreaterThan(-1);
    expect(legacyGuard).toBeLessThan(passwordCompare);
  });

  it("invalidates a free-member session after a clinic legacy link appears", () => {
    const source = read("src/lib/auth/account-session.ts");
    expect(source).toContain('if (claims.kind === "member")');
    expect(source).toContain("persisted.account.legacyLinks.length > 0");
    expect(source).toContain("return null;");
  });
});
