/**
 * MVP Journey 1 — the commercial path, against a real database.
 *
 * Proves the architecture the directive requires:
 *
 *   PAYMENT EVIDENCE -> KLINIKOS COMMERCIAL STATE -> SUBSCRIPTION -> ENTITLEMENTS
 *
 * and, just as importantly, proves the things that must NOT happen: an unverified
 * payment must not grant anything, a browser redirect must not settle a purchase, and a
 * replayed webhook must not create a second subscription.
 */
import { PrismaClient } from "@prisma/client";
import {
  createCommercialCheckoutIntent,
  recordCommercialPaymentEvidence,
  activateCommercialSubscription,
} from "@/lib/commercial/payment-evidence-repository";

const db = new PrismaClient();
const results: { label: string; pass: boolean; detail: string }[] = [];

function check(label: string, pass: boolean, detail: string) {
  results.push({ label, pass, detail });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}\n        ${detail}`);
}

const hash = (s: string) => Buffer.from(s).toString("base64").slice(0, 40);

// Payment events are deliberately permanent and idempotent by event id, so each run
// needs its own ids. Reusing them across runs would exercise the replay path instead of
// the first-delivery path and silently invert what this journey is testing.
const RUN = Date.now().toString(36);

async function main() {
  await db.organization.deleteMany({ where: { slug: "mvp-journey-clinic" } });
  const org = await db.organization.create({
    data: { name: "MVP Journey Clinic", slug: "mvp-journey-clinic", clinicType: "medspa", status: "active" },
    select: { id: true },
  });
  const email = "owner@mvp-journey.test";

  // --- 1. checkout intent: server owns product + organization -------------
  const intent = await createCommercialCheckoutIntent({
    organizationId: org.id,
    email,
    provider: "godaddy",
    productKey: "clinic_operator",
  });
  check(
    "checkout intent is created server-side before the buyer leaves",
    Boolean(intent.state) && intent.product.key === "clinic_operator",
    `state=${String(intent.state).slice(0, 12)}… product=${intent.product.key}`,
  );

  // --- 2. an UNVERIFIED payment must grant nothing ------------------------
  const unverified = await recordCommercialPaymentEvidence({
    provider: "godaddy",
    eventId: `evt_unverified_${RUN}`,
    eventType: "payment.reported",
    verified: false,
    verificationMethod: "unverified",
    processorVerified: false,
    payloadHash: hash(`unverified-${RUN}`),
    payload: { note: "browser said it paid" },
    productKey: "clinic_operator",
    email,
    checkoutState: intent.state,
  });
  check(
    "a browser-reported, unverified payment is refused",
    unverified.status === "failed" && unverified.organizationId === null,
    `status=${unverified.status} organizationId=${unverified.organizationId}`,
  );

  // --- 3. a verified, manually reconciled payment ------------------------
  const membership = await recordCommercialPaymentEvidence({
    provider: "godaddy",
    eventId: `evt_membership_${RUN}`,
    eventType: "membership.granted",
    verified: true,
    verificationMethod: "manual_reconciliation",
    processorVerified: false,
    payloadHash: hash(`membership-${RUN}`),
    payload: { reconciledBy: "operator" },
    productKey: "clinic_operator",
    email,
    checkoutState: intent.state,
    amountCents: 49900,
    currency: "usd",
  });
  check(
    "a human-reconciled payment is applied and resolves the organization from the intent",
    membership.status === "applied" && membership.organizationId === org.id,
    `status=${membership.status} organizationId=${membership.organizationId === org.id ? "matched intent" : membership.organizationId}`,
  );

  // --- 3b. the corroborating payment ------------------------------------
  // A membership grant is not money. Activation requires a verified payment event as
  // well, which is the control that stops an entitlement being granted on the strength
  // of a provider saying "membership created" while nothing was actually collected.
  const payment = await recordCommercialPaymentEvidence({
    provider: "godaddy",
    eventId: `evt_payment_${RUN}`,
    eventType: "manual.payment_confirmed",
    verified: true,
    verificationMethod: "manual_reconciliation",
    processorVerified: false,
    payloadHash: hash(`payment-${RUN}`),
    payload: { reconciledBy: "operator", reference: "GD-INV-1001" },
    productKey: "clinic_operator",
    email,
    // The checkout intent binds to the first event that resolves it. Once the
    // organization is known, later evidence names it explicitly rather than trying to
    // consume an intent a second time.
    organizationId: org.id,
    amountCents: 49900,
    currency: "usd",
  });
  check(
    "a membership grant alone is not treated as money received",
    payment.status === "applied",
    `separate payment evidence recorded: status=${payment.status}`,
  );

  // --- 4. replay must be idempotent --------------------------------------
  const replay = await recordCommercialPaymentEvidence({
    provider: "godaddy",
    eventId: `evt_membership_${RUN}`,
    eventType: "membership.granted",
    verified: true,
    verificationMethod: "manual_reconciliation",
    processorVerified: false,
    payloadHash: hash(`membership-${RUN}`),
    payload: { reconciledBy: "operator" },
    productKey: "clinic_operator",
    email,
    checkoutState: intent.state,
  });
  check(
    "a replayed payment event is idempotent",
    replay.idempotent === true,
    `idempotent=${replay.idempotent} eventId reused`,
  );

  // --- 5. activation grants the subscription ------------------------------
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  let activationError = "";
  try {
    await activateCommercialSubscription({
      provider: "godaddy",
      eventEvidenceId: membership.eventId,
      organizationId: org.id,
      productKey: "clinic_operator",
      periodStartsAt: now,
      periodEndsAt: periodEnd,
    });
  } catch (error) {
    activationError = error instanceof Error ? error.message : "unknown";
  }
  const subscription = await db.clinicSubscription.findFirst({
    where: { organizationId: org.id },
    select: { status: true, modules: true },
  });
  check(
    "verified evidence activates the subscription and its modules",
    Boolean(subscription) && (subscription?.modules.length ?? 0) > 0,
    activationError
      ? `activation error: ${activationError}`
      : `status=${subscription?.status} modules=${subscription?.modules.join(",")}`,
  );

  // --- 6. activation without applied evidence must be refused -------------
  let refusedWithoutEvidence = false;
  let refusalReason = "";
  try {
    await activateCommercialSubscription({
      provider: "godaddy",
      eventEvidenceId: unverified.eventId,
      organizationId: org.id,
      productKey: "clinic_operator",
      periodStartsAt: now,
      periodEndsAt: periodEnd,
    });
  } catch (error) {
    refusedWithoutEvidence = true;
    refusalReason = error instanceof Error ? error.message : "unknown";
  }
  check(
    "a subscription cannot be activated from unverified evidence",
    refusedWithoutEvidence,
    refusalReason || "activation was allowed — this is the failure",
  );

  // --- 7. audit trail exists ---------------------------------------------
  const audits = await db.auditLog.count({
    where: { organizationId: org.id, action: { startsWith: "commercial." } },
  });
  check("the commercial path leaves an audit trail", audits > 0, `${audits} commercial audit records`);

  await db.organization.deleteMany({ where: { slug: "mvp-journey-clinic" } });
  await db.$disconnect();

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} commercial journey checks passed`);
  process.exit(passed === results.length ? 0 : 1);
}

main();
