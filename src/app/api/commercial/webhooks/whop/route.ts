import { NextResponse } from "next/server";
import { applyNormalizedCommercialWebhook } from "@/lib/commercial/payment-evidence-repository";
import { normalizeWhopWebhook } from "@/lib/commercial/payment-connectors/whop";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

export async function POST(request: Request) {
  const rawBody = await request.text();
  const normalized = normalizeWhopWebhook({
    rawBody,
    webhookId: request.headers.get("webhook-id"),
    webhookTimestamp: request.headers.get("webhook-timestamp"),
    webhookSignature: request.headers.get("webhook-signature"),
  });

  if (!normalized.ok) {
    // Unsupported but correctly signed events should not create retry storms. Signature,
    // freshness, and payload failures remain non-2xx because they are not accepted.
    if (normalized.reason === "unsupported_event") {
      return NextResponse.json({ received: true, applied: false }, { status: 200, headers: NO_STORE });
    }
    return NextResponse.json({ error: "Webhook verification failed." }, { status: 400, headers: NO_STORE });
  }

  try {
    const applied = await applyNormalizedCommercialWebhook(normalized.event);
    return NextResponse.json(
      { received: true, applied: applied.status === "applied", idempotent: applied.idempotent },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    console.error("[commercial] Whop webhook processing failed", error instanceof Error ? error.message : "unknown error");
    // Whop retries non-2xx deliveries, so database/processing failures intentionally
    // return 503 while the raw payload itself is never logged.
    return NextResponse.json({ error: "Webhook processing unavailable." }, { status: 503, headers: NO_STORE });
  }
}
