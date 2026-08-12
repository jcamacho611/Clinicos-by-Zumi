import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { savedGridDemandSchema, type SavedGridDemand } from "@/lib/grid/transaction-flow";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type GridDemandRow = {
  id: string;
  organizationId: string;
  createdBy: string;
  kind: SavedGridDemand["kind"];
  title: string;
  description: string;
  category: string;
  serviceName: string | null;
  requestedStartAt: Date | null;
  requestedEndAt: Date | null;
  locationType: string | null;
  city: string | null;
  state: string | null;
  radiusMiles: number | null;
  maxPriceCents: number | null;
  quantity: number;
  requiresClinicalEligibility: boolean;
  requirements: unknown;
  status: SavedGridDemand["status"];
  visibility: SavedGridDemand["visibility"];
  selectedProviderId: string | null;
  selectedServiceListingId: string | null;
  selectedLocationId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function requireGridPermission(session: ClinicSession, action: "read" | "create") {
  if (action === "create" && session.role === "contractor") return;
  if (!can(session.role, "network", action) && !can(session.role, "grid", action)) {
    throw new NetworkAccessError("Grid demand access is not permitted for this role.", 403);
  }
}

async function requireSyntheticOrganization(organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { demoMode: true, status: true },
  });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  if (!organization.demoMode) {
    throw new NetworkAccessError("Saved Grid demand requires production review before real patient or clinical data can be used.", 409);
  }
}

function serializeDemand(row: GridDemandRow) {
  return {
    ...row,
    requirements: Array.isArray(row.requirements) ? row.requirements : [],
    requestedStartAt: row.requestedStartAt?.toISOString() ?? null,
    requestedEndAt: row.requestedEndAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listSavedGridDemands(session: ClinicSession) {
  requireGridPermission(session, "read");
  const rows = await db.$queryRaw<GridDemandRow[]>(Prisma.sql`
    SELECT *
    FROM "GridDemandRecord"
    WHERE "organizationId" = ${session.organizationId}
    ORDER BY "updatedAt" DESC
    LIMIT 100
  `);
  return rows.map(serializeDemand);
}

export async function createSavedGridDemand(session: ClinicSession, rawInput: unknown) {
  requireGridPermission(session, "create");
  await requireSyntheticOrganization(session.organizationId);
  const input = savedGridDemandSchema.parse(rawInput);
  if (!['draft', 'open'].includes(input.status)) {
    throw new NetworkAccessError("A new Grid need can only begin as draft or open.", 409);
  }
  if (session.role === "contractor" && input.visibility === "public") {
    throw new NetworkAccessError("External Grid participant needs begin private, matched-only, or inside the reviewed network.", 409);
  }

  const id = randomUUID();
  const requirements = JSON.stringify(input.requirements);

  const rows = await db.$queryRaw<GridDemandRow[]>(Prisma.sql`
    INSERT INTO "GridDemandRecord" (
      "id", "organizationId", "createdBy", "kind", "title", "description", "category",
      "serviceName", "requestedStartAt", "requestedEndAt", "locationType", "city", "state",
      "radiusMiles", "maxPriceCents", "quantity", "requiresClinicalEligibility", "requirements",
      "status", "visibility", "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${session.organizationId}, ${session.userId}, ${input.kind}, ${input.title}, ${input.description}, ${input.category},
      ${input.serviceName ?? null}, ${input.requestedStartAt ? new Date(input.requestedStartAt) : null},
      ${input.requestedEndAt ? new Date(input.requestedEndAt) : null}, ${input.locationType ?? null}, ${input.city ?? null}, ${input.state ?? null},
      ${input.radiusMiles ?? null}, ${input.maxPriceCents ?? null}, ${input.quantity}, ${input.requiresClinicalEligibility},
      CAST(${requirements} AS JSONB), ${input.status}, ${input.visibility}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING *
  `);

  const created = rows[0];
  if (!created) throw new NetworkAccessError("Grid demand could not be saved.", 500);

  await db.auditLog.create({
    data: {
      organizationId: session.organizationId,
      actorId: session.userId,
      actorType: "user",
      action: "grid.demand_created",
      resourceType: "grid_demand",
      resourceId: id,
      metadata: {
        kind: input.kind,
        status: input.status,
        visibility: input.visibility,
        syntheticDemo: true,
        containsPhi: false,
        externalParticipant: session.role === "contractor",
      },
    },
  });

  return serializeDemand(created);
}
