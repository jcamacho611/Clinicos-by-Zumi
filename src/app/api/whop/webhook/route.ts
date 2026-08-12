import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { applyWebhookToAccessPayment } from "@/lib/commerce/access-payment-service";
import { whopWebhookSecret } from "@/lib/commerce/whop-client";
import {
  applyWebhookToEntitlement,
  markWebhookIncomplete,
  markWebhookProcessed,
  payloadHash,
  recordWebhookDelivery,
} from "@/lib/commerce/whop-entitlements";
import {
  verifyStandardWebhookSignature,
  verifyWhopSignature,
  whopEventAmountMinorUnits,
  whopEventIsReversal,
  whopOriginalPaymentReference,
  whopWebhookEnvelopeSchema,
} from "@/lib/commerce/whop-rules";
import { deliverActivation, provisionFromPayment, revokeProvisionedAccess } from "@/lib/provisioning/provisioning-service";

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

  // Whop signs with Standard Webhooks headers. The legacy `x-whop-signature` path is
  // kept because a deployment may still be configured for it, but the modern scheme is
  // tried first — reading only the legacy header rejected every genuine delivery.
  const standardHeaders = {
    webhookId: request.headers.get("webhook-id"),
    webhookTimestamp: request.headers.get("webhook-timestamp"),
    webhookSignature: request.headers.get("webhook-signature"),
  };

  const verification = standardHeaders.webhookSignature
    ? verifyStandardWebhookSignature({ rawBody, ...standardHeaders, secret })
    : verifyWhopSignature({
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
  // Prefer the provider's own delivery id — it is what a redelivery repeats, which is
  // exactly what idempotency has to key on.
  const eventId =
    standardHeaders.webhookId?.trim() ||
    envelope.id?.trim() ||
    `${eventType}_${crypto.createHash("sha256").update(rawBody).digest("hex").slice(0, 48)}`;

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
      // On a reversal, `data.id` is the refund or dispute object — not the payment being
      // reversed. Passing it as the payment reference meant the lookup missed and the
      // buyer's settled row was never refunded, so their portal access survived the
      // money going back. There is deliberately no fallback to `data.id` here: a
      // reversal that cannot name its payment is unfinished work, not a match.
      const reversal = whopEventIsReversal(eventType);
      const paymentReference = reversal
        ? whopOriginalPaymentReference(envelope.data ?? {})
        : membershipId ?? envelope.id?.trim() ?? null;

      // The envelope carries what was actually bought. Passing only the reference and
      // email is what let an unrelated purchase settle an open invoice.
      const settled = await applyWebhookToAccessPayment({
        externalPaymentReference: paymentReference,
        buyerEmail: envelope.data?.email ?? null,
        outcome: paymentOutcome,
        amountMinorUnits: whopEventAmountMinorUnits(envelope.data ?? {}),
        providerProductId: envelope.data?.product_id ?? null,
      });
      if (settled.applied) {
        // A settled payment whose access could not be built is not a finished delivery.
        // Leaving it non-terminal means the provider's next redelivery re-attempts the
        // provisioning, which is idempotent, rather than the buyer paying for a
        // workspace that was never created.
        if (!settled.provisioning.ok) {
          await markWebhookIncomplete(delivery.id, settled.provisioning.reason);
          return noStore({ ok: false, applied: true, scope: "access_payment", status: settled.status, reason: settled.provisioning.reason, retry: true }, 500);
        }
        return noStore({ ok: true, applied: true, scope: "access_payment", status: settled.status }, 200);
      }

      // A reversal that found nothing must not fall through to membership handling,
      // where it would be answered 202 and forgotten. Money went back and access may
      // still be granted, so the delivery stays non-terminal with a stated reason: a
      // redelivery re-attempts it, and an operator can see the ones that never match.
      if (reversal) {
        await markWebhookIncomplete(delivery.id, `reversal_unmatched:${settled.reason}`);
        return noStore({ ok: false, applied: false, scope: "access_payment", reason: settled.reason, retry: true }, 500);
      }
    }

    const result = await applyWebhookToEntitlement({ envelope, eventType, webhookRecordId: delivery.id });
    if (!result.applied) return noStore({ ok: true, applied: false, reason: result.reason }, 202);

    // Provisioning runs in both directions. A membership that went invalid has to
    // withdraw the subscription it created, or the buyer keeps every paid capability
    // after cancelling — the entitlement row says revoked while the subscription the
    // capabilities are actually read from says active.
    if ((result.state === "revoked" || result.state === "grace") && membershipId) {
      await revokeProvisionedAccess({ source: "whop_membership", reference: membershipId, state: result.state }).catch(() => null);
      await markWebhookProcessed(delivery.id);
      return noStore({ ok: true, applied: true, scope: "entitlement", state: result.state, tierKey: result.tierKey, provisioning: { status: "revoked" } }, 200);
    }

    // Provisioning is part of the delivery, not a best-effort afterthought. An
    // entitlement applied while provisioning failed leaves a paying buyer with no
    // organization, and answering 200 there would tell Whop the work is finished and
    // stop the only retry that could repair it. Both halves are independently
    // idempotent, so a retry re-runs them safely rather than duplicating either.
    if (result.state === "active" && membershipId && envelope.data?.email) {
      const provisioning = await provisionFromPayment({
        source: "whop_membership",
        reference: membershipId,
        email: envelope.data.email,
        tierKey: result.tierKey ?? undefined,
      }).catch(() => null);

      // `contended` means another worker held the run's claim, so this delivery learned
      // nothing about the outcome. Treated like a failure — retry — because acknowledging
      // it would mark the delivery terminal on the strength of work we did not observe.
      if (!provisioning || provisioning.status === "failed" || provisioning.status === "contended") {
        const reason = !provisioning ? "provisioning_threw" : provisioning.status === "contended" ? "provisioning_contended" : "provisioning_failed";
        await markWebhookIncomplete(delivery.id, reason);
        return noStore({ error: "Provisioning did not complete.", retry: true }, 500);
      }

      // The buyer cannot sign in until this reaches them, so an undelivered activation
      // is not a finished delivery. Leaving it non-terminal means the provider's next
      // redelivery re-attempts the send — `provisionFromPayment` re-mints the token for
      // an account that still has no credential, so the retry is meaningful rather than
      // a no-op. An operator can also reissue it from the recorded failure.
      if (provisioning.activation && provisioning.organizationId) {
        const delivered = await deliverActivation({
          email: envelope.data.email,
          token: provisioning.activation.token,
          provisioningKey: provisioning.provisioningKey,
        }).catch(() => null);

        if (!delivered?.ok) {
          await markWebhookIncomplete(delivery.id, "activation_undelivered");
          return noStore(
            {
              ok: false,
              error: "Provisioned, but the activation link could not be delivered.",
              retry: true,
              provisioning: { status: provisioning.status, activationIssued: true, activationDelivered: false },
            },
            500,
          );
        }
      }

      await markWebhookProcessed(delivery.id);
      return noStore(
        {
          ok: true,
          applied: true,
          scope: "entitlement",
          state: result.state,
          tierKey: result.tierKey,
          provisioning: { status: provisioning.status, activationIssued: Boolean(provisioning.activation) },
        },
        200,
      );
    }

    await markWebhookProcessed(delivery.id);
    return noStore(
      { ok: true, applied: true, scope: "entitlement", state: result.state, tierKey: result.tierKey, provisioning: null },
      200,
    );
  } catch {
    await markWebhookIncomplete(delivery.id, "processing_error").catch(() => undefined);
    return noStore({ error: "Entitlement update failed." }, 500);
  }
}
