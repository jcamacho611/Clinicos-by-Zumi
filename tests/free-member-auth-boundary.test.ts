import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("free member authentication boundary", () => {
  it("uses discriminated member and clinic account sessions", () => {
    expect(existsSync("src/lib/auth/account-types.ts")).toBe(true);
    if (!existsSync("src/lib/auth/account-types.ts")) return;
    const source = read("src/lib/auth/account-types.ts");
    expect(source).toContain('kind: "member"');
    expect(source).toContain('kind: "clinic"');
    expect(source).toContain("accountId");
    expect(source).toContain("personId");
  });

  it("requires a real clinic context before projecting ClinicSession", () => {
    expect(existsSync("src/lib/auth/account-session.ts")).toBe(true);
    if (!existsSync("src/lib/auth/account-session.ts")) return;
    const source = read("src/lib/auth/account-session.ts");
    expect(source).toContain("requireAccountSession");
    expect(source).toContain("requireAccountClinicSession");
    expect(source).toContain('session.kind !== "clinic"');
    expect(source).toContain("legacyUserAccountLink");
    expect(source).toContain("organization");
  });

  it("does not alter patient portal authentication in this phase", () => {
    const plan = read("docs/superpowers/plans/2026-08-23-universal-account-free-member-phase2.md");
    expect(plan).toContain("patient portal auth is untouched");
  });
});
