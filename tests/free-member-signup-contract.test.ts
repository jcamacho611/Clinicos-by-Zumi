import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("free member signup", () => {
  it("creates person + account + credential without creating organization authority", () => {
    expect(existsSync("src/lib/auth/free-member-signup.ts")).toBe(true);
    if (!existsSync("src/lib/auth/free-member-signup.ts")) return;
    const source = read("src/lib/auth/free-member-signup.ts");
    expect(source).toContain("person.create");
    expect(source).toContain("account.create");
    expect(source).toContain("accountCredential.create");
    expect(source).not.toContain("organization.create");
    expect(source).not.toContain("organizationMembership.create");
    expect(source).not.toContain("locationAssignment.create");
  });

  it("keeps public signup feature-flagged until gateway/account convergence is proven", () => {
    expect(existsSync("src/app/api/auth/signup/route.ts")).toBe(true);
    if (!existsSync("src/app/api/auth/signup/route.ts")) return;
    const route = read("src/app/api/auth/signup/route.ts");
    expect(route).toContain("KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED");
    expect(route).toContain("isSameOriginMutation");
  });

  it("documents the free-member rollout flag as disabled by default", () => {
    const env = read(".env.example");
    expect(env).toContain('KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED=""');
    expect(env).toContain("account migration");
    expect(env).toContain("member -> Clinic OS denial");
  });

  it("routes successful free membership into member onboarding rather than Clinic OS", () => {
    expect(existsSync("src/app/member/page.tsx")).toBe(true);
    if (!existsSync("src/app/member/page.tsx")) return;
    const page = read("src/app/member/page.tsx");
    expect(page).toContain("requireAccountSession");
    expect(page).toContain("What brings you to Klinikos?");
    expect(page).not.toContain("requireClinicSession");
  });

  it("binds legal evidence only to account/person through append-only evidence", () => {
    expect(existsSync("src/lib/legal/account-acceptance-binding.ts")).toBe(true);
    if (!existsSync("src/lib/legal/account-acceptance-binding.ts")) return;
    const source = read("src/lib/legal/account-acceptance-binding.ts");
    expect(source).toContain('INSERT INTO "account_entry_acceptance_bindings"');
    expect(source).toContain("accountId");
    expect(source).toContain("personId");
    expect(source).not.toContain('UPDATE "access_gate_acceptances"');
    expect(source).not.toContain('SET "organizationId"');
    expect(source).not.toContain('SET "userId"');
  });
});
