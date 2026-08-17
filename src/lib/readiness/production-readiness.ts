import "server-only";

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { connectorIntegritySummary } from "@/lib/connectors/status";
import { goDaddyClinicPlanCheckoutStatus, goDaddyPaymentConnector } from "@/lib/commercial/payment-connectors/godaddy";
import { stripeLivePaymentStatus } from "@/lib/commercial/payment-connectors/stripe";
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

export const STRIPE_LIVE_PAYMENT_SUCCESS_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
] as const;

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
    const rows = await db.$queryRaw<Array<{ applied: number; failed: number }>>(Prisma.sql`
      SELECT
        (COUNT(*) FILTER (WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL))::int AS applied,
        (COUNT(*) FILTER (WHERE "finished_at" IS NULL AND "rolled_back_at" IS NULL))::int AS failed
      FROM "_prisma_migrations"
    `);
    const applied = rows[0]?.applied ?? 0;
    const failed = rows[0]?.failed ?? 0;
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

async function verifiedLiveStripePaymentExists() {
  if (!process.env.DATABASE_URL?.trim()) return false;
  try {
    const rows = await db.$queryRaw<Array<{ verified: boolean }>>(Prisma.sql`
      SELECT EXISTS (
        SELECT 1
        FROM "commercial_payment_events"
        WHERE "provider" = 'stripe'
          AND "eventType" IN (${Prisma.join(STRIPE_LIVE_PAYMENT_SUCCESS_EVENTS)})
          AND "verified" = TRUE
          AND "verificationMethod" = 'webhook_signature'
          AND "processorVerified" = TRUE
          AND "processorMode" = 'live'
          AND "outcome" = 'succeeded'
          AND "processingStatus" = 'applied'
          AND "productKey" = 'operational_audit'
          AND "amountCents" > 0
      ) AS "verified"
    `);
    return rows[0]?.verified === true;
  } catch {
    return false;
  }
}

export function paymentReadinessFromSignals(input: {
  goDaddy: ReturnType<typeof goDaddyPaymentConnector.status>;
  stripe: ReturnType<typeof stripeLivePaymentStatus>;
  planStatus: ReturnType<typeof goDaddyClinicPlanCheckoutStatus>;
  verifiedLivePayment: boolean;
}) {
  const { goDaddy, stripe, planStatus, verifiedLivePayment } = input;
  if (stripe.processorVerification) {
    if (!verifiedLivePayment) {
      return item("payments", "Payments", "PENDING_CONNECTION", "Live Stripe Checkout and signed-webhook configuration are present for the one-time Clinic Operating Analysis, but Klinikos has not recorded an applied signed live payment. Configuration alone is not live-payment proof.", "Run and reconcile one controlled live payment before calling the Stripe rail verified live.");
    }
    return planStatus.allConfigured
      ? item("payments", "Payments", "READY", "Klinikos has recorded an applied signed live Stripe payment for the one-time Clinic Operating Analysis; exact-value GoDaddy subscription links remain available with manual reconciliation.")
      : item("payments", "Payments", "DEGRADED", `Klinikos has recorded an applied signed live Stripe payment for the one-time Clinic Operating Analysis. Recurring plan automation is not part of this slice, and only ${planStatus.configuredPlanKeys.length} of 3 manual subscription paylinks are configured.`, "Keep recurring activation in the Commercial Activation desk until a separately verified recurring processor path exists.");
  }
  if (stripe.checkoutConfigured && !stripe.webhookConfigured) {
    return item("payments", "Payments", "MANUAL_FALLBACK", "A live Stripe server key is operator-configured, but the signed webhook secret is missing. Klinikos will not open Stripe Checkout and continues using the existing GoDaddy/manual-reconciliation path.", "Register /api/webhooks/stripe in Stripe, store its live signing secret in Render, and exercise one real signed live payment before calling the rail verified live.");
  }
  if (!goDaddy.checkoutConfigured) return item("payments", "Payments", "NOT_CONFIGURED", "No current checkout rail is configured.", "Configure the approved payment connector.");
  if (!planStatus.allConfigured) return item("payments", "Payments", "DEGRADED", `GoDaddy checkout exists, but only ${planStatus.configuredPlanKeys.length} of 3 clinic subscription paylinks are configured. The $500 audit paylink is never reused for a subscription plan.`, `Configure: ${planStatus.missing.join(", ")}`);
  return item("payments", "Payments", "MANUAL_FALLBACK", "Exact-value checkout links are configured, but processor verification is not connected. Klinikos requires explicit staff reconciliation before paid access changes.", "Use the Commercial Activation desk until authoritative processor verification is connected.");
}

async function paymentsReadiness() {
  const goDaddy = goDaddyPaymentConnector.status();
  const stripe = stripeLivePaymentStatus();
  const planStatus = goDaddyClinicPlanCheckoutStatus();
  const verifiedLivePayment = stripe.processorVerification
    ? await verifiedLiveStripePaymentExists()
    : false;
  return paymentReadinessFromSignals({ goDaddy, stripe, planStatus, verifiedLivePayment });
}

function zumiReadiness() {
  const status = zumiGatewayStatus();
  return status.available
    ? item("zumi", "Zumi", "READY", status.detail)
    : item("zumi", "Zumi", "PENDING_CONNECTION", status.detail, "Core Klinikos remains usable; configure an approved model deployment when funded reasoning is required.");
}

export async function buildProductionReadiness() {
  const connectors = connectorIntegritySummary();
  const [database, migrations, audit, payments] = await Promise.all([databaseReadiness(), migrationReadiness(), auditReadiness(), paymentsReadiness()]);
  const items = [
    item("app", "Application", "READY", "The readiness page is executing inside the current Klinikos application build."),
    database,
    migrations,
    authReadiness(),
    audit,
    backupReadiness(),
    connectorGroupStatus(["storage", "s3"], "Storage"),
    payments,
    connectorGroupStatus(["twilio", "resend", "communication"], "Communications"),
    zumiReadiness(),
    connectorGroupStatus(["google maps", "maps"], "Maps"),
    connectorGroupStatus(["license", "nppes", "credential", "oig", "sam"], "Grid verification"),
    connectorGroupStatus(["lab", "payer", "clearinghouse", "eligibility", "telemedicine", "imaging", "erx"], "External integrations"),
  ];
  const blockers = items.filter((entry) => entry.state === "BLOCKED").length;
  const notConfigured = items.filter((entry) => ["NOT_CONFIGURED", "PENDING_CONNECTION", "DEGRADED"].includes(entry.state)).length;
  return {
    generatedAt: new Date().toISOString(),
    productionPatientDataApproved: false,
    overall: blockers > 0 ? "BLOCKED" as const : notConfigured > 0 ? "DEGRADED" as const : "READY" as const,
    connectorSummary: { total: connectors.total, configured: connectors.configured, productionUsable: connectors.productionUsable, phiUsable: connectors.phiUsable },
    items,
    notice: "This is operational readiness evidence, not a declaration of HIPAA compliance, EHR certification, or approval for production patient data.",
  };
}
