import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  migrationsRequiringApproval,
  parsePendingMigrationNames,
  readProductionBaseline,
  sha256,
  validatePendingMigrations,
} from "../scripts/release/production-migration-policy.mjs";

const REPOSITORY_MIGRATIONS_DIR = join(process.cwd(), "prisma", "migrations");

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

  it("explains that an unapproved migration is unapproved rather than throwing ENOENT", () => {
    const root = mkdtempSync(join(tmpdir(), "klinikos-migration-policy-"));
    const migrationName = "20260823023000_unapproved_example";
    mkdirSync(join(root, migrationName), { recursive: true });
    writeFileSync(
      join(root, migrationName, "migration.sql"),
      "CREATE TABLE IF NOT EXISTS example (id text primary key);\n",
    );

    expect(() =>
      validatePendingMigrations({
        pendingMigrationNames: [migrationName],
        migrationsDir: root,
      }),
    ).toThrow(/carries no production-release\.json, so it is not approved/);
  });
});

/**
 * These run against the real repository, not a fixture.
 *
 * The suite above proves the policy is correct in isolation, and it passed while
 * production sat unable to deploy: every pending migration but one had no approval
 * manifest, so the gate refused every build. A policy test that never looks at the
 * migrations actually shipping cannot detect that, so these do.
 */
describe("repository production migration approval coverage", () => {
  it("records a baseline that names a real migration in this repository", () => {
    const baseline = readProductionBaseline(REPOSITORY_MIGRATIONS_DIR);

    expect(baseline.lastMigrationAppliedInProduction).toMatch(/^\d{14}_[a-z0-9_]+$/i);
    expect(() => migrationsRequiringApproval(REPOSITORY_MIGRATIONS_DIR)).not.toThrow();
  });

  it("approves every migration that may still be unapplied in production", () => {
    const requiringApproval = migrationsRequiringApproval(REPOSITORY_MIGRATIONS_DIR);

    // If this is empty the check is vacuous, which is the failure mode it exists to prevent.
    expect(requiringApproval.length).toBeGreaterThan(0);

    const approved = validatePendingMigrations({
      pendingMigrationNames: requiringApproval,
      migrationsDir: REPOSITORY_MIGRATIONS_DIR,
    });

    expect(approved.map(({ migrationName }) => migrationName)).toEqual(requiringApproval);
  });
});
