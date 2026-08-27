import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const claims = readFileSync("prisma/models/relationship-claims.prisma", "utf8");
const identity = readFileSync("prisma/models/universal-identity.prisma", "utf8");
const migration = readFileSync("prisma/migrations/20260827203000_relationship_claims/migration.sql", "utf8");

describe("relationship claim schema", () => {
  it("keeps claim lifecycle and verification separate", () => {
    expect(claims).toContain("model RelationshipClaim");
    expect(claims).toContain("lifecycleStatus");
    expect(claims).toContain("verificationStatus");
    expect(claims).toContain("targetOrganizationId");
    expect(claims).toContain("claimedOrganizationName");
    expect(claims).toContain("reviewedBy");
    expect(claims).toContain("sourceReference");
  });

  it("relates claims to Person without making memberships authority", () => {
    expect(identity).toContain("relationshipClaims RelationshipClaim[]");
    expect(migration).toContain('CREATE TABLE "relationship_claims"');
    expect(migration).toContain('REFERENCES "people"("id")');
  });
});
