import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const prismaConfig = read("prisma.config.ts");
const legacySchema = read("prisma/schema.prisma");
const identitySchema = read("prisma/models/universal-identity.prisma");
const sourceOfTruth = read("docs/SOURCE_OF_TRUTH.md");

describe("universal identity foundation", () => {
  it("loads Prisma from the schema folder and points migrate at the existing migration chain", () => {
    expect(prismaConfig).toContain('schema: "prisma"');
    expect(prismaConfig).toContain('path: "prisma/migrations"');
  });

  it("introduces one durable person anchor and effective-dated relationships", () => {
    expect(identitySchema).toContain("model Person {");
    expect(identitySchema).toContain("model OrganizationMembership {");
    expect(identitySchema).toContain("model LocationAssignment {");
    expect(identitySchema).toContain("effectiveFrom");
    expect(identitySchema).toContain("effectiveTo");
    expect(identitySchema).toContain('@@map("people")');
    expect(identitySchema).toContain('@@map("organization_memberships")');
    expect(identitySchema).toContain('@@map("location_assignments")');
  });

  it("preserves current staff authentication and default organization authority during migration", () => {
    expect(legacySchema).toMatch(/model User \{[\s\S]*?organizationId\s+String/);
    expect(legacySchema).toMatch(/model User \{[\s\S]*?roleKey\s+String/);
    expect(legacySchema).toContain("authCredential AuthCredential?");
    expect(legacySchema).toContain("sessions       AuthSession[]");
  });

  it("preserves separately governed patient portal authentication", () => {
    expect(legacySchema).toContain("model PortalAccount {");
    expect(legacySchema).toContain("patientId       String          @unique");
    expect(identitySchema).not.toContain("patientId");
    expect(identitySchema).not.toContain("PortalAccount");
  });

  it("inherits the current one-identity/contextual-authority law instead of replacing architecture precedence", () => {
    expect(sourceOfTruth).toContain("Implementation truth remains current code/schema/migrations/tests/CI.");
    expect(sourceOfTruth).toContain("One identity may hold multiple roles and evolve through the ecosystem.");
    expect(sourceOfTruth).toContain("A generic `provider` label is never sufficient to grant regulated capability.");
  });
});
