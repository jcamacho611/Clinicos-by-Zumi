import "server-only";

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { connectorIntegritySummary } from "@/lib/connectors/status";
import { goDaddyPaymentConnector } from "@/lib/commercial/payment-connectors/godaddy";
import { zumiGatewayStatus } from "@/features/zumi/providers";

export const productionReadinessStates = ["READY", "DEGRADED", "MANUAL_FALLBACK", "PENDING_CONNECTION", "BLOCKED", "NOT_CONFIGURED"] as const;
export type ProductionReadinessState = (typeof productionReadinessStates)[number];

export type ProductionReadinessItem = {
  key: string;
  label: string;
  state: ProductionReadinessState;
  detail: string;
  action: string | null;
};

function item(key: string, label: string, state: ProductionReadinessState, detail: string, action: string | null = null): ProductionReadinessItem {
  return { key, label, state, detail, action };
}

function connectorGroupStatus(names: string[], label: string) {
  const summary = connectorIntegritySummary();
  const matching = summary.connectors.filter((connector) => names.some((name) => connector.name.toLowerCase().includes(name) || connector.id.toLowerCase().includes(name)));
  if (matching.some((connector) => connector.productionUsable)) return item(label.toLowerCase().replaceAll(" ", "_"), label, "READY", `${matching.filter((connector) => connector.productionUsable).length} reviewed connector${matching.filter((connector) => connector.productionUsable).length === 1 ? "" : "s"} are production-usable.`);
  if (matching.some((connector) => connector.configured)) return item(label.toLowerCase().replaceAll(" ", "_"), label, "PENDING_CONNECTION", "Configuration exists, but one or more contract, BAA, enrollment, verification, or production-readiness gates are still open.", matching.flatMap((connector) => connector.missingEnv).length ? `Missing configuration: ${[...new Set(matching.flatMap((connector) => connector.missingEnv))].join(", ")}` : "Complete the connector readiness gates before production use.");
  return item(label.toLowerCase().replaceAll(" ", "_"), label, "NOT_CONFIGURED", "No reviewed production connector in this category is active.", matching.length ? `Pending: ${matching.map((connector) => connector.name).join(", ")}` : "No connector is registered for this category.");
}

async function databaseReadiness() {
  if (!process.env.DATABASE_URL?.trim()) return item("database", "Database", "NOT_CONFIGURED", "DATABASE_URL is not configured.", "Connect the production PostgreSQL database.");
  try {
    await db.$queryRaw(Prisma.sql`SELECT 1`);
    return item("database", "Database", "READY", "PostgreSQL responded to a live server-side query.");
  } catch {
    return item("database", "Database", "BLOCKED", "The configured PostgreSQL database did not answer the readiness query.", "Restore database connectivity before production use.");
  }
}

async function migrationReadiness() {
  if (!process.env.DATABASE_URL?.trim()) return item("migrations", "Migrations", "NOT_CONFIGURED", "Migration state cannot be checked without PostgreSQL.");
  try {
    const migrationDirectory = join(process.cwd(), "prisma", "migrations");
    const expected = readdirSync(migrationDirectory, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length;
    const rows = await db.$queryRaw<Array<{ applied: bigint; failed: bigint }>>(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL) AS applied,
        COUNT(*) FILTER (WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL) AS failed
      FROM "_prisma_migrations"
    `);
    const applied = Number(rows[0]?.applied ?? 0n);
    const failed = Number(rows[0]?.failed ?? 0n);
    if (failed > 0) return item("migrations", "Migrations", "BLOCKED", `${failed} database migration${failed === 1 ? "" : "s"} are incomplete.`, "Resolve failed migrations before production use.");
    if (applied < expected) return item("migrations", "Migrations", "DEGRADED", `${applied} of ${expected} repository migrations are recorded as applied.`, "Apply the remaining production migrations.");
    return item("migrations", "Migrations", "READY", `${applied} applied migrations; no unfinished migration is recorded.`);
  } catch {
    return item("migrations", "Migrations", "DEGRADED", "Klinikos could not prove migration parity from the running deployment.", "Verify Prisma migration status before production patient-data use.");
  }
}

async function auditReadiness() {
  if (!process.env.DATABASE_URL?.trim()) return item("audit", "Audit trail", "NOT_CONFIGURED", "Audit persistence depends on the production database.");
  try {
    const count = await db.auditLog.count();
    return item("audit", "Audit trail", "READY", `Audit persistence is queryable. ${count} audit record${count === 1 ? "" : "s"} currently exist.`);
  } catch {
    return item("audit", "Audit trail", "BLOCKED", "The audit table could not be queried.", "Restore audit persistence before consequential production actions.");
  }
}

function authReadiness() {
  const secret = process.env.AUTH_SECRET?.trim() ?? "";
  return secret.length >= 32
    ? item("auth", "Authentication & sessions", "READY", "A production-length AUTH_SECRET is configured; sessions remain server-signed and httpOnly.")
    : item("auth", "Authentication & sessions", "NOT_CONFIGURED", "A production-length AUTH_SECRET is not configured.", "Configure at least 32 random characters before production deployment.");
}

function backupReadiness() {
  const raw = process.env.KLINIKOS_BACKUP_VERIFIED_AT?.trim();
  if (!raw) return item("backups", "Backups", "NOT_CONFIGURED", "No operator-verified backup evidence is configured.", "Run and restore-test the production backup, then record KLINIKOS_BACKUP_VERIFIED_AT.");
  const verifiedAt = new Date(raw);
  if (Number.isNaN(verifiedAt.getTime())) return item("backups", "Backups", "DEGRADED", "KLINIKOS_BACKUP_VERIFIED_AT is not a valid timestamp.", "Record an ISO timestamp after a verified backup/restore exercise.");
  const ageDays = (Date.now() - verifiedAt.getTime()) / 86_400_000;
  return ageDays <= 30
    ? item("backups", "Backups", "READY", `Operator backup evidence was recorded ${Math.max(0, Math.floor(ageDays))} day${Math.floor(ageDays) === 1 ? "" : "s"} ago. This is evidence, not a substitute for a recovery program.`)
    : item("backups", "Backups", "DEGRADED", `The last recorded backup/restore evidence is ${Math.floor(ageDays)} days old.`, "Repeat and document the backup/restore exercise.");
}

function paymentsReadiness() {
  const status = goDaddyPaymentConnector.status();
  if (!status.checkoutConfigured) return item("payments", "Payments", "NOT_CONFIGURED", "No current checkout rail is configured.", "Configure the approved payment connector.");
  if (!status.processorVerification) return item("payments", "Payments", "MANUAL_FALLBACK", "GoDaddy checkout is available, but processor verification is not connected. Klinikos requires explicit staff reconciliation before paid access changes.", "Use the Commercial Activation desk until authoritative processor verification is connected.");
  return item("payments", "Payments", "READY", "Checkout and authoritative processor verification are available.");
}

function zumiReadiness() {
  const status = zumiGatewayStatus();
  return status.available
    ? item("zumi", "Zumi", "READY", status.detail)
    : item("zumi", "Zumi", "PENDING_CONNECTION", status.detail, "Core Klinikos remains usable; configure an approved model deployment when funded reasoning is required.");
}

export async function buildProductionReadiness() {
  const connectors = connectorIntegritySummary();
  const [database, migrations, audit] = await Promise.all([databaseReadiness(), migrationReadiness(), auditReadiness()]);
  const items = [
    item("app", "Application", "READY", "The readiness page is executing inside the current Klinikos application build."),
    database,
    migrations,
    authReadiness(),
    audit,
    backupReadiness(),
    connectorGroupStatus(["storage", "s3"], "Storage"),
    paymentsReadiness(),
    connectorGroupStatus(["twilio", "resend", "communication"], "Communications"),
    zumiReadiness(),
    connectorGroupStatus(["google maps", "maps"], "Maps"),
    connectorGroupStatus(["license", "nppes", "credential", "oig", "sam"], "Grid verification"),
    connectorGroupStatus(["lab", "payer", "clearinghouse", "eligibility", "telemedicine", "imaging", "erx"], "External integrations"),
  ];
  const blockers = items.filter((entry) => entry.state === "BLOCKED").length;
  const notConfigured = items.filter((entry) => ["NOT_CONFIGURED", "PENDING_CONNECTION"].includes(entry.state)).length;
  return {
    generatedAt: new Date().toISOString(),
    productionPatientDataApproved: false,
    overall: blockers > 0 ? "BLOCKED" as const : notConfigured > 0 ? "DEGRADED" as const : "READY" as const,
    connectorSummary: { total: connectors.total, configured: connectors.configured, productionUsable: connectors.productionUsable, phiUsable: connectors.phiUsable },
    items,
    notice: "This is operational readiness evidence, not a declaration of HIPAA compliance, EHR certification, or approval for production patient data.",
  };
}
