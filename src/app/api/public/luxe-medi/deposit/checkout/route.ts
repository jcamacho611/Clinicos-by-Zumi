import { NextRequest, NextResponse } from "next/server";
import {
  LUXE_ACQUISITION_JOURNEY_COOKIE,
  openLuxeAcquisitionJourney,
} from "@/lib/luxe-acquisition-journey-token";
import { createLuxeStripeDepositCheckout, luxeStripeDepositStatus } from "@/lib/luxe-stripe-deposit";
import { resolveLuxeDepositCheckoutContext } from "@/lib/repositories/luxe-processor-payment-evidence-repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const status = luxeStripeDepositStatus();
  if (!status.publicCheckoutAvailable) {
    return NextResponse.json(
      { error: "Online Luxe deposit checkout is not available." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const journeyToken = request.cookies.get(LUXE_ACQUISITION_JOURNEY_COOKIE)?.value ?? null;
  const journey = openLuxeAcquisitionJourney(journeyToken);
  if (!journey || !journeyToken) {
    return NextResponse.json(
      { error: "Start with a Luxe consultation request before opening deposit checkout." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  const context = await resolveLuxeDepositCheckoutContext(journey.leadId);
  if (!context) {
    return NextResponse.json(
      { error: "This Luxe request is not eligible for a new deposit checkout." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const returnUrl = new URL("/luxe/consult?deposit=returned", request.url).toString();
    const checkout = await createLuxeStripeDepositCheckout({
      journeyToken,
      email: context.email,
      returnUrl,
    });
    const response = NextResponse.redirect(checkout.checkoutUrl, 303);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json(
      { error: "Secure deposit checkout could not be created." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
