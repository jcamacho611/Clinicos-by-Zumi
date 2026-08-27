import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const exists = (path: string) => existsSync(join(root, path));

const accountSchema = "prisma/models/universal-account.prisma";
const identitySchema = "prisma/models/universal-identity.prisma";
const signupService = "src/lib/auth/free-member-signup.ts";
const signupRoute = "src/app/api/auth/signup/route.ts";
const signupPage = "src/app/signup/page.tsx";
const signupClient = "src/app/signup/FreeSignupClient.tsx";
const memberPage = "src/app/member/page.tsx";
const durableGate = "src/lib/auth/member-signup-attestation.ts";

describe("universal account onboarding release", () => {
  it("adds an organization-agnostic Account on top of Person", () => {
    expect(exists(accountSchema)).toBe(true);
    const schema = read(accountSchema);
    const identity = read(identitySchema);
    const accountBlock = schema.slice(schema.indexOf("model Account {"), schema.indexOf("model AccountCredential {"));
    expect(accountBlock).toContain("personId");
    expect(accountBlock).toContain("primaryEmail");
    expect(accountBlock).not.toContain("organizationId");
    expect(identity).toContain("account                 Account?");
  });

  it("creates a free person account without creating clinic or organization authority", () => {
    const source = read(signupService);
    expect(source).toContain("tx.person.create");
    expect(source).toContain("tx.account.create");
    expect(source).toContain("tx.accountCredential.create");
    expect(source).toContain("tx.accountSession.create");
    expect(source).not.toMatch(/tx\.organization\.create|tx\.organizationMembership\.create|tx\.user\.create|tx\.locationAssignment\.create/);
    expect(source).toContain('kind: "member"');
  });

  it("requires protected-entry evidence and an explicit rollout flag", () => {
    const service = read(signupService);
    const route = read(signupRoute);
    expect(service).toMatch(/Protected-entry acceptance is required/i);
    expect(route).toContain('KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED !== "true"');
    expect(route).toContain("readAcceptedEntryProof");
    expect(route).toContain("isSameOriginMutation");
  });

  it("fails closed in production unless a durable signup-abuse authority attests the request", () => {
    expect(exists(durableGate)).toBe(true);
    const gate = read(durableGate);
    const route = read(signupRoute);
    expect(gate).toContain("MEMBER_SIGNUP_DURABLE_ABUSE_MODE");
    expect(gate).toContain("timingSafeEqual");
    expect(route).toContain("memberSignupDurableAbuseAttested(request)");
    expect(route).toMatch(/durable abuse protection is not available/i);
  });

  it("keeps signup browser code free of tenant authority, secrets and PHI", () => {
    expect(exists(signupPage)).toBe(true);
    expect(exists(signupClient)).toBe(true);
    const browser = read(signupClient);
    expect(browser).not.toMatch(/process\.env|DATABASE_URL|organizationId|roleKey|paymentConfirmedAt|Prisma|@\/lib\/db/);
    expect(browser).toMatch(/do not enter.*(?:PHI|patient)/i);
    expect(browser).toContain('fetch("/api/auth/signup"');
  });

  it("lands a free member in a member experience that does not imply clinic authority", () => {
    expect(exists(memberPage)).toBe(true);
    const member = read(memberPage);
    expect(member).toContain("requireAccountSession");
    expect(member).toMatch(/What brings you to Klinikos/i);
    expect(member).not.toMatch(/clinic_owner|organizationId/);
  });
});
