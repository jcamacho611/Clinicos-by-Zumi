import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parsePendingMigrationNames,
  sha256,
  validatePendingMigrations,
} from "../scripts/release/production-migration-policy.mjs";

describe("production migration policy", () => {
  it("parses pending migration names from Prisma status output", () => {
    expect(
      parsePendingMigrationNames(`Database schema is not up to date!\n\nFollowing migration have not yet been applied:\n20260823200000_body_map_persistence_v1\n`),
    ).toEqual(["20260823200000_body_map_persistence_v1"]);
  });

  it("accepts only exact approved additive migration artifacts", () => {
    const root = mkdtempSync(join(tmpdir(), "klinikos-migration-policy-"));
    const migrationName = "20260823200000_body_map_persistence_v1";
    const migrationDir = join(root, migrationName);
    mkdirSync(migrationDir, { recursive: true });

    const sql = "CREATE TABLE IF NOT EXISTS example (id text primary key);\n";
    writeFileSync(join(migrationDir, "migration.sql"), sql);
    writeFileSync(
      join(migrationDir, "production-release.json"),
      JSON.stringify({
        version: 1,
        migration: migrationName,
        classification: "additive-only",
        automaticProductionDeploy: true,
        sha256: sha256(sql),
      }),
    );

    expect(
      validatePendingMigrations({
        pendingMigrationNames: [migrationName],
        migrationsDir: root,
      }),
    ).toHaveLength(1);
  });

  it("rejects destructive SQL even when a manifest claims it is additive", () => {
    const root = mkdtempSync(join(tmpdir(), "klinikos-migration-policy-"));
    const migrationName = "20260823200000_body_map_persistence_v1";
    const migrationDir = join(root, migrationName);
    mkdirSync(migrationDir, { recursive: true });

    const sql = "DROP TABLE example;\n";
    writeFileSync(join(migrationDir, "migration.sql"), sql);
    writeFileSync(
      join(migrationDir, "production-release.json"),
      JSON.stringify({
        version: 1,
        migration: migrationName,
        classification: "additive-only",
        automaticProductionDeploy: true,
        sha256: sha256(sql),
      }),
    );

    expect(() =>
      validatePendingMigrations({
        pendingMigrationNames: [migrationName],
        migrationsDir: root,
      }),
    ).toThrow(/not eligible for automatic production deploy/);
  });

  it("rejects a migration changed after approval", () => {
    const root = mkdtempSync(join(tmpdir(), "klinikos-migration-policy-"));
    const migrationName = "20260823200000_body_map_persistence_v1";
    const migrationDir = join(root, migrationName);
    mkdirSync(migrationDir, { recursive: true });

    writeFileSync(
      join(migrationDir, "migration.sql"),
      "CREATE TABLE IF NOT EXISTS changed (id text primary key);\n",
    );
    writeFileSync(
      join(migrationDir, "production-release.json"),
      JSON.stringify({
        version: 1,
        migration: migrationName,
        classification: "additive-only",
        automaticProductionDeploy: true,
        sha256: "not-the-current-hash",
      }),
    );

    expect(() =>
      validatePendingMigrations({
        pendingMigrationNames: [migrationName],
        migrationsDir: root,
      }),
    ).toThrow(/changed after production approval/);
  });

  it("fails closed when Prisma failed but no migration can be parsed", () => {
    expect(() =>
      validatePendingMigrations({
        pendingMigrationNames: [],
        migrationsDir: "/does/not/matter",
      }),
    ).toThrow(/Failing closed/);
  });
});
