import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LEGAL_FOUNDATION_MIGRATION = "20260818182000_legal_access_foundation";
const migrationsDir = join(process.cwd(), "prisma", "migrations");
const protectedPatterns = [
  /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["']?legal_agreement_versions["']?/iu,
  /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["']?legal_agreement_events["']?/iu,
  /DROP\s+(?:COLUMN\s+)?["']?documentSha256["']?/iu,
  /DROP\s+(?:COLUMN\s+)?["']?documentSnapshot["']?/iu,
  /DROP\s+(?:COLUMN\s+)?["']?signedAt["']?/iu,
  /DROP\s+(?:COLUMN\s+)?["']?idempotencyKey["']?/iu,
];

describe("legal evidence migration safety", () => {
  it("fails if a later checked-in migration silently destroys executed-agreement evidence", () => {
    const laterMigrations = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name > LEGAL_FOUNDATION_MIGRATION)
      .map((entry) => entry.name)
      .sort();

    const destructive: string[] = [];
    for (const migration of laterMigrations) {
      const sqlPath = join(migrationsDir, migration, "migration.sql");
      const sql = readFileSync(sqlPath, "utf8");
      for (const pattern of protectedPatterns) {
        if (pattern.test(sql)) destructive.push(`${migration}: ${pattern.source}`);
      }
    }

    expect(destructive, "Executed agreement evidence must not be dropped by a generated migration without an explicit reviewed preservation plan.").toEqual([]);
  });
});
