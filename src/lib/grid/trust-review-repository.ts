import "server-only";

import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type DisputeReviewRow = {
  id: string;
  reservationId: string;
  category: string;
  summary: string;
  requestedOutcome: string | null;
  status: string;
  resolutionNote: string | null;
  ownerOrganizationName: string;
  openedByOrganizationName: string;
  demandTitle: string;
  updatedAt: Date;
};

type IncidentReviewRow = {
  id: string;
  reservationId: string;
  category: string;
  severity: string;
  summary: string;
  status: string;
  resolutionNote: string | null;
  ownerOrganizationName: string;
  reportedByOrganizationName: string;
  demandTitle: string;
  updatedAt: Date;
};

async function requirePlatformReviewAuthority(session: ClinicSession) {
  if (!can(session.role, "settings", "manage")) {
    throw new NetworkAccessError("Grid issue review requires owner-level platform permission.", 403);
  }
  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { slug: true, status: true },
  });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  const platformSlug = process.env.KLINIKOS_PLATFORM_ORGANIZATION_SLUG ?? process.env.CLINICOS_SALES_ORGANIZATION_SLUG ?? "clinicos-by-zumi";
  if (organization.slug !== platformSlug) {
    throw new NetworkAccessError("Grid issue review is restricted to the Klinikos platform organization.", 403);
  }
}

export async function getGridTrustReviewQueue(session: ClinicSession) {
  await requirePlatformReviewAuthority(session);
  const [disputes, incidents] = await Promise.all([
    db.$queryRaw<DisputeReviewRow[]>(Prisma.sql`
      SELECT d."id", d."reservationId", d."category", d."summary", d."requestedOutcome", d."status", d."resolutionNote",
             owner."name" AS "ownerOrganizationName", opener."name" AS "openedByOrganizationName",
             demand."title" AS "demandTitle", d."updatedAt"
      FROM "GridDisputeRecord" d
      JOIN "Organization" owner ON owner."id" = d."organizationId"
      JOIN "Organization" opener ON opener."id" = d."openedByOrganizationId"
      JOIN "GridReservationRecord" r ON r."id" = d."reservationId"
      JOIN "GridDemandRecord" demand ON demand."id" = r."demandId"
      ORDER BY CASE WHEN d."status" = 'closed' THEN 1 ELSE 0 END, d."updatedAt" DESC
      LIMIT 250
    `),
    db.$queryRaw<IncidentReviewRow[]>(Prisma.sql`
      SELECT s."id", s."reservationId", s."category", s."severity", s."summary", s."status", s."resolutionNote",
             owner."name" AS "ownerOrganizationName", reporter."name" AS "reportedByOrganizationName",
             demand."title" AS "demandTitle", s."updatedAt"
      FROM "GridSafetyIncidentRecord" s
      JOIN "Organization" owner ON owner."id" = s."organizationId"
      JOIN "Organization" reporter ON reporter."id" = s."reportedByOrganizationId"
      JOIN "GridReservationRecord" r ON r."id" = s."reservationId"
      JOIN "GridDemandRecord" demand ON demand."id" = r."demandId"
      ORDER BY CASE WHEN s."status" = 'closed' THEN 1 ELSE 0 END,
               CASE s."severity" WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
               s."updatedAt" DESC
      LIMIT 250
    `),
  ]);

  return {
    disputes: disputes.map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString() })),
    safetyIncidents: incidents.map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString() })),
    metrics: {
      openDisputes: disputes.filter((row) => row.status !== "closed").length,
      openSafetyIncidents: incidents.filter((row) => row.status !== "closed").length,
      urgentSafetyIncidents: incidents.filter((row) => row.status !== "closed" && row.severity === "urgent").length,
    },
  };
}

export type GridTrustReviewQueue = Awaited<ReturnType<typeof getGridTrustReviewQueue>>;
