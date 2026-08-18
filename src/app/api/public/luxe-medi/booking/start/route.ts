import { NextRequest, NextResponse } from "next/server";
import { LUXE_ACQUISITION_JOURNEY_COOKIE, openLuxeAcquisitionJourney } from "@/lib/luxe-acquisition-journey-token";
import { configuredLuxeBookingUrl } from "@/lib/luxe-booking-config";
import { recordLuxeBookingStart } from "@/lib/repositories/luxe-booking-intent-repository";

export async function POST(request: NextRequest) {
  const destination = configuredLuxeBookingUrl();
  if (!destination) {
    return NextResponse.json(
      { error: "Online booking is temporarily unavailable. Luxe Medi staff can still follow up on your request." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const token = request.cookies.get(LUXE_ACQUISITION_JOURNEY_COOKIE)?.value;
  const journey = openLuxeAcquisitionJourney(token);

  if (journey && process.env.DATABASE_URL) {
    try {
      await recordLuxeBookingStart(journey.leadId, destination.hostname);
    } catch {
      // Acquisition analytics must never block a customer from reaching the approved
      // booking rail. The booking provider remains authoritative for booking/payment.
    }
  }

  return NextResponse.redirect(destination, { status: 303, headers: { "Cache-Control": "no-store" } });
}
