import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type ResourceDetailRow = {
  id: string;
  organizationId: string;
  organizationName: string;
  resourceType: string;
  subtype: string | null;
  title: string;
  description: string;
  policyClass: string;
  city: string | null;
  state: string | null;
  timezone: string;
  pricingModel: string;
  priceCents: number | null;
  capacity: number;
  metadata: Prisma.JsonValue | null;
};

type AvailabilityRow = { startsAt: Date; endsAt: Date; capacity: number };

export async function getApprovedPublicGridResource(resourceId: string) {
  const rows = await db.$queryRaw<ResourceDetailRow[]>(Prisma.sql`
    SELECT r."id", r."organizationId", o."name" AS "organizationName", r."resourceType", r."subtype", r."title",
           r."description", r."policyClass", r."city", r."state", r."timezone", r."pricingModel", r."priceCents",
           r."capacity", r."metadata"
    FROM "GridResourceRecord" r
    JOIN "Organization" o ON o."id" = r."organizationId"
    WHERE r."id" = ${resourceId} AND r."status" = 'active' AND r."reviewStatus" = 'approved' AND r."visibility" = 'public'
    LIMIT 1
  `);
  const resource = rows[0];
  if (!resource) throw new NetworkAccessError("This Grid resource is not available for public requests.", 404);

  const availability = await db.$queryRaw<AvailabilityRow[]>(Prisma.sql`
    SELECT "startsAt", "endsAt", "capacity"
    FROM "GridResourceAvailabilityRecord"
    WHERE "resourceId" = ${resource.id} AND "status" = 'active' AND "endsAt" > CURRENT_TIMESTAMP
    ORDER BY "startsAt"
    LIMIT 100
  `);
  const metadata = resource.metadata && typeof resource.metadata === "object" && !Array.isArray(resource.metadata)
    ? resource.metadata as Record<string, unknown>
    : {};

  return {
    ...resource,
    credentialRequirements: Array.isArray(metadata.credentialRequirements) ? metadata.credentialRequirements : [],
    insuranceRequirements: Array.isArray(metadata.insuranceRequirements) ? metadata.insuranceRequirements : [],
    operatorRequirements: Array.isArray(metadata.operatorRequirements) ? metadata.operatorRequirements : [],
    usageRestrictions: Array.isArray(metadata.usageRestrictions) ? metadata.usageRestrictions : [],
    availability: availability.map((slot) => ({ startsAt: slot.startsAt.toISOString(), endsAt: slot.endsAt.toISOString(), capacity: slot.capacity })),
  };
}

export type ApprovedPublicGridResource = Awaited<ReturnType<typeof getApprovedPublicGridResource>>;
