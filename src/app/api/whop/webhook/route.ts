import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { applyWebhookToAccessPayment } from "@/lib/commerce/access-payment-service";
import { whopWebhookSecret } from "@/lib/commerce/whop-client";
import { applyWebhookToEntitlement, payloadHash, recordWebhookDelivery } from "@/lib/commerce/whop-entitlements";
import { verifyWhopSignature, whopWebhookEnvelopeSchema } from "@/lib/commerce/whop-rules";
import { provisionFromPayment } from "@/lib/provisioning/provisioning-service";

const paymentOutcomes: Record<string, "paid" | "refunded" | "failed"> = {
  "payment.succeeded": "paid",
  "payment.failed": "failed",
  "refund.created": "refunded",
  "dispute.created": "refunded",
};

export const dynamic = "force-dynamic";

function noStore(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return noStore({ error: "Entitlement storage is unavailable." }, 503);

  const secret = whopWebhookSecret();
  if (!secret) return noStore({ error: "Webhook verification is not configured." }, 503);

  const rawBody = await request.text();
  if (rawBody.length > 512_000) return noStore({ error: "Payload too large." }, 413);

  const verification = verifyWhopSignature({
    rawBody,
    header: request.headers.get("x-whop-signature"),
    secret,
    allowUntimestamped: process.env.WHOP_WEBHOOK_ALLOW_UNTIMESTAMPED === "true",
  });

  if (!verification.ok) {
    await recordWebhookDelivery({
      eventId: `unverified_${payloadHash(rawBody).slice(0, 32)}_${Date.now()}`,
      eventType: "signature.rejected",
      membershipId: null,
      signatureVerified: false,
      rawBody,
      payload: null,
      processingStatus: "rejected",
      failureReason: verification.reason,
    }).catch(() => undefined);
    return noStore({ error: "Signature verification failed." }, 401);
  }

  const parsed = whopWebhookEnvelopeSchema.safeParse(JSON.parse(rawBody || "null"));
  if (!parsed.success) return noStore({ error: "Unrecognised webhook payload." }, 400);

  const envelope = parsed.data;
  const eventType = envelope.action ?? envelope.event ?? "unknown";
  const membershipId = envelope.data?.id?.trim() || null;
  const eventId = envelope.id?.trim() || `${eventType}_${crypto.createHash("sha256").update(rawBody).digest("hex").slice(0, 48)}`;

  const delivery = await recordWebhookDelivery({
    eventId,
    eventType,
    membershipId,
    signatureVerified: true,
    rawBody,
    payload: envelope,
    processingStatus: "received",
  });

  if (delivery.duplicate && !delivery.retryable) return noStore({ ok: true, duplicate: true }, 200);

  try {
    const paymentOutcome = paymentOutcomes[eventType];
    if (paymentOutcome) {
      const settled = await applyWebhookToAccessPayment({
        externalPaymentReference: membershipId ?? envelope.id?.trim() ?? null,
        buyerEmail: envelope.data?.email ?? null,
        outcome: paymentOutcome,
      });
      if (settled.applied) {
        return noStore({ ok: true, applied: true, scope: "access_payment", status: settled.status }, 200);
      }
    }

    const result = await applyWebhookToEntitlement({ envelope, eventType, webhookRecordId: delivery.id });
    if (!result.applied) return noStore({ ok: true, applied: false, reason: result.reason }, 202);

    let provisioning: { status: string; organizationId: string | null } | null = null;
    if (result.state === "active" && membershipId && envelope.data?.email) {
      provisioning = await provisionFromPayment({
        source: "whop_membership",
        reference: membershipId,
        email: envelope.data.email,
        tierKey: result.tierKey ?? undefined,
      }).catch(() => null);
    }

    return noStore(
      {
        ok: true,
        applied: true,
        scope: "entitlement",
        state: result.state,
        tierKey: result.tierKey,
        provisioning: provisioning ? { status: provisioning.status } : null,
      },
      200,
    );
  } catch {
    return noStore({ error: "Entitlement update failed." }, 500);
  }
}
