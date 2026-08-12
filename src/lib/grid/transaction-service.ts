import "server-only";

import { db } from "@/lib/db";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import { payoutCanSettle, reservationConflicts } from "@/lib/grid/transaction-state";

const blockingRequestStatuses = ["accepted", "provider_review", "location_review", "credential_check", "pending_deposit", "confirmed"];

export async function assertGridReservationAvailable(input: {
  providerId: string;
  locationId?: string | null;
  requestedStartAt: Date;
  requestedEndAt: Date;
  excludeRequestId?: string | null;
}) {
  const existing = await db.gridRequest.findMany({
    where: {
      id: input.excludeRequestId ? { not: input.excludeRequestId } : undefined,
      status: { in: blockingRequestStatuses },
      OR: [
        { providerId: input.providerId },
        ...(input.locationId ? [{ locationId: input.locationId }] : []),
      ],
    },
    select: { id: true, providerId: true, locationId: true, requestedStartAt: true, requestedEndAt: true },
  });

  const conflict = existing.find((request) => {
    const existingEnd = request.requestedEndAt ?? new Date(request.requestedStartAt.getTime() + 60 * 60 * 1000);
    return reservationConflicts({
      existingStart: request.requestedStartAt,
      existingEnd,
      requestedStart: input.requestedStartAt,
      requestedEnd: input.requestedEndAt,
    });
  });

  if (conflict) {
    throw new NetworkAccessError("This provider or location is no longer available for that time.", 409);
  }
}

export async function validateGridPayoutSettlement(input: {
  payoutId: string;
  externalReference?: string | null;
}) {
  const payout = await db.gridPayout.findUnique({
    where: { id: input.payoutId },
    include: { gridRequest: { select: { status: true } } },
  });

  if (!payout) throw new NetworkAccessError("Grid payout not found.", 404);

  const fulfillmentState = payout.gridRequest.status === "completed" ? "fulfilled" : "not_started";
  if (!payoutCanSettle({ fulfillmentState, externalReference: input.externalReference })) {
    throw new NetworkAccessError("Payout cannot be marked paid until the work is fulfilled and a verified payout reference is recorded.", 409);
  }

  return payout;
}
