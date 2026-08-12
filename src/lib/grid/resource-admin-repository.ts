import "server-only";

import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type ReviewResourceRow = {
  id: string;
  organizationId: string;
  organizationName: string;
  resourceType: string;
  subtype: string | null;
  title: string;
  description: string;
  policyClass: string;
  visibility: string;
  status: string;
  city: string | null;
  state: string | null;
  pricingModel: string;
  priceCents: number | null;
  capacity: number;
  reviewStatus: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

type ReviewAvailabilityRow = {
  resourceId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  status: string;
};

async function requirePlatformReviewAuthority(session: ClinicSession) {
  if (!can(session.role, "settings", "manage")) {
    throw new NetworkAccessError("Grid resource review requires owner-level platform permission.", 403);
  }
  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { slug: true, status: true },
  });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  const platformSlug = process.env.KLINIKOS_PLATFORM_ORGANIZATION_SLUG
    ?? process.env.CLINICOS_SALES_ORGANIZATION_SLUG
    ?? "clinicos-by-zumi";
  if (organization.slug !== platformSlug) {
    throw new NetworkAccessError("Grid resource review is restricted to the Klinikos platform organization.", 403);
  }
}

export async function getGridResourceReviewQueue(session: ClinicSession) {
  await requirePlatformReviewAuthority(session);

  const rows = await db.$queryRaw<ReviewResourceRow[]>(Prisma.sql`
    SELECT r."id", r."organizationId", o."name" AS "organizationName", r."resourceType", r."subtype",
           r."title", r."description", r."policyClass", r."visibility", r."status", r."city", r."state",
           r."pricingModel", r."priceCents", r."capacity", r."reviewStatus", r."metadata", r."createdAt", r."updatedAt"
    FROM "GridResourceRecord" r
    JOIN "Organization" o ON o."id" = r."organizationId"
    WHERE r."status" IN ('pending_review', 'active', 'suspended')
       OR r."reviewStatus" IN ('in_review', 'approved', 'suspended')
    ORDER BY CASE WHEN r."reviewStatus" = 'in_review' THEN 0 ELSE 1 END, r."updatedAt" DESC
    LIMIT 300
  `);
  if (!rows.length) return [];

  const availability = await db.$queryRaw<ReviewAvailabilityRow[]>(Prisma.sql`
    SELECT "resourceId", "startsAt", "endsAt", "capacity", "status"
    FROM "GridResourceAvailabilityRecord"
    WHERE "resourceId" IN (${Prisma.join(rows.map((row) => row.id))}) AND "status" = 'active'
    ORDER BY "startsAt"
  `);
  const availabilityByResource = new Map<string, ReviewAvailabilityRow[]>();
  for (const slot of availability) {
    availabilityByResource.set(slot.resourceId, [...(availabilityByResource.get(slot.resourceId) ?? []), slot]);
  }

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    availability: (availabilityByResource.get(row.id) ?? []).map((slot) => ({
      startsAt: slot.startsAt.toISOString(),
      endsAt: slot.endsAt.toISOString(),
      capacity: slot.capacity,
    })),
  }));
}

export type GridResourceReviewQueue = Awaited<ReturnType<typeof getGridResourceReviewQueue>>;
