import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationName = "20260829150000_provider_authority_history";
const migrationDir = join(process.cwd(), "prisma", "migrations", migrationName);

describe("provider authority history migration", () => {
  it("adds versioned current authority state and a non-cascading history ledger", () => {
    const sql = readFileSync(join(migrationDir, "migration.sql"), "utf8");

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS "authorityVersion" INTEGER NOT NULL DEFAULT 1');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS "malpracticeAuthorityVersion" INTEGER NOT NULL DEFAULT 1');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "provider_authority_events"');
    expect(sql).not.toMatch(/provider_authority_events[\s\S]*?REFERENCES\s+"providers"/i);
  });

  it("bootstraps one version-one authority event for every existing current record", () => {
    const sql = readFileSync(join(migrationDir, "migration.sql"), "utf8");

    expect(sql).toContain('FROM "provider_credentials"');
    expect(sql).toContain('FROM "provider_facility_privileges"');
    expect(sql).toContain('FROM "providers"');
    expect(sql.match(/'history\.bootstrap'/g)).toHaveLength(3);
    expect(sql.match(/ON CONFLICT \("organizationId", "authorityKind", "authorityRecordId", "authorityVersion"\) DO NOTHING/g)).toHaveLength(3);
  });

  it("keeps source evidence content outside the history table", () => {
    const sql = readFileSync(join(migrationDir, "migration.sql"), "utf8");

    expect(sql).toContain('"evidenceDocumentId" TEXT');
    expect(sql).toContain('"evidenceReference" TEXT');
    expect(sql).not.toMatch(/"(?:rawEvidence|documentContent|policyContent|fileBytes)"/);
  });
});
