import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const optionalRead = (path: string) => existsSync(join(process.cwd(), path)) ? read(path) : "";

const route = read("src/app/api/grid/enroll/route.ts");
const rules = read("src/lib/grid-rules.ts");
const joinPage = read("src/app/grid/join/page.tsx");
const enrollmentForm = read("src/components/clinic/grid/contractor-enrollment-form.tsx");
const enrollmentRepository = optionalRead("src/lib/repositories/grid-enrollment-repository.ts");

describe("Grid existing-account enrollment contract", () => {
  it("requires server-validated session proof before an existing identity can be reused", () => {
    expect(route).toContain("getAuthenticationSession");
    expect(route).toContain("createIdentitySafeGridContractorEnrollment");
    expect(route).toContain("userId: session.userId");
    expect(route).toContain("email: session.email");
    expect(enrollmentRepository).toContain("identityProof");
    expect(enrollmentRepository).toContain("existingUser.id !== identityProof.userId");
    expect(enrollmentRepository).toContain("existingUser.email !== identityProof.email");
  });

  it("does not require or replace a password when the authenticated account already exists", () => {
    expect(rules).toMatch(/password:[\s\S]{0,500}\.optional\(\)/);
    expect(enrollmentRepository).toContain("A password is required to create a new Grid account");
    expect(enrollmentRepository).not.toContain("authCredential: { update:");
    expect(enrollmentRepository).not.toContain("authSession.update");
  });

  it("keeps the one-to-one legacy provider link untouched for an existing account", () => {
    expect(enrollmentRepository).toContain("userId: accountReused ? null : applicantUser.id");
    expect(enrollmentRepository).toContain("grid_contractor_applicant");
    expect(enrollmentRepository).toContain("ensureOrganizationRelationshipForLegacyUser");
  });

  it("gives existing accounts a sign-in-first enrollment path", () => {
    expect(joinPage).toContain("getAuthenticationSession");
    expect(joinPage).toContain("returnTo");
    expect(enrollmentForm).toContain("account");
    expect(enrollmentForm).toContain("readOnly");
  });
});
