import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("member signup legal readiness", () => {
  it("requires production-approved website terms and privacy before recording signup acceptance", () => {
    expect(existsSync("src/lib/legal/member-signup-legal.ts")).toBe(true);
    if (!existsSync("src/lib/legal/member-signup-legal.ts")) return;
    const source = read("src/lib/legal/member-signup-legal.ts");
    expect(source).toContain('getLegalDocument("website_terms")');
    expect(source).toContain('getLegalDocument("privacy_policy")');
    expect(source).toContain("productionApproved");
    expect(source).toContain("MemberSignupLegalNotReadyError");
  });

  it("records an exact versioned clickwrap snapshot and does not grant authority", () => {
    const source = read("src/lib/legal/member-signup-legal.ts");
    expect(source).toContain('documentKey: "member_signup_baseline"');
    expect(source).toContain("documentSha256");
    expect(source).toContain("documentSnapshot");
    expect(source).toContain('signatureMethod');
    expect(source).toContain('"authorityGranted": false');
    expect(source).not.toMatch(/organizationMembership|roleKey|providerProfile|clinicalAuthority/);
  });
});
