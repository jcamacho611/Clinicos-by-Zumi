import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const prismaConfig = read("prisma.config.ts");
const legacySchema = read("prisma/schema.prisma");
const identitySchema = read("prisma/models/universal-identity.prisma");
const supreme = read("docs/KLINIKOS_SUPREME_ARCHITECTURE_CANON.md");

describe("universal identity foundation", () => {
  it("loads Prisma from the schema folder and points migrate at the existing migration chain", () => {
    expect(prismaConfig).toContain('schema: "prisma"');
    expect(prismaConfig).toContain('path: "prisma/migrations"');
  });

  it("introduces one durable person anchor and effective-dated relationships", () => {
    expect(identitySchema).toContain("model Person {");
    expect(identitySchema).toContain("model OrganizationMembership {");
    expect(identitySchema).toContain("model LocationAssignment {");
    expect(identitySchema).toContain("effectiveFrom DateTime");
    expect(identitySchema).toContain("effectiveTo DateTime?");
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

  it("preserves a separately governed patient authentication context", () => {
    expect(legacySchema).toContain("model PortalAccount {");
    expect(legacySchema).toContain("patientId       String          @unique");
    expect(supreme).toContain("Patient identities never automatically become public Grid profiles");
  });

  it("does not let the new relationship substrate widen current authorization by itself", () => {
    expect(supreme).toContain("No UI state, public profile, Grid listing, EDU completion, AI recommendation, owner title, payment status or uploaded credential may bypass server authority");
    expect(supreme).toContain("Existing `User`, `PortalAccount`, `Provider`, patient and Grid participant models may remain during migration");
  });
});