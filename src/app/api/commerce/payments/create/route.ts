import { NextResponse } from "next/server";
import { checkPaidEntryRateLimit, recordPaidEntryAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { createAccessPaymentSchema } from "@/lib/commerce/access-payment-rules";
import { createAccessPayment } from "@/lib/commerce/access-payment-service";
import { getAccessProduct } from "@/lib/commerce/access-product-catalog";

/**
 * Start a marketplace access purchase.
 *
 * Namespaced under /api/commerce to keep it clearly separate from /api/payments,
 * which is patient billing inside a tenant.
 *
 * The request may name a product; it may not name a price. The amount is read from
 * the server catalog, so a buyer cannot set their own.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Purchasing is unavailable." }, { status: 503 });

  const metadata = requestMetadata(request);
  const rateKey = metadata.ipAddress ?? "unknown";
  const limit = checkPaidEntryRateLimit(rateKey);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many checkout attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }
  recordPaidEntryAttempt(rateKey);

  const parsed = createAccessPaymentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Select a product, supply a valid email, and accept the terms." }, { status: 400 });
  }

  const product = getAccessProduct(parsed.data.productKey);
  if (!product) return NextResponse.json({ error: "Unknown product." }, { status: 400 });

  const result = await createAccessPayment({
    productKey: parsed.data.productKey,
    buyerEmail: parsed.data.buyerEmail,
    note: parsed.data.note ?? null,
  });

  if (!result.ok) {
    if (result.reason === "not_purchasable") {
      return NextResponse.json(
        { error: `${product.name} is Pending Connection. No checkout link is configured for it in this deployment.` },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ error: "Unknown product." }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: true,
      checkoutUrl: result.checkoutUrl,
      paymentId: result.payment.id,
      amountCents: result.payment.amountCents,
      currency: result.payment.currency,
      requiresHumanReview: result.product.requiresHumanReview,
      doesNotInclude: [...result.product.doesNotInclude],
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
