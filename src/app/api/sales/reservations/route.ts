import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { checkSalesIntakeRateLimit, recordSalesIntakeAttempt } from "@/lib/auth/rate-limit";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { getClinicSession } from "@/lib/auth/session";
import { sealActivationReference } from "@/lib/commercial/analysis-activation-token";
import { createPreferredCommercialCheckout } from "@/lib/commercial/checkout-service";
import { db } from "@/lib/db";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { createPublicDemoReservation, listSalesDemoWorkspace } from "@/lib/repositories/sales-demo-repository";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "sales", "read", { request });
  if (denied) return denied;
  try {
    return NextResponse.json({ data: await listSalesDemoWorkspace(session) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Demo reservations require PostgreSQL. The manual contact fallback remains available." }, { status: 503 });
  }
  const metadata = requestMetadata(request);
  const key = metadata.ipAddress ?? "unknown";
  const limit = checkSalesIntakeRateLimit(key);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many demo requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds), "Cache-Control": "no-store" } },
    );
  }
  recordSalesIntakeAttempt(key);

  try {
    const result = await createPublicDemoReservation(await request.json().catch(() => null), metadata);
    // The signed activation reference travels two ways on purpose. Stripe and Whop carry
    // it back as a return URL, but the GoDaddy manual rail is a fixed payment link that
    // carries nothing — so on the rail currently in use the buyer would never receive it.
    // Returning it here means the activation step is reachable regardless of rail, and
    // whether or not checkout is ever completed.
    const activationToken = sealActivationReference(result.reservation.id);
    const activationPath = activationToken
      ? `/payments/success?activation=${encodeURIComponent(activationToken)}`
      : null;
    let checkout: Awaited<ReturnType<typeof createPreferredCommercialCheckout>> | null = null;
    let checkoutNotice = "Your request is saved for human review before payment.";

    // The $500 Clinic Operating Analysis has one server-owned amount. Stripe is used
    // only when both live Checkout and signed-webhook verification are configured;
    // otherwise the existing GoDaddy/manual-reconciliation rail remains available.
    if (result.reservation.selectedOffer === "private_workflow_demo") {
      try {
        checkout = await createPreferredCommercialCheckout({
          organizationId: result.reservation.salesOwnerOrganizationId,
          email: result.reservation.contactEmail,
          productKey: "operational_audit",
          expectedAmountCents: result.reservation.priceCents,
          // Signed, not raw. A return URL travels through history, referrers and shared
          // links; the reservation id alone would let anyone holding one read or write
          // that engagement. When no signing secret is configured this is null and the
          // return page falls back to its generic truthful state.
          returnUrl: new URL(activationPath ?? "/payments/success", request.url).toString(),
        });
        await db.$transaction([
          db.demoReservation.update({
            where: { id: result.reservation.id },
            data: { paymentStatus: "payment_pending" },
          }),
          db.demoReservationEvent.create({
            data: {
              salesOwnerOrganizationId: result.reservation.salesOwnerOrganizationId,
              reservationId: result.reservation.id,
              actorType: "system",
              eventType: "checkout_ready",
              toStatus: result.reservation.status,
              note: "Klinikos created a server-owned checkout intent before exposing the configured payment page.",
              metadata: {
                checkoutIntentId: checkout.intentId,
                provider: checkout.provider,
                expectedAmountCents: checkout.expectedAmountCents,
              },
            },
          }),
        ]);
        checkoutNotice = checkout.provider === "stripe"
          ? "Your $500 analysis is reserved. Continue to secure Stripe Checkout; payment is recognized only after Klinikos verifies Stripe's signed server event."
          : "Your $500 analysis is reserved. Continue to the secure GoDaddy payment page; payment is recognized only after authorized reconciliation.";
      } catch {
        await db.$transaction([
          db.demoReservation.update({
            where: { id: result.reservation.id },
            data: { paymentStatus: "manual_link_required" },
          }),
          db.demoReservationEvent.create({
            data: {
              salesOwnerOrganizationId: result.reservation.salesOwnerOrganizationId,
              reservationId: result.reservation.id,
              actorType: "system",
              eventType: "checkout_unavailable",
              toStatus: result.reservation.status,
              note: "The configured payment rail was unavailable after the inquiry was safely saved. Human follow-up is required.",
              metadata: { selectedOffer: result.reservation.selectedOffer },
            },
          }),
        ]).catch(() => undefined);
        checkoutNotice = "Your request is safely saved, but the payment page is temporarily unavailable. Our team can continue it without making you start over.";
      }
    } else {
      checkoutNotice = result.reservation.selectedOffer === "founding_clinic_program"
        ? "Implementation pricing starts at the displayed amount and is confirmed after scope review. Klinikos will not send you to a payment page for the wrong amount."
        : "This fixed-price next step is saved for review. It will open an exact-value checkout only when the matching payment link is configured.";
    }

    return NextResponse.json(
      { data: { ...result, checkout, checkoutNotice, activationPath } },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
