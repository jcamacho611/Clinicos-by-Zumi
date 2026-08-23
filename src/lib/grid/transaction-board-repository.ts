import "server-only";

import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { computeGridLiquidityMetrics } from "@/lib/grid/liquidity-metrics";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type DemandBoardRow = {
  id: string;
  kind: string;
  title: string;
  category: string;
  serviceName: string | null;
  locationType: string | null;
  requiresClinicalEligibility: boolean;
  status: string;
  visibility: string;
  requestedStartAt: Date | null;
  requestedEndAt: Date | null;
  city: string | null;
  state: string | null;
  maxPriceCents: number | null;
  updatedAt: Date;
};

type OfferBoardRow = {
  id: string;
  ownerOrganizationId: string;
  demandId: string;
  demandTitle: string;
  senderOrganizationId: string | null;
  recipientOrganizationId: string | null;
  senderName: string | null;
  recipientName: string | null;
  status: string;
  version: number;
  providerId: string | null;
  serviceListingId: string | null;
  locationId: string | null;
  grossAmountCents: number;
  depositAmountCents: number;
  locationPayableCents: number;
  offeredStartAt: Date;
  offeredEndAt: Date | null;
  expiresAt: Date;
  note: string;
  updatedAt: Date;
};

type ReservationBoardRow = {
  id: string;
  ownerOrganizationId: string;
  demandId: string;
  demandTitle: string;
  offerId: string;
  senderOrganizationId: string | null;
  recipientOrganizationId: string | null;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  grossAmountCents: number;
  depositAmountCents: number;
  locationPayableCents: number;
  reservedStartAt: Date;
  reservedEndAt: Date | null;
  paymentReference: string | null;
  updatedAt: Date;
};

type ObligationBoardRow = {
  id: string;
  reservationId: string;
  obligationType: string;
  beneficiaryType: string;
  beneficiaryReference: string | null;
  beneficiaryName: string | null;
  amountCents: number;
  status: string;
  externalReference: string | null;
  updatedAt: Date;
};

function requireRead(session: ClinicSession) {
  if (!can(session.role, "grid", "read") && !can(session.role, "network", "read") && !can(session.role, "billing", "read")) {
    throw new NetworkAccessError("Grid transaction command is not permitted for this role.", 403);
  }
}

function iso(value: Date | null) {
  return value?.toISOString() ?? null;
}

export async function getGridTransactionBoard(session: ClinicSession) {
  requireRead(session);

  const [demands, offers, reservations, obligations] = await Promise.all([
    db.$queryRaw<DemandBoardRow[]>(Prisma.sql`
      SELECT "id", "kind", "title", "category", "serviceName", "locationType", "requiresClinicalEligibility",
             "status", "visibility", "requestedStartAt", "requestedEndAt", "city", "state", "maxPriceCents", "updatedAt"
      FROM "GridDemandRecord"
      WHERE "organizationId" = ${session.organizationId}
      ORDER BY "updatedAt" DESC
      LIMIT 100
    `),
    db.$queryRaw<OfferBoardRow[]>(Prisma.sql`
      SELECT o."id", o."organizationId" AS "ownerOrganizationId", o."demandId", d."title" AS "demandTitle",
             o."senderOrganizationId", o."recipientOrganizationId", sender."name" AS "senderName", recipient."name" AS "recipientName",
             o."status", o."version", o."providerId", o."serviceListingId", o."locationId", o."grossAmountCents",
             o."depositAmountCents", o."locationPayableCents", o."offeredStartAt", o."offeredEndAt", o."expiresAt", o."note", o."updatedAt"
      FROM "GridOfferRecord" o
      JOIN "GridDemandRecord" d ON d."id" = o."demandId"
      LEFT JOIN "organizations" sender ON sender."id" = o."senderOrganizationId"
      LEFT JOIN "organizations" recipient ON recipient."id" = o."recipientOrganizationId"
      WHERE o."organizationId" = ${session.organizationId}
         OR o."senderOrganizationId" = ${session.organizationId}
         OR o."recipientOrganizationId" = ${session.organizationId}
      ORDER BY o."updatedAt" DESC
      LIMIT 150
    `),
    db.$queryRaw<ReservationBoardRow[]>(Prisma.sql`
      SELECT r."id", r."organizationId" AS "ownerOrganizationId", r."demandId", d."title" AS "demandTitle", r."offerId",
             o."senderOrganizationId", o."recipientOrganizationId", r."status", r."paymentStatus", r."fulfillmentStatus",
             r."grossAmountCents", r."depositAmountCents", r."locationPayableCents", r."reservedStartAt", r."reservedEndAt",
             r."paymentReference", r."updatedAt"
      FROM "GridReservationRecord" r
      JOIN "GridDemandRecord" d ON d."id" = r."demandId"
      JOIN "GridOfferRecord" o ON o."id" = r."offerId"
      WHERE r."organizationId" = ${session.organizationId}
         OR o."senderOrganizationId" = ${session.organizationId}
         OR o."recipientOrganizationId" = ${session.organizationId}
      ORDER BY r."updatedAt" DESC
      LIMIT 150
    `),
    db.$queryRaw<ObligationBoardRow[]>(Prisma.sql`
      SELECT f."id", f."reservationId", f."obligationType", f."beneficiaryType", f."beneficiaryReference",
             beneficiary."name" AS "beneficiaryName", f."amountCents", f."status", f."externalReference", f."updatedAt"
      FROM "GridFinancialObligationRecord" f
      LEFT JOIN "organizations" beneficiary
        ON f."beneficiaryType" = 'organization' AND beneficiary."id" = f."beneficiaryReference"
      WHERE f."organizationId" = ${session.organizationId}
         OR (f."beneficiaryType" = 'organization' AND f."beneficiaryReference" = ${session.organizationId})
      ORDER BY f."updatedAt" DESC
      LIMIT 250
    `),
  ]);

  const pendingToYouCents = obligations
    .filter((line) => line.beneficiaryType === "organization" && line.beneficiaryReference === session.organizationId && line.status !== "settled")
    .reduce((sum, line) => sum + line.amountCents, 0);
  const settledToYouCents = obligations
    .filter((line) => line.beneficiaryType === "organization" && line.beneficiaryReference === session.organizationId && line.status === "settled")
    .reduce((sum, line) => sum + line.amountCents, 0);
  const liquidity = computeGridLiquidityMetrics({
    demands,
    offers,
    reservations,
    sourceWindowComplete: demands.length < 100 && offers.length < 150 && reservations.length < 150,
  });

  return {
    organizationId: session.organizationId,
    metrics: {
      openDemands: demands.filter((item) => !["fulfilled", "cancelled", "expired"].includes(item.status)).length,
      activeOffers: offers.filter((item) => item.status === "sent").length,
      heldReservations: reservations.filter((item) => ["pending", "held", "consumed"].includes(item.status)).length,
      awaitingFulfillment: reservations.filter((item) => !["fulfilled", "failed", "disputed"].includes(item.fulfillmentStatus)).length,
      pendingToYouCents,
      settledToYouCents,
    },
    liquidity,
    demands: demands.map((item) => ({ ...item, requestedStartAt: iso(item.requestedStartAt), requestedEndAt: iso(item.requestedEndAt), updatedAt: item.updatedAt.toISOString() })),
    offers: offers.map((item) => ({ ...item, offeredStartAt: item.offeredStartAt.toISOString(), offeredEndAt: iso(item.offeredEndAt), expiresAt: item.expiresAt.toISOString(), updatedAt: item.updatedAt.toISOString() })),
    reservations: reservations.map((item) => ({ ...item, reservedStartAt: item.reservedStartAt.toISOString(), reservedEndAt: iso(item.reservedEndAt), updatedAt: item.updatedAt.toISOString() })),
    obligations: obligations.map((item) => ({ ...item, updatedAt: item.updatedAt.toISOString() })),
  };
}

export type GridTransactionBoard = Awaited<ReturnType<typeof getGridTransactionBoard>>;
