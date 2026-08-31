import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { publicGridCoordinate } from "@/lib/grid/geo-rules";

type PublicResourceRow = {
  id: string;
  resourceType: string;
  subtype: string | null;
  title: string;
  description: string;
  policyClass: string;
  city: string | null;
  state: string | null;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
  pricingModel: string;
  priceCents: number | null;
  capacity: number;
  metadata: Prisma.JsonValue | null;
  updatedAt: Date;
};

type PublicAvailabilityRow = {
  startsAt: Date;
  endsAt: Date;
  capacity: number;
};

function hasArrayValues(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

export async function findPublicGridResource(resourceId: string) {
  const rows = await db.$queryRaw<PublicResourceRow[]>(Prisma.sql`
    SELECT "id", "resourceType", "subtype", "title", "description", "policyClass", "city", "state", "timezone",
           "latitude", "longitude", "pricingModel", "priceCents", "capacity", "metadata", "updatedAt"
    FROM "GridResourceRecord"
    WHERE "id" = ${resourceId}
      AND "status" = 'active'
      AND "reviewStatus" = 'approved'
      AND "visibility" = 'public'
    LIMIT 1
  `);
  const row = rows[0];
  if (!row) return null;

  const availability = await db.$queryRaw<PublicAvailabilityRow[]>(Prisma.sql`
    SELECT "startsAt", "endsAt", "capacity"
    FROM "GridResourceAvailabilityRecord"
    WHERE "resourceId" = ${row.id}
      AND "status" = 'active'
      AND "endsAt" > CURRENT_TIMESTAMP
    ORDER BY "startsAt"
    LIMIT 24
  `);

  const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata as Record<string, unknown>
    : {};

  return {
    id: row.id,
    resourceType: row.resourceType,
    subtype: row.subtype,
    title: row.title,
    description: row.description,
    policyClass: row.policyClass,
    city: row.city,
    state: row.state,
    timezone: row.timezone,
    latitude: publicGridCoordinate(row.latitude),
    longitude: publicGridCoordinate(row.longitude),
    pricingModel: row.pricingModel,
    priceCents: row.priceCents,
    capacity: row.capacity,
    requirements: {
      credentialRequirementsApply: hasArrayValues(metadata.credentialRequirements),
      insuranceRequirementsApply: hasArrayValues(metadata.insuranceRequirements),
      operatorRequirementsApply: hasArrayValues(metadata.operatorRequirements),
      usageRestrictionsApply: hasArrayValues(metadata.usageRestrictions),
    },
    availability: availability.map((slot) => ({
      startsAt: slot.startsAt.toISOString(),
      endsAt: slot.endsAt.toISOString(),
      capacity: slot.capacity,
    })),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type PublicGridResourceDetail = NonNullable<Awaited<ReturnType<typeof findPublicGridResource>>>;
