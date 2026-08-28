import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const legacySchema = read("prisma/schema.prisma");
const identitySchema = read("prisma/models/universal-identity.prisma");
const migration = read("prisma/migrations/20260823023000_universal_identity_foundation/migration.sql");
const repository = read("src/lib/identity/relationship-repository.ts");
const master = read("docs/KLINIKOS_MASTER_CANON.md");

describe("universal identity compatibility boundary", () => {
  it("keeps the current user organization and role fields authoritative for existing sessions", () => {
    expect(legacySchema).toMatch(/model User \{[\s\S]*?organizationId\s+String/);
    expect(legacySchema).toMatch(/model User \{[\s\S]*?roleKey\s+String/);
    expect(migration).not.toContain('ALTER TABLE "users" ADD COLUMN');
    expect(migration).not.toContain('DROP COLUMN');
  });

  it("keeps patient portal authentication separate from organization relationships", () => {
    expect(legacySchema).toContain("model PortalAccount {");
    expect(identitySchema).not.toContain("patientId");
    expect(identitySchema).not.toContain("PortalAccount");
  });

  it("uses new relationship records as read-only context rather than an authorization shortcut", () => {
    expect(repository).toContain('import "server-only"');
    expect(repository).toContain("getPersonContextForLegacyUser");
    expect(repository).toContain("legacyMembershipOrganizationId");
    expect(repository).not.toContain("defaultOrganizationId");
    expect(repository).toContain("current session tenant authority");
    expect(repository).not.toContain("setSession");
    expect(repository).not.toContain("switchOrganization");
    expect(master).toContain("KLINIKOS-EXPERIENCE-001");
    expect(master).toContain("These are projections, not permanent account types.");
    expect(master).toContain("Context switching is a security event");
  });

  it("anchors legacy membership context to the still-authoritative legacy user organization", () => {
    expect(repository).toContain("db.user.findUnique");
    expect(repository).toContain("organizationId: legacyUser.organizationId");
    expect(repository.indexOf("db.user.findUnique")).toBeLessThan(repository.indexOf("db.organizationMembership.findFirst"));
  });

  it("backfills organization relationships without creating hidden foreign keys to legacy domain tables", () => {
    expect(migration).toContain('FROM "users"');
    expect(migration).toContain("'person_' || \"id\"");
    expect(migration).toContain("'orgmem_' || \"id\"");
    expect(migration).not.toContain('REFERENCES "users"');
    expect(migration).not.toContain('REFERENCES "organizations"');
    expect(migration).not.toContain('REFERENCES "locations"');
  });

  it("does not infer legal identity or employment from a legacy application user", () => {
    expect(migration).toContain('    NULL,\n    "email",');
    expect(migration).toContain("'organization_user'");
    expect(migration).not.toContain("'staff',");
  });
});
