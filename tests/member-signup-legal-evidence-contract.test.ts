import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const releaseSource = readFileSync("src/lib/auth/member-signup-release.ts", "utf8");
const signupRoute = readFileSync("src/app/api/account/signup/route.ts", "utf8");
const signupRepository = readFileSync("src/lib/auth/person-account-repository.ts", "utf8");

describe("versioned member acceptance evidence rail", () => {
  it("extends the existing legal evidence tables with Person and Account bindings", () => {
    const migration = readFileSync(
      "prisma/migrations/20260902040000_member_legal_acceptance_bindings/migration.sql",
      "utf8",
    );

    expect(migration).toContain('ALTER TABLE "access_gate_acceptances"');
    expect(migration).toContain('"personId" TEXT');
    expect(migration).toContain('"accountId" TEXT');
    expect(migration).toContain('ALTER TABLE "legal_agreement_events"');
    expect(migration).toContain('"personId" TEXT');
    expect(migration).toContain('"accountId" TEXT');
    expect(migration).toContain("access_gate_acceptances_account_active_version_key");
    expect(migration).not.toContain('DROP TABLE "access_gate_acceptances"');
    expect(migration).not.toContain('DROP TABLE "legal_agreement_events"');
  });

  it("keeps rail implementation separate from document/source approval", () => {
    expect(releaseSource).toContain("VERSIONED_MEMBER_ACCEPTANCE_RAIL_IMPLEMENTED = true");
    expect(releaseSource).toContain("acceptanceSourcesReady");
    expect(releaseSource).toContain("approvedDocuments");
    expect(releaseSource).toMatch(/approvedDocuments\s*&&\s*acceptanceSourcesReady\s*&&\s*VERSIONED_MEMBER_ACCEPTANCE_RAIL_IMPLEMENTED/);
  });

  it("requires the signup route to resolve authoritative member legal evidence server-side", () => {
    expect(signupRoute).toContain("resolveMemberSignupAcceptance");
    expect(signupRoute).toContain("legalAcceptance");
    expect(signupRoute).not.toContain("documentSnapshot: parsed.data");
    expect(signupRoute).not.toContain("documentSha256: parsed.data");
  });

  it("records required legal evidence inside the same Person Account transaction", () => {
    expect(signupRepository).toContain("recordMemberSignupLegalEvidence");
    expect(signupRepository).toContain("legalAcceptance");
    expect(signupRepository).toContain("accountId: account.id");
    expect(signupRepository).toContain("personId: person.id");
  });
});
