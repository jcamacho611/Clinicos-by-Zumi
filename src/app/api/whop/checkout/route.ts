import { NextResponse } from "next/server";
import { checkPaidEntryRateLimit, recordPaidEntryAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { getAccessTier } from "@/lib/commerce/whop-catalog";
import { buildWhopCheckoutUrl, planIdForTier, whopAdapterStatus } from "@/lib/commerce/whop-client";
import { createCheckoutIntent, hasVerifiedAccessEmail } from "@/lib/commerce/whop-entitlements";
import { checkoutIntentSchema } from "@/lib/commerce/whop-rules";

/**
 * Start a paid Klinikos entry.
 *
 * The buyer must already have accepted the access terms and verified their work
 * email, so a purchase is always tied to a confirmed address. The response only
 * hands back a checkout URL: no entitlement exists until Whop confirms the purchase
 * through the webhook or the server-side return verification.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Paid entry is unavailable." }, { status: 503 });

  const metadata = requestMetadata(request);
  const rateKey = metadata.ipAddress ?? "unknown";
  const limit = checkPaidEntryRateLimit(rateKey);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many checkout attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }
  recordPaidEntryAttempt(rateKey);

  const parsed = checkoutIntentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Select an access pass, supply a verified work email, and accept the terms." }, { status: 400 });
  }

  const adapter = whopAdapterStatus();
  if (!adapter.configured) {
    // Truthful boundary: without configured Whop credentials there is no checkout to
    // send anyone to, and we do not pretend otherwise.
    return NextResponse.json(
      { error: "Paid entry is Pending Connection. Whop credentials are not configured for this deployment.", adapter },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const tier = getAccessTier(parsed.data.tierKey);
  if (!tier) return NextResponse.json({ error: "Unknown access pass." }, { status: 400 });
  if (!planIdForTier(tier)) {
    return NextResponse.json({ error: `${tier.name} is not currently available for purchase.` }, { status: 409 });
  }

  const verified = await hasVerifiedAccessEmail(parsed.data.email);
  if (!verified) {
    return NextResponse.json(
      { error: "Verify your work email through the access gate before purchasing.", verificationUrl: "/access" },
      { status: 409 },
    );
  }

  const intent = await createCheckoutIntent({
    email: parsed.data.email,
    tier,
    ipAddress: metadata.ipAddress ?? null,
    userAgent: metadata.userAgent ?? null,
  });
  if (!intent.ok) return NextResponse.json({ error: "That access pass is not currently available." }, { status: 409 });

  return NextResponse.json(
    {
      ok: true,
      tierKey: tier.key,
      checkoutUrl: buildWhopCheckoutUrl(intent.planId, intent.intent.state),
      expiresAt: intent.intent.expiresAt.toISOString(),
      postPurchaseReview: tier.postPurchaseReview,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
