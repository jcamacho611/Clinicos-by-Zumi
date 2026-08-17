/**
 * Real-database Stripe payment truth journey.
 *
 * Signature verification is exercised at the HTTP boundary in Vitest. This journey
 * proves that the normalized signed evidence cannot bypass amount, currency, tenant,
 * mode, failure, replay, or refund rules in the persistent Financial OS path.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  attachCommercialCheckoutReferences,
  createCommercialCheckoutIntent,
  recordCommercialPaymentEvidence,
} from "@/lib/commercial/payment-evidence-repository";

const db = new PrismaClient();
const run = Date.now().toString(36);
const results: { label: string; pass: boolean; detail: string }[] = [];

function check(label: string, pass: boolean, detail: string) {
  results.push({ label, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}\n        ${detail}`);
}

async function checkoutStatus(id: string) {
  const rows = await db.$queryRawUnsafe<Array<{ status: string; refundedAmountCents: number; externalPaymentIntentId: string | null }>>(
    `SELECT "status", "refundedAmountCents", "externalPaymentIntentId" FROM "commercial_checkout_intents" WHERE "id" = $1`,
    id,
  );
  return rows[0] ?? null;
}

async function createStripeIntent(organizationId: string, suffix: string) {
  const intent = await createCommercialCheckoutIntent({
    organizationId,
    email: `buyer-${suffix}@stripe-journey.test`,
    provider: "stripe",
    productKey: "operational_audit",
    amountCents: 50_000,
    currency: "USD",
    processorMode: "live",
  });
  const externalCheckoutId = `cs_live_${run}_${suffix}`;
  await attachCommercialCheckoutReferences({
    intentId: intent.id,
    organizationId,
    provider: "stripe",
    externalCheckoutId,
  });
  return { ...intent, externalCheckoutId };
}

function stripeEvidence(intent: Awaited<ReturnType<typeof createStripeIntent>>, suffix: string) {
  return {
    provider: "stripe",
    eventId: `evt_${run}_${suffix}`,
    eventType: "checkout.session.completed",
    verified: true,
    verificationMethod: "webhook_signature" as const,
    processorVerified: true,
    processorMode: "live" as const,
    outcome: "succeeded" as const,
    payloadHash: `hash_${run}_${suffix}`,
    payload: { stripeObjectId: intent.externalCheckoutId, livemode: true },
    checkoutIntentId: intent.id,
    checkoutState: intent.state,
    externalCheckoutId: intent.externalCheckoutId,
    externalPaymentIntentId: `pi_live_${run}_${suffix}`,
    amountCents: 50_000,
    currency: "usd",
  };
}

async function main() {
  const a = await db.organization.create({ data: { name: `Stripe Journey A ${run}`, slug: `stripe-journey-a-${run}`, clinicType: "clinic", status: "active" }, select: { id: true } });
  const b = await db.organization.create({ data: { name: `Stripe Journey B ${run}`, slug: `stripe-journey-b-${run}`, clinicType: "clinic", status: "active" }, select: { id: true } });

  const migrationSql = readFileSync(join(process.cwd(), "prisma/migrations/20260817041000_stripe_payment_truth/migration.sql"), "utf8");
  const migrationStatements = migrationSql.split(/;\s*(?:\n|$)/).map((statement) => statement.trim()).filter(Boolean);
  const legacyEvidence = await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('CREATE SCHEMA "stripe_migration_compat_probe"');
    await tx.$executeRawUnsafe('SET LOCAL search_path TO "stripe_migration_compat_probe"');
    await tx.$executeRawUnsafe('CREATE TABLE "commercial_checkout_intents" ("status" TEXT NOT NULL DEFAULT \'created\', "amountCents" INTEGER, "provider" TEXT NOT NULL)');
    await tx.$executeRawUnsafe('CREATE TABLE "commercial_payment_events" ("id" TEXT PRIMARY KEY, "processorVerified" BOOLEAN NOT NULL DEFAULT FALSE, "processingStatus" TEXT NOT NULL DEFAULT \'received\', "verified" BOOLEAN NOT NULL DEFAULT FALSE)');
    await tx.$executeRawUnsafe("INSERT INTO \"commercial_payment_events\" (\"id\", \"processorVerified\", \"processingStatus\", \"verified\") VALUES ('applied', TRUE, 'applied', TRUE), ('failed', TRUE, 'failed', TRUE), ('unknown', FALSE, 'ignored', FALSE)");
    for (const statement of migrationStatements) await tx.$executeRawUnsafe(statement);
    const rows = await tx.$queryRawUnsafe<Array<{ id: string; processorMode: string; outcome: string }>>('SELECT "id", "processorMode", "outcome" FROM "commercial_payment_events" ORDER BY "id"');
    await tx.$executeRawUnsafe('DROP SCHEMA "stripe_migration_compat_probe" CASCADE');
    return rows;
  });
  check(
    "migration 53 preserves populated legacy processor evidence without inventing mode or success",
    legacyEvidence.length === 3
      && legacyEvidence.every((row) => row.processorMode === "manual")
      && legacyEvidence.find((row) => row.id === "applied")?.outcome === "succeeded"
      && legacyEvidence.find((row) => row.id === "failed")?.outcome === "failed"
      && legacyEvidence.find((row) => row.id === "unknown")?.outcome === "pending",
    legacyEvidence.map((row) => `${row.id}:${row.processorMode}/${row.outcome}`).join(","),
  );

  const paidIntent = await createStripeIntent(a.id, "paid");
  const paidInput = stripeEvidence(paidIntent, "paid");
  const paid = await recordCommercialPaymentEvidence(paidInput);
  const paidState = await checkoutStatus(paidIntent.id);
  check("exact live Stripe evidence completes the intended checkout", paid.status === "applied" && paidState?.status === "completed", `event=${paid.status} checkout=${paidState?.status}`);

  const replay = await recordCommercialPaymentEvidence(paidInput);
  const eventCount = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS "count" FROM "commercial_payment_events" WHERE "provider" = 'stripe' AND "eventId" = $1`,
    paidInput.eventId,
  );
  check("a replayed Stripe event is idempotent", replay.idempotent && Number(eventCount[0]?.count ?? 0) === 1, `idempotent=${replay.idempotent} persisted=${eventCount[0]?.count}`);

  let conflictingReplayRefused = false;
  try {
    await recordCommercialPaymentEvidence({ ...paidInput, payloadHash: `${paidInput.payloadHash}_different` });
  } catch {
    conflictingReplayRefused = true;
  }
  check("a reused event ID cannot substitute different signed evidence", conflictingReplayRefused, conflictingReplayRefused ? "conflict refused" : "CONFLICT ACCEPTED");

  const wrongAmountIntent = await createStripeIntent(a.id, "wrong_amount");
  const wrongAmount = await recordCommercialPaymentEvidence({ ...stripeEvidence(wrongAmountIntent, "wrong_amount"), amountCents: 49_999 });
  check("an incorrect amount cannot complete the checkout", wrongAmount.status === "failed" && (await checkoutStatus(wrongAmountIntent.id))?.status === "created", `event=${wrongAmount.status}`);

  const wrongCurrencyIntent = await createStripeIntent(a.id, "wrong_currency");
  const wrongCurrency = await recordCommercialPaymentEvidence({ ...stripeEvidence(wrongCurrencyIntent, "wrong_currency"), currency: "cad" });
  check("an incorrect currency cannot complete the checkout", wrongCurrency.status === "failed" && (await checkoutStatus(wrongCurrencyIntent.id))?.status === "created", `event=${wrongCurrency.status}`);

  const crossTenantIntent = await createStripeIntent(a.id, "cross_tenant");
  const crossTenant = await recordCommercialPaymentEvidence({ ...stripeEvidence(crossTenantIntent, "cross_tenant"), organizationId: b.id });
  const bMutationAudits = await db.auditLog.count({ where: { organizationId: b.id, action: { startsWith: "commercial.payment" } } });
  check("a cross-tenant reference cannot mutate the other tenant", crossTenant.status === "failed" && bMutationAudits === 0 && (await checkoutStatus(crossTenantIntent.id))?.status === "created", `event=${crossTenant.status} tenant-b-audits=${bMutationAudits}`);

  const testModeIntent = await createStripeIntent(a.id, "test_mode");
  const testMode = await recordCommercialPaymentEvidence({ ...stripeEvidence(testModeIntent, "test_mode"), processorMode: "test" });
  check("test-mode evidence cannot satisfy a live checkout", testMode.status === "failed" && (await checkoutStatus(testModeIntent.id))?.status === "created", `event=${testMode.status}`);

  const failedIntent = await createStripeIntent(a.id, "failed");
  const failed = await recordCommercialPaymentEvidence({
    ...stripeEvidence(failedIntent, "failed"),
    eventType: "payment_intent.payment_failed",
    outcome: "failed",
  });
  check("processor failure remains unpaid", failed.status === "failed" && (await checkoutStatus(failedIntent.id))?.status === "created", `event=${failed.status}`);

  const refundFirstIntent = await createStripeIntent(a.id, "refund_first");
  const refundFirstPaymentIntentId = `pi_live_${run}_refund_first`;
  const refundFirst = await recordCommercialPaymentEvidence({
    provider: "stripe",
    eventId: `evt_${run}_refund_first`,
    eventType: "charge.refunded",
    verified: true,
    verificationMethod: "webhook_signature",
    processorVerified: true,
    processorMode: "live",
    outcome: "refunded",
    payloadHash: `hash_${run}_refund_first`,
    payload: { stripeObjectId: `ch_live_${run}_refund_first`, livemode: true },
    checkoutIntentId: refundFirstIntent.id,
    checkoutState: refundFirstIntent.state,
    externalPaymentIntentId: refundFirstPaymentIntentId,
    amountCents: 50_000,
    currency: "usd",
  });
  const refundFirstState = await checkoutStatus(refundFirstIntent.id);
  const successAfterRefund = await recordCommercialPaymentEvidence({
    ...stripeEvidence(refundFirstIntent, "success_after_refund"),
    externalPaymentIntentId: refundFirstPaymentIntentId,
  });
  const finalRefundFirstState = await checkoutStatus(refundFirstIntent.id);
  check(
    "refund-before-completion ordering preserves the final refunded truth",
    refundFirst.status === "applied" && refundFirstState?.status === "refunded" && successAfterRefund.status === "applied" && finalRefundFirstState?.status === "refunded",
    `refund=${refundFirst.status} first=${refundFirstState?.status} success=${successAfterRefund.status} final=${finalRefundFirstState?.status}`,
  );

  const refund = await recordCommercialPaymentEvidence({
    provider: "stripe",
    eventId: `evt_${run}_refund`,
    eventType: "charge.refunded",
    verified: true,
    verificationMethod: "webhook_signature",
    processorVerified: true,
    processorMode: "live",
    outcome: "refunded",
    payloadHash: `hash_${run}_refund`,
    payload: { stripeObjectId: `ch_live_${run}_refund`, livemode: true },
    externalPaymentIntentId: paidInput.externalPaymentIntentId,
    amountCents: 50_000,
    currency: "usd",
  });
  const refundedState = await checkoutStatus(paidIntent.id);
  check("a full refund reverses checkout truth without creating a second payment", refund.status === "applied" && refundedState?.status === "refunded" && refundedState.refundedAmountCents === 50_000, `event=${refund.status} checkout=${refundedState?.status} refunded=${refundedState?.refundedAmountCents}`);

  await db.organization.deleteMany({ where: { id: { in: [a.id, b.id] } } });
  await db.$disconnect();
  const passed = results.filter((result) => result.pass).length;
  console.log(`\n${passed}/${results.length} Stripe payment journey checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
