import "server-only";

import { db } from "@/lib/db";
import { createGridOffer } from "@/lib/grid/offer-repository";
import { getEligibleGridResourceForTransaction } from "@/lib/grid/resource-repository";
import { gridOfferSchema } from "@/lib/grid/transaction-flow";
import type { ClinicSession } from "@/lib/auth/types";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

export async function createGridOfferWithUniversalResource(session: ClinicSession, rawInput: unknown) {
  const input = gridOfferSchema.parse(rawInput);

  if (!input.resourceReference || !input.resourceKind) {
    throw new NetworkAccessError("A universal Grid resource reference and resource type are required for this offer path.", 400);
  }
  if (!input.recipientOrganizationId) {
    throw new NetworkAccessError("A universal resource offer must name the organization that owns the selected resource.", 400);
  }

  const offeredStartAt = new Date(input.offeredStartAt);
  const offeredEndAt = input.offeredEndAt
    ? new Date(input.offeredEndAt)
    : new Date(offeredStartAt.getTime() + 60 * 60 * 1000);

  await db.$transaction(async (tx) => {
    await getEligibleGridResourceForTransaction(tx, {
      resourceId: input.resourceReference!,
      resourceType: input.resourceKind!,
      recipientOrganizationId: input.recipientOrganizationId,
      startsAt: offeredStartAt,
      endsAt: offeredEndAt,
    });
  });

  return createGridOffer(session, input);
}
