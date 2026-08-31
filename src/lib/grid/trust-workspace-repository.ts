import "server-only";

import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { getGridTrustSummary } from "@/lib/grid/trust-repository";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";
import { projectGridTrustSignals } from "@/lib/trust/universal-trust";

type ReservationRow = {
  id: string;
  demandTitle: string;
  status: string;
  fulfillmentStatus: string;
  reservedStartAt: Date;
  senderName: string | null;
  recipientName: string | null;
  updatedAt: Date;
};

type DisputeRow = {
  id: string;
  reservationId: string;
  category: string;
  summary: string;
  requestedOutcome: string | null;
  status: string;
  openedByOrganizationId: string;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type IncidentRow = {
  id: string;
  reservationId: string;
  category: string;
  severity: string;
  summary: string;
  status: string;
  reportedByOrganizationId: string;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function requireRead(session: ClinicSession) {
  if (!can(session.role, "grid", "read") && !can(session.role, "network", "read")) {
    throw new NetworkAccessError("Grid trust information is not permitted for this role.", 403);
  }
}

export async function getGridTrustWorkspace(session: ClinicSession) {
  requireRead(session);
  const [summary, reservations, disputes, incidents] = await Promise.all([
    getGridTrustSummary(session),
    db.$queryRaw<ReservationRow[]>(Prisma.sql`
      SELECT DISTINCT r."id", d."title" AS "demandTitle", r."status", r."fulfillmentStatus", r."reservedStartAt",
             sender."name" AS "senderName", recipient."name" AS "recipientName", r."updatedAt"
      FROM "GridReservationRecord" r
      JOIN "GridDemandRecord" d ON d."id" = r."demandId"
      JOIN "GridOfferRecord" o ON o."id" = r."offerId"
      LEFT JOIN "organizations" sender ON sender."id" = o."senderOrganizationId"
      LEFT JOIN "organizations" recipient ON recipient."id" = o."recipientOrganizationId"
      WHERE r."organizationId" = ${session.organizationId}
         OR o."senderOrganizationId" = ${session.organizationId}
         OR o."recipientOrganizationId" = ${session.organizationId}
      ORDER BY r."updatedAt" DESC
      LIMIT 100
    `),
    db.$queryRaw<DisputeRow[]>(Prisma.sql`
      SELECT d."id", d."reservationId", d."category", d."summary", d."requestedOutcome", d."status",
             d."openedByOrganizationId", d."resolutionNote", d."createdAt", d."updatedAt"
      FROM "GridDisputeRecord" d
      JOIN "GridReservationRecord" r ON r."id" = d."reservationId"
      JOIN "GridOfferRecord" o ON o."id" = r."offerId"
      WHERE r."organizationId" = ${session.organizationId}
         OR o."senderOrganizationId" = ${session.organizationId}
         OR o."recipientOrganizationId" = ${session.organizationId}
      ORDER BY d."updatedAt" DESC
      LIMIT 100
    `),
    db.$queryRaw<IncidentRow[]>(Prisma.sql`
      SELECT s."id", s."reservationId", s."category", s."severity", s."summary", s."status",
             s."reportedByOrganizationId", s."resolutionNote", s."createdAt", s."updatedAt"
      FROM "GridSafetyIncidentRecord" s
      JOIN "GridReservationRecord" r ON r."id" = s."reservationId"
      JOIN "GridOfferRecord" o ON o."id" = r."offerId"
      WHERE r."organizationId" = ${session.organizationId}
         OR o."senderOrganizationId" = ${session.organizationId}
         OR o."recipientOrganizationId" = ${session.organizationId}
      ORDER BY s."updatedAt" DESC
      LIMIT 100
    `),
  ]);

  const normalizedDisputes = disputes.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
  const normalizedSafetyIncidents = incidents.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
  const trustSignals = projectGridTrustSignals({
    disputes: normalizedDisputes,
    safetyIncidents: normalizedSafetyIncidents,
  });

  return {
    summary,
    trustSignals,
    reservations: reservations.map((row) => ({
      ...row,
      reservedStartAt: row.reservedStartAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    disputes: normalizedDisputes,
    safetyIncidents: normalizedSafetyIncidents,
  };
}

export type GridTrustWorkspace = Awaited<ReturnType<typeof getGridTrustWorkspace>>;