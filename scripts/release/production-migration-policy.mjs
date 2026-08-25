import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_NAME = /^\d{14}_[a-z0-9_]+$/i;
const BASELINE_FILE = "production-baseline.json";
const MANIFEST_FILE = "production-release.json";
const FORBIDDEN_SQL = [
  /\bDROP\b/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\s+FROM\b/i,
  /(?:^|;)\s*UPDATE\s+/im,
  /\bALTER\s+COLUMN\b/i,
  /\bRENAME\b/i,
  /\bSET\s+NOT\s+NULL\b/i,
  /\bCREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\b/i,
  /\bCREATE\s+TRIGGER\b/i,
  /\bALTER\s+TYPE\b/i,
];

export function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

export function parsePendingMigrationNames(output) {
  const names = new Set();
  for (const rawLine of String(output ?? "").split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^[-*]\s*/, "");
    if (MIGRATION_NAME.test(line)) names.add(line);
  }
  return [...names];
}

export function assertAdditiveSql(sql, migrationName) {
  for (const pattern of FORBIDDEN_SQL) {
    if (pattern.test(sql)) {
      throw new Error(
        `Migration ${migrationName} is not eligible for automatic production deploy: forbidden SQL matched ${pattern}.`,
      );
    }
  }
}

export function validateApprovedMigration({ migrationName, migrationsDir }) {
  if (!MIGRATION_NAME.test(migrationName)) {
    throw new Error(`Invalid migration name from Prisma status: ${migrationName}`);
  }

  const migrationDir = join(migrationsDir, migrationName);
  const manifestPath = join(migrationDir, MANIFEST_FILE);

  // Without this check a missing manifest surfaces as a bare ENOENT, which reads like a
  // broken build rather than the deliberate refusal it is. An unapproved migration is the
  // most likely reason a deploy stops, so it has to say so in the build log.
  if (!existsSync(manifestPath)) {
    throw new Error(
      `Migration ${migrationName} is pending in production but carries no ${MANIFEST_FILE}, so it is not approved for automatic deploy. Review the migration, confirm it is additive-only, and add the approval manifest.`,
    );
  }

  const sql = readFileSync(join(migrationDir, "migration.sql"), "utf8");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  if (manifest.version !== 1) {
    throw new Error(
      `Migration ${migrationName} has an unsupported production release manifest version.`,
    );
  }
  if (
    manifest.classification !== "additive-only" ||
    manifest.automaticProductionDeploy !== true
  ) {
    throw new Error(
      `Migration ${migrationName} is not explicitly approved for automatic production deploy.`,
    );
  }
  if (manifest.migration !== migrationName) {
    throw new Error(
      `Migration ${migrationName} manifest points at a different migration.`,
    );
  }

  assertAdditiveSql(sql, migrationName);

  const actualSha256 = sha256(sql);
  if (manifest.sha256 !== actualSha256) {
    throw new Error(
      `Migration ${migrationName} changed after production approval. Expected ${manifest.sha256}, got ${actualSha256}.`,
    );
  }

  return { migrationName, sha256: actualSha256 };
}

/**
 * The last migration observed applied in production.
 *
 * Nothing in the repository can query production, so the boundary between "certainly
 * applied" and "possibly pending" has to be a recorded observation. This marker is that
 * observation, and it is only ever moved forward from real `prisma migrate status` output.
 */
export function readProductionBaseline(migrationsDir) {
  const baseline = JSON.parse(
    readFileSync(join(migrationsDir, BASELINE_FILE), "utf8"),
  );

  if (baseline.version !== 1) {
    throw new Error("Unsupported production migration baseline version.");
  }
  if (!MIGRATION_NAME.test(baseline.lastMigrationAppliedInProduction ?? "")) {
    throw new Error(
      "Production migration baseline does not name a valid migration.",
    );
  }

  return baseline;
}

export function listMigrationNames(migrationsDir) {
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && MIGRATION_NAME.test(entry.name))
    .filter((entry) => existsSync(join(migrationsDir, entry.name, "migration.sql")))
    .map((entry) => entry.name)
    .sort();
}

/**
 * Every migration ordered after the recorded production baseline.
 *
 * Prisma applies migrations in timestamp order, so anything after the baseline may still
 * be unapplied in production and must therefore already be approved. Checking this in the
 * repository is what turns "the deploy failed" into "this pull request is missing an
 * approval", which is a question a person can answer before merging.
 */
export function migrationsRequiringApproval(migrationsDir) {
  const { lastMigrationAppliedInProduction } = readProductionBaseline(migrationsDir);
  const names = listMigrationNames(migrationsDir);

  if (!names.includes(lastMigrationAppliedInProduction)) {
    throw new Error(
      `Production migration baseline names ${lastMigrationAppliedInProduction}, which is not present in ${migrationsDir}.`,
    );
  }

  return names.filter((name) => name > lastMigrationAppliedInProduction);
}

export function validatePendingMigrations({ pendingMigrationNames, migrationsDir }) {
  if (pendingMigrationNames.length === 0) {
    throw new Error(
      "Prisma reported a migration problem but no pending migration names could be parsed. Failing closed.",
    );
  }

  return pendingMigrationNames.map((migrationName) =>
    validateApprovedMigration({ migrationName, migrationsDir }),
  );
}
