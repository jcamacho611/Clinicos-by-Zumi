import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATION_NAME = /^\d{14}_[a-z0-9_]+$/i;
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
  const sql = readFileSync(join(migrationDir, "migration.sql"), "utf8");
  const manifest = JSON.parse(
    readFileSync(join(migrationDir, "production-release.json"), "utf8"),
  );

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
