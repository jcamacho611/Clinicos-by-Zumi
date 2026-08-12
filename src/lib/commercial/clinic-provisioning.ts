import "server-only";

import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { can } from "@/lib/auth/rbac";
import { getAuthSecret } from "@/lib/auth/config";
import type { ClinicSession } from "@/lib/auth/types";
import { goDaddyPaymentConnector } from "@/lib/commercial/payment-connectors/godaddy";
import { activateCommercialSubscription, recordCommercialPaymentEvidence } from "@/lib/commercial/payment-evidence-repository";
import { getCommercialProduct } from "@/lib/commercial/product-catalog";
import { clinicCheckoutRequestSchema, type ClinicActivationInput, type ClinicPurchasablePlanKey } from "@/lib/commercial/clinic-activation-rules";
import { slugifyOrganizationName } from "@/lib/onboarding-rules";
import { completeProvisionedOrganizationWorkspace } from "@/lib/repositories/onboarding-repository";

const CHECKOUT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ACTIVATION_TTL_SECONDS = 7 * 24 * 60 * 60;

export class ClinicProvisioningError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

type CheckoutRow = {
  id: string;
  state: string;
  provider: string;
  productKey: string;
  email: string;
  organizationId: string | null;
  status: string;
  amountCents: number | null;
  currency: string;
  expiresAt: Date;
  completedAt: Date | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
};

type ActivationTokenPayload = {
  v: 1;
  organizationId: string;
  checkoutIntentId: string;
  email: string;
  productKey: ClinicPurchasablePlanKey;
  exp: number;
};

function requireSales(session: ClinicSession, action: "read" | "create" | "update") {
  if (!can(session.role, "sales", action)) throw new ClinicProvisioningError("Commercial activation access is not permitted for this role.", 403);
}

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://klinikos.io").replace(/\/$/, "");
}

async function uniqueSlug(tx: Prisma.TransactionClient, clinicName: string) {
  const base = slugifyOrganizationName(clinicName);
  const existing = await tx.organization.findUnique({ where: { slug: base }, select: { id: true } });
  return existing ? `${base}-${randomUUID().slice(0, 6)}` : base;
}

function signActivationPayload(payload: ActivationTokenPayload) {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = createHmac("sha256", getAuthSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyClinicActivationToken(token: string): ActivationTokenPayload {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) throw new ClinicProvisioningError("This activation link is invalid.", 400);
  const expected = createHmac("sha256", getAuthSecret()).update(encoded).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "base64url");
  } catch {
    throw new ClinicProvisioningError("This activation link is invalid.", 400);
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) throw new ClinicProvisioningError("This activation link is invalid.", 400);

  let payload: ActivationTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ActivationTokenPayload;
  } catch {
    throw new ClinicProvisioningError("This activation link is invalid.", 400);
  }
  if (payload.v !== 1 || !payload.organizationId || !payload.checkoutIntentId || !payload.email || !payload.productKey) throw new ClinicProvisioningError("This activation link is invalid.", 400);
  if (!Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) throw new ClinicProvisioningError("This activation link has expired. Ask Klinikos to issue a new one.", 410);
  const product = getCommercialProduct(payload.productKey);
  if (!product || !product.publicPurchasable || product.audience !== "clinic") throw new ClinicProvisioningError("This activation link references an unavailable clinic plan.", 400);
  return payload;
}

export async function createClinicPlanCheckout(session: ClinicSession, rawInput: unknown) {
  requireSales(session, "create");
  const input = clinicCheckoutRequestSchema.parse(rawInput);
  const product = getCommercialProduct(input.productKey);
  if (!product || !product.publicPurchasable || product.audience !== "clinic" || product.priceCents === null) throw new ClinicProvisioningError("This clinic plan is not available for checkout.", 400);

  const id = randomUUID();
  const state = randomUUID().replaceAll("-", "");
  const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MS);
  await db.$executeRaw(Prisma.sql`
    INSERT INTO "commercial_checkout_intents" (
      "id", "state", "provider", "productKey", "email", "organizationId", "status",
      "amountCents", "currency", "expiresAt", "metadata"
    ) VALUES (
      ${id}, ${state}, 'godaddy', ${product.key}, ${input.email}, NULL, 'created',
      ${product.priceCents}, 'USD', ${expiresAt}, ${JSON.stringify({ clinicName: input.clinicName, createdBy: session.userId, source: "clinic_activation_desk" })}::jsonb
    )
  `);

  try {
    const checkout = await goDaddyPaymentConnector.createCheckout?.({
      product,
      organizationId: session.organizationId,
      email: input.email,
      state,
      returnUrl: `${normalizeBaseUrl()}/payments/success?state=${encodeURIComponent(state)}`,
    });
    if (!checkout) throw new Error("GoDaddy checkout is not available.");
    await db.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "commercial.clinic_plan_checkout_created",
        resourceType: "commercial_checkout_intent",
        resourceId: id,
        metadata: { productKey: product.key, clinicName: input.clinicName, buyerEmail: input.email, expectedAmountCents: product.priceCents, processorVerificationAvailable: checkout.processorVerificationAvailable },
      },
    });
    return { id, state, productKey: product.key, productLabel: product.label, expectedAmountCents: product.priceCents, checkoutUrl: checkout.checkoutUrl, expiresAt: expiresAt.toISOString(), processorVerificationAvailable: false };
  } catch (error) {
    await db.$executeRaw(Prisma.sql`UPDATE "commercial_checkout_intents" SET "status" = 'abandoned', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${id} AND "status" = 'created'`).catch(() => undefined);
    throw error;
  }
}

export async function listClinicPlanCheckouts(session: ClinicSession) {
  requireSales(session, "read");
  const rows = await db.$queryRaw<CheckoutRow[]>(Prisma.sql`
    SELECT "id", "state", "provider", "productKey", "email", "organizationId", "status", "amountCents", "currency", "expiresAt", "completedAt", "metadata", "createdAt"
    FROM "commercial_checkout_intents"
    WHERE "productKey" IN ('clinic_core', 'clinic_growth', 'clinic_scale')
    ORDER BY "createdAt" DESC
    LIMIT 100
  `);
  return rows.map((row) => {
    const metadata = asRecord(row.metadata);
    const product = getCommercialProduct(row.productKey);
    return {
      id: row.id,
      state: row.state,
      provider: row.provider,
      productKey: row.productKey,
      productLabel: product?.label ?? row.productKey,
      clinicName: typeof metadata.clinicName === "string" ? metadata.clinicName : "Clinic",
      email: row.email,
      organizationId: row.organizationId,
      status: row.status,
      expectedAmountCents: row.amountCents,
      currency: row.currency,
      expiresAt: row.expiresAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

async function attachOrganizationShell(session: ClinicSession, intentId: string) {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<CheckoutRow[]>(Prisma.sql`
      SELECT "id", "state", "provider", "productKey", "email", "organizationId", "status", "amountCents", "currency", "expiresAt", "completedAt", "metadata", "createdAt"
      FROM "commercial_checkout_intents"
      WHERE "id" = ${intentId}
      FOR UPDATE
    `);
    const intent = rows[0];
    if (!intent) throw new ClinicProvisioningError("Clinic checkout intent was not found.", 404);
    if (intent.provider !== "godaddy") throw new ClinicProvisioningError("This payment requires its configured processor-specific verification path.", 409);
    if (!["created", "completed"].includes(intent.status)) throw new ClinicProvisioningError("This checkout cannot be reconciled in its current state.", 409);
    const product = getCommercialProduct(intent.productKey);
    if (!product || !product.publicPurchasable || product.audience !== "clinic" || product.priceCents === null) throw new ClinicProvisioningError("This checkout does not reference an active clinic plan.", 409);
    if (intent.amountCents !== product.priceCents) throw new ClinicProvisioningError("The stored checkout amount no longer matches the server-owned clinic plan price. Review it manually before proceeding.", 409);

    if (intent.organizationId) return { intent, organizationId: intent.organizationId, product };
    const metadata = asRecord(intent.metadata);
    const clinicName = typeof metadata.clinicName === "string" && metadata.clinicName.trim() ? metadata.clinicName.trim() : "Klinikos Clinic";
    const organizationId = randomUUID();
    const slug = await uniqueSlug(tx, clinicName);
    await tx.organization.create({ data: { id: organizationId, name: clinicName, slug, clinicType: "Pending onboarding", status: "active", demoMode: false } });
    await tx.$executeRaw(Prisma.sql`UPDATE "commercial_checkout_intents" SET "organizationId" = ${organizationId}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${intent.id}`);
    await tx.auditLog.create({ data: { organizationId, actorId: session.userId, actorType: "user", action: "commercial.provisioning_shell_created", resourceType: "organization", resourceId: organizationId, metadata: { checkoutIntentId: intent.id, productKey: product.key, buyerEmail: intent.email, createdByOrganizationId: session.organizationId } } });
    return { intent: { ...intent, organizationId }, organizationId, product };
  });
}

export async function reconcileClinicPlanCheckout(session: ClinicSession, intentId: string) {
  requireSales(session, "update");
  const prepared = await attachOrganizationShell(session, intentId);
  const { intent, organizationId, product } = prepared;
  const eventId = `manual:${intent.id}`;
  const payloadHash = createHash("sha256").update(`${intent.id}:${organizationId}:${product.key}:${intent.amountCents}:${intent.email}`).digest("hex");

  const evidence = await recordCommercialPaymentEvidence({
    provider: "godaddy",
    eventId,
    eventType: "manual.payment_confirmed",
    verified: true,
    verificationMethod: "manual_reconciliation",
    processorVerified: false,
    payloadHash,
    payload: { checkoutIntentId: intent.id, reconciledByUserId: session.userId, reconciledByOrganizationId: session.organizationId, expectedAmountCents: intent.amountCents, note: "Authorized Klinikos operator confirmed the payment against the checkout intent. GoDaddy processor verification is not connected." },
    productKey: product.key,
    email: intent.email,
    checkoutState: intent.state,
    organizationId,
    amountCents: intent.amountCents,
    currency: intent.currency,
  });
  if (evidence.status !== "applied") throw new ClinicProvisioningError("Payment evidence could not be applied to the clinic organization.", 409);

  const completionRows = await db.$queryRaw<Array<{ completedAt: Date | null }>>(Prisma.sql`SELECT "completedAt" FROM "commercial_checkout_intents" WHERE "id" = ${intent.id}`);
  const periodStartsAt = completionRows[0]?.completedAt ?? new Date();
  const periodEndsAt = new Date(periodStartsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  await activateCommercialSubscription({ provider: "godaddy", eventEvidenceId: evidence.eventId, organizationId, productKey: product.key as ClinicPurchasablePlanKey, periodStartsAt, periodEndsAt });

  const payload: ActivationTokenPayload = { v: 1, organizationId, checkoutIntentId: intent.id, email: intent.email, productKey: product.key as ClinicPurchasablePlanKey, exp: Math.floor(Date.now() / 1000) + ACTIVATION_TTL_SECONDS };
  const token = signActivationPayload(payload);
  const activationUrl = `${normalizeBaseUrl()}/activate?token=${encodeURIComponent(token)}`;
  await db.auditLog.create({ data: { organizationId, actorId: session.userId, actorType: "user", action: "commercial.manual_payment_reconciled", resourceType: "commercial_checkout_intent", resourceId: intent.id, metadata: { productKey: product.key, expectedAmountCents: intent.amountCents, paymentEvidenceId: evidence.eventId, activationLinkIssued: true, processorVerified: false } } });
  return { organizationId, productKey: product.key, productLabel: product.label, paymentEvidenceId: evidence.eventId, periodStartsAt: periodStartsAt.toISOString(), periodEndsAt: periodEndsAt.toISOString(), activationUrl };
}

export async function getClinicActivationPreview(token: string) {
  const payload = verifyClinicActivationToken(token);
  const organization = await db.organization.findUnique({ where: { id: payload.organizationId }, select: { id: true, name: true, slug: true, status: true } });
  if (!organization || organization.status !== "active") throw new ClinicProvisioningError("This activation is no longer available.", 404);
  const rows = await db.$queryRaw<Array<{ planKey: string; status: string; currentPeriodEndsAt: Date | null; paymentConfirmedAt: Date | null }>>(Prisma.sql`
    SELECT "planKey", "status", "currentPeriodEndsAt", "paymentConfirmedAt"
    FROM "subscriptions"
    WHERE "organizationId" = ${organization.id}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `);
  const subscription = rows[0];
  if (!subscription || subscription.status !== "active" || !subscription.paymentConfirmedAt || (subscription.currentPeriodEndsAt && subscription.currentPeriodEndsAt <= new Date())) throw new ClinicProvisioningError("Paid Klinikos access is not active for this activation link.", 409);
  const existingUser = await db.user.findUnique({ where: { email: payload.email }, select: { id: true, organizationId: true, status: true } });
  return { organizationName: organization.name, email: payload.email, productKey: payload.productKey, productLabel: getCommercialProduct(payload.productKey)?.label ?? payload.productKey, currentPeriodEndsAt: subscription.currentPeriodEndsAt?.toISOString() ?? null, alreadyActivated: Boolean(existingUser?.organizationId === organization.id && existingUser.status === "active") };
}

export async function completeClinicActivation(rawInput: ClinicActivationInput, metadata: { ipAddress?: string; userAgent?: string }) {
  const payload = verifyClinicActivationToken(rawInput.token);
  const preview = await getClinicActivationPreview(rawInput.token);
  if (preview.alreadyActivated) throw new ClinicProvisioningError("This clinic is already activated. Sign in instead.", 409);
  return completeProvisionedOrganizationWorkspace({
    organizationId: payload.organizationId,
    email: payload.email,
    ownerName: rawInput.ownerName,
    password: rawInput.password,
    clinicType: rawInput.clinicType,
    locationName: rawInput.locationName,
    city: rawInput.city,
    state: rawInput.state,
    timezone: rawInput.timezone,
    teamSize: rawInput.teamSize,
    primaryGoal: rawInput.primaryGoal,
    currentSystems: rawInput.currentSystems,
    migrationExpectation: rawInput.migrationExpectation,
    communicationsState: rawInput.communicationsState,
  }, metadata);
}
