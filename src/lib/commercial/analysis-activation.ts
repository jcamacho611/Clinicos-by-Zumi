import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { openActivationReference } from "@/lib/commercial/analysis-activation-token";
import { salesQualificationSchema, type SalesQualification } from "@/lib/sales-demo-rules";

/**
 * What a buyer sees after checkout, and what they can do next.
 *
 * Two rules shape this file.
 *
 * First: a browser return is not payment. The person arriving here may have completed
 * checkout, abandoned it, or pressed back — the URL cannot tell us, and neither can they.
 * So payment state is read from the reservation the server owns, and the only status this
 * surface will ever call verified is one an authorized human or signed processor evidence
 * already recorded. `paymentVerified` is derived from stored state, never from arrival.
 *
 * Second: the activation step has to be worth stopping for. Landing a paying customer on
 * a generic thank-you and leaving them to work out what happens next is where the loop
 * used to end. This returns the real state, accepts the qualification that was
 * deliberately removed from the pre-payment form, and records the next action so the
 * engagement has an owner rather than an assumption.
 */

/** Statuses that mean money is actually recorded against this engagement. */
const VERIFIED_PAYMENT_STATUSES = new Set(["payment_recorded", "waived", "credited_forward"]);

export type ActivationView =
  | { state: "unknown_reference"; reason: string }
  | {
      state: "found";
      reservationId: string;
      clinicName: string;
      contactName: string;
      /** True only when stored state says so. Never inferred from the browser return. */
      paymentVerified: boolean;
      paymentStatus: string;
      /** Whether the buyer has already told us about their clinic. */
      qualificationComplete: boolean;
      priceCents: number;
    };

export async function readActivationView(token: string | null | undefined): Promise<ActivationView> {
  const reference = openActivationReference(token);
  if (!reference.ok) return { state: "unknown_reference", reason: reference.reason };

  const reservation = await db.demoReservation.findUnique({
    where: { id: reference.reservationId },
    select: {
      id: true,
      clinicName: true,
      contactName: true,
      paymentStatus: true,
      priceCents: true,
      providerCount: true,
      locationCount: true,
      contactRole: true,
    },
  });
  if (!reservation) return { state: "unknown_reference", reason: "not_found" };

  return {
    state: "found",
    reservationId: reservation.id,
    clinicName: reservation.clinicName,
    contactName: reservation.contactName,
    paymentVerified: VERIFIED_PAYMENT_STATUSES.has(reservation.paymentStatus),
    paymentStatus: reservation.paymentStatus,
    // Any one answered field means they have been through this step already.
    qualificationComplete: Boolean(reservation.providerCount || reservation.locationCount || reservation.contactRole),
    priceCents: reservation.priceCents,
  };
}

export type ActivationResult =
  | { ok: true; reservationId: string; nextAction: string }
  | { ok: false; reason: "unknown_reference" | "invalid" };

/**
 * Record what the buyer volunteered about their clinic, and create the next work item.
 *
 * Only the fields the pre-payment form stopped asking for are writable here. Nothing
 * about money, status, price or eligibility can be set from this surface — a signed
 * reference proves which reservation is being talked about, not that its holder may
 * change what the engagement is worth.
 *
 * An unanswered question stays null rather than becoming a zero, so "we never asked"
 * remains distinguishable from "they told us one provider".
 */
export async function applyActivationQualification(
  token: string | null | undefined,
  rawInput: unknown,
): Promise<ActivationResult> {
  const reference = openActivationReference(token);
  if (!reference.ok) return { ok: false, reason: "unknown_reference" };

  const parsed = salesQualificationSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const qualification: SalesQualification = parsed.data;

  const reservation = await db.demoReservation.findUnique({
    where: { id: reference.reservationId },
    select: { id: true, salesOwnerOrganizationId: true, status: true, clinicName: true },
  });
  if (!reservation) return { ok: false, reason: "unknown_reference" };

  const nextAction = "Klinikos prepares your operating map from what you shared, then a human reviews it with you.";

  await db.$transaction([
    db.demoReservation.update({
      where: { id: reservation.id },
      data: {
        contactRole: qualification.contactRole,
        contactPhone: qualification.contactPhone,
        providerCount: qualification.providerCount,
        locationCount: qualification.locationCount,
        currentSystems: qualification.currentSystems ?? Prisma.DbNull,
        painPoints: qualification.painPoints ?? Prisma.DbNull,
        estimatedSoftwareSpendCents:
          qualification.estimatedSoftwareSpendDollars === null ? null : qualification.estimatedSoftwareSpendDollars * 100,
      },
    }),
    // The next work item. Without this the engagement has no owner and no record that
    // anything is expected to happen, which is the state a paying customer was left in.
    db.demoReservationEvent.create({
      data: {
        salesOwnerOrganizationId: reservation.salesOwnerOrganizationId,
        reservationId: reservation.id,
        actorType: "public_contact",
        eventType: "activation_details_received",
        toStatus: reservation.status,
        note: nextAction,
        metadata: {
          // Which questions were actually answered — not the answers, which are already
          // on the reservation and do not need duplicating into an event log.
          answered: Object.entries(qualification)
            .filter(([, value]) => value !== null && value !== undefined)
            .map(([key]) => key),
        },
      },
    }),
  ]);

  return { ok: true, reservationId: reservation.id, nextAction };
}
