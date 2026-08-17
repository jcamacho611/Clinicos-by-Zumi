import "server-only";

import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type ResourceDealRow = {
  id: string;
  organizationId: string;
  demandId: string;
  demandTitle: string;
  senderOrganizationId: string | null;
  recipientOrganizationId: string | null;
  senderName: string | null;
  recipientName: string | null;
  resourceKind: string;
  resourceReference: string;
  resourceTitle: string;
  resourcePolicyClass: string;
  parentOfferId: string | null;
  version: number;
  offeredStartAt: Date;
  offeredEndAt: Date | null;
  grossAmountCents: number;
  depositAmountCents: number;
  locationPayableCents: number;
  note: string;
  status: string;
  expiresAt: Date;
  reservationId: string | null;
  reservationStatus: string | null;
  paymentStatus: string | null;
  fulfillmentStatus: string | null;
  updatedAt: Date;
};

function requireRead(session: ClinicSession) {
  if (!can(session.role, "grid", "read") && !can(session.role, "network", "read")) {
    throw new NetworkAccessError("Grid resource deals are not permitted for this role.", 403);
  }
}

export async function getUniversalResourceDealRoom(session: ClinicSession) {
  requireRead(session);
  const rows = await db.$queryRaw<ResourceDealRow[]>(Prisma.sql`
    SELECT o."id", o."organizationId", o."demandId", d."title" AS "demandTitle",
           o."senderOrganizationId", o."recipientOrganizationId", sender."name" AS "senderName", recipient."name" AS "recipientName",
           o."resourceKind", o."resourceReference", resource."title" AS "resourceTitle", resource."policyClass" AS "resourcePolicyClass",
           o."parentOfferId", o."version", o."offeredStartAt", o."offeredEndAt", o."grossAmountCents", o."depositAmountCents",
           o."locationPayableCents", o."note", o."status", o."expiresAt",
           reservation."id" AS "reservationId", reservation."status" AS "reservationStatus",
           reservation."paymentStatus", reservation."fulfillmentStatus", o."updatedAt"
    FROM "GridOfferRecord" o
    JOIN "GridDemandRecord" d ON d."id" = o."demandId"
    JOIN "GridResourceRecord" resource ON resource."id" = o."resourceReference" AND resource."resourceType" = o."resourceKind"
    LEFT JOIN "organizations" sender ON sender."id" = o."senderOrganizationId"
    LEFT JOIN "organizations" recipient ON recipient."id" = o."recipientOrganizationId"
    LEFT JOIN "GridReservationRecord" reservation ON reservation."offerId" = o."id"
    WHERE o."resourceReference" IS NOT NULL
      AND o."resourceKind" IS NOT NULL
      AND (
        o."organizationId" = ${session.organizationId}
        OR o."senderOrganizationId" = ${session.organizationId}
        OR o."recipientOrganizationId" = ${session.organizationId}
      )
    ORDER BY o."updatedAt" DESC
    LIMIT 200
  `);

  return {
    organizationId: session.organizationId,
    deals: rows.map((row) => ({
      ...row,
      offeredStartAt: row.offeredStartAt.toISOString(),
      offeredEndAt: row.offeredEndAt?.toISOString() ?? null,
      expiresAt: row.expiresAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}

export type UniversalResourceDealRoom = Awaited<ReturnType<typeof getUniversalResourceDealRoom>>;
