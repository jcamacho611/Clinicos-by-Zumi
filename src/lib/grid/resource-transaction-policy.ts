import "server-only";

import { Prisma } from "@prisma/client";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type ResourceRow = {
  id: string;
  organizationId: string;
  resourceType: string;
  policyClass: string;
  visibility: string;
  status: string;
  reviewStatus: string;
  capacity: number;
};

const availabilityRequired = new Set([
  "healthcare_space",
  "equipment_capacity",
  "education_capacity",
  "referral_capacity",
]);

export async function verifyGridResourceForTransaction(
  client: Prisma.TransactionClient,
  input: {
    resourceId: string;
    resourceKind: string;
    startsAt: Date;
    endsAt?: Date | null;
    quantity?: number;
    requesterOrganizationIds: readonly string[];
  },
) {
  const rows = await client.$queryRaw<ResourceRow[]>(Prisma.sql`
    SELECT "id", "organizationId", "resourceType", "policyClass", "visibility", "status", "reviewStatus", "capacity"
    FROM "GridResourceRecord"
    WHERE "id" = ${input.resourceId} AND "resourceType" = ${input.resourceKind}
    LIMIT 1
  `);
  const resource = rows[0];
  if (!resource) throw new NetworkAccessError("The selected Grid resource no longer exists in that resource class.", 409);
  if (resource.status !== "active" || resource.reviewStatus !== "approved") {
    throw new NetworkAccessError("The selected Grid resource is not active and human-approved.", 409);
  }
  if (["regulated_product", "clinical_service"].includes(resource.policyClass)) {
    throw new NetworkAccessError("This regulated resource must use its dedicated clinical or custody policy pathway.", 409);
  }

  const sameOrganization = input.requesterOrganizationIds.includes(resource.organizationId);
  if (["private", "organization"].includes(resource.visibility) && !sameOrganization) {
    throw new NetworkAccessError("The selected Grid resource is not visible to this organization.", 403);
  }
  if (resource.visibility === "invite_only") {
    throw new NetworkAccessError("Invite-only Grid resources require explicit invitation evidence before a transaction can proceed.", 409);
  }
  if (!["public", "network", "matched_only", "organization", "private"].includes(resource.visibility)) {
    throw new NetworkAccessError("The selected Grid resource visibility is not transaction-compatible.", 409);
  }

  const quantity = Math.max(1, input.quantity ?? 1);
  if (resource.capacity < quantity) throw new NetworkAccessError("The selected Grid resource does not have enough declared capacity.", 409);

  let transactionCapacity = resource.capacity;
  if (availabilityRequired.has(resource.policyClass)) {
    const end = input.endsAt ?? new Date(input.startsAt.getTime() + 60 * 60 * 1000);
    const slots = await client.$queryRaw<Array<{ id: string; capacity: number }>>(Prisma.sql`
      SELECT "id", "capacity"
      FROM "GridResourceAvailabilityRecord"
      WHERE "resourceId" = ${resource.id}
        AND "status" = 'active'
        AND "startsAt" <= ${input.startsAt}
        AND "endsAt" >= ${end}
        AND "capacity" >= ${quantity}
      ORDER BY "capacity" DESC
      LIMIT 1
    `);
    if (!slots[0]) {
      throw new NetworkAccessError("The selected Grid resource no longer has approved availability for the offered time window.", 409);
    }
    transactionCapacity = Math.min(resource.capacity, slots[0].capacity);
  }

  return {
    id: resource.id,
    organizationId: resource.organizationId,
    resourceType: resource.resourceType,
    policyClass: resource.policyClass,
    capacity: resource.capacity,
    transactionCapacity,
    reviewStatus: resource.reviewStatus,
  };
}
