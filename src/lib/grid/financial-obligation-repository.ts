import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { computePlatformFeeCents } from "@/lib/grid/financial-rules";
import { reservationHasActiveGridIssues } from "@/lib/grid/trust-repository";
import { computeGridFinancialSplit } from "@/lib/grid/transaction-state";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type FinanceContextRow = {
  reservationId: string;
  organizationId: string;
  grossAmountCents: number;
  locationPayableCents: number;
  fulfillmentStatus: string;
  providerId: string | null;
  locationId: string | null;
  resourceKind: string | null;
  demandKind: string;
  supplyOrganizationId: string | null;
  locationOrganizationId: string | null;
};

type FeePolicyRow = {
  id: string;
  scopeKind: string;
  scopeValue: string | null;
  platformFeeBps: number;
  platformFeeFlatCents: number;
};

type ObligationRow = {
  id: string;
  organizationId: string;
  reservationId: string;
  obligationType: string;
  beneficiaryType: string;
  beneficiaryReference: string | null;
  amountCents: number;
  status: string;
  externalReference: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function requireAllocationPermission(session: ClinicSession) {
  if (!can(session.role, "grid", "update") && !can(session.role, "network", "update")) {
    throw new NetworkAccessError("Grid financial allocation is not permitted for this role.", 403);
  }
}

async function requireSyntheticOrganization(organizationId: string) {
  const organization = await db.organization.findUnique({ where: { id: organizationId }, select: { demoMode: true, status: true } });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  if (!organization.demoMode) throw new NetworkAccessError("Grid financial allocation requires production review before live settlement use.", 409);
}

function serialize(row: ObligationRow) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

async function resolveFeePolicy(client: Prisma.TransactionClient, context: FinanceContextRow) {
  const rows = await client.$queryRaw<FeePolicyRow[]>(Prisma.sql`
    SELECT "id", "scopeKind", "scopeValue", "platformFeeBps", "platformFeeFlatCents"
    FROM "GridFeePolicyRecord"
    WHERE "status" = 'active'
      AND (
        (${context.resourceKind} IS NOT NULL AND "scopeKind" = 'resource_kind' AND "scopeValue" = ${context.resourceKind})
        OR ("scopeKind" = 'demand_kind' AND "scopeValue" = ${context.demandKind})
        OR ("scopeKind" = 'default' AND "scopeValue" IS NULL)
      )
    ORDER BY CASE
      WHEN ${context.resourceKind} IS NOT NULL AND "scopeKind" = 'resource_kind' AND "scopeValue" = ${context.resourceKind} THEN 1
      WHEN "scopeKind" = 'demand_kind' AND "scopeValue" = ${context.demandKind} THEN 2
      ELSE 3
    END
    LIMIT 1
  `);
  const policy = rows[0];
  if (!policy) {
    throw new NetworkAccessError("No active Klinikos Grid fee policy applies to this fulfilled transaction.", 409);
  }
  return policy;
}

export async function listGridFinancialObligations(session: ClinicSession) {
  if (!can(session.role, "grid", "read") && !can(session.role, "billing", "read")) {
    throw new NetworkAccessError("Grid financial obligations are not permitted for this role.", 403);
  }
  const rows = await db.$queryRaw<ObligationRow[]>(Prisma.sql`
    SELECT * FROM "GridFinancialObligationRecord"
    WHERE "organizationId" = ${session.organizationId}
       OR ("beneficiaryType" = 'organization' AND "beneficiaryReference" = ${session.organizationId})
    ORDER BY "updatedAt" DESC
    LIMIT 250
  `);
  return rows.map(serialize);
}

export async function allocateGridFinancialObligations(session: ClinicSession, reservationId: string) {
  requireAllocationPermission(session);
  await requireSyntheticOrganization(session.organizationId);

  return db.$transaction(async (tx) => {
    const contexts = await tx.$queryRaw<FinanceContextRow[]>(Prisma.sql`
      SELECT r."id" AS "reservationId", r."organizationId", r."grossAmountCents", r."locationPayableCents",
             r."fulfillmentStatus", r."providerId", r."locationId", r."resourceKind",
             d."kind" AS "demandKind", o."recipientOrganizationId" AS "supplyOrganizationId",
             l."organizationId" AS "locationOrganizationId"
      FROM "GridReservationRecord" r
      JOIN "GridDemandRecord" d ON d."id" = r."demandId"
      JOIN "GridOfferRecord" o ON o."id" = r."offerId"
      LEFT JOIN "locations" l ON l."id" = r."locationId"
      WHERE r."id" = ${reservationId} AND r."organizationId" = ${session.organizationId}
      FOR UPDATE OF r
    `);
    const context = contexts[0];
    if (!context) throw new NetworkAccessError("Grid reservation not found.", 404);
    if (context.fulfillmentStatus !== "fulfilled") {
      throw new NetworkAccessError("Financial obligations are created only after Grid fulfillment is recorded as fulfilled.", 409);
    }

    const issues = await reservationHasActiveGridIssues(tx, context.reservationId);
    if (issues.blocked) {
      throw new NetworkAccessError(
        `Financial allocation is on hold while ${issues.activeDisputes} marketplace dispute(s) and ${issues.activeSafetyIncidents} safety incident(s) remain open.`,
        409,
      );
    }

    if (!context.supplyOrganizationId) {
      throw new NetworkAccessError("The fulfilled Grid transaction has no verified supply organization for settlement.", 409);
    }
    if (context.locationPayableCents > 0 && !context.locationOrganizationId) {
      throw new NetworkAccessError("Location compensation exists but no location organization is available for settlement.", 409);
    }

    const existing = await tx.$queryRaw<ObligationRow[]>(Prisma.sql`
      SELECT * FROM "GridFinancialObligationRecord" WHERE "reservationId" = ${context.reservationId} ORDER BY "obligationType"
    `);
    if (existing.length) return existing.map(serialize);

    const policy = await resolveFeePolicy(tx, context);
    const platformFeeCents = computePlatformFeeCents({
      grossAmountCents: context.grossAmountCents,
      platformFeeBps: policy.platformFeeBps,
      platformFeeFlatCents: policy.platformFeeFlatCents,
    });
    const split = computeGridFinancialSplit({
      grossAmountCents: context.grossAmountCents,
      platformFeeCents,
      locationPayableCents: context.locationPayableCents,
    });

    const lines = [
      { type: "platform_fee", beneficiaryType: "platform", beneficiaryReference: "klinikos", amountCents: split.platformFeeCents },
      { type: "supply_payable", beneficiaryType: "organization", beneficiaryReference: context.supplyOrganizationId, amountCents: split.providerPayableCents },
      ...(split.locationPayableCents > 0
        ? [{ type: "location_payable", beneficiaryType: "organization", beneficiaryReference: context.locationOrganizationId, amountCents: split.locationPayableCents }]
        : []),
    ].filter((line) => line.amountCents > 0);

    const created: ObligationRow[] = [];
    for (const line of lines) {
      const id = randomUUID();
      const rows = await tx.$queryRaw<ObligationRow[]>(Prisma.sql`
        INSERT INTO "GridFinancialObligationRecord" (
          "id", "organizationId", "reservationId", "obligationType", "beneficiaryType", "beneficiaryReference",
          "amountCents", "status", "createdAt", "updatedAt"
        ) VALUES (
          ${id}, ${context.organizationId}, ${context.reservationId}, ${line.type}, ${line.beneficiaryType},
          ${line.beneficiaryReference}, ${line.amountCents}, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `);
      if (rows[0]) created.push(rows[0]);
    }

    const totalAllocated = created.reduce((sum, line) => sum + line.amountCents, 0);
    if (totalAllocated !== context.grossAmountCents) {
      throw new NetworkAccessError("Grid financial allocation does not reconcile to the gross transaction amount.", 500);
    }

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: "grid.financial_obligations_allocated",
        resourceType: "grid_reservation",
        resourceId: context.reservationId,
        metadata: {
          grossAmountCents: context.grossAmountCents,
          platformFeeCents: split.platformFeeCents,
          supplyPayableCents: split.providerPayableCents,
          locationPayableCents: split.locationPayableCents,
          feePolicyId: policy.id,
          feePolicyScopeKind: policy.scopeKind,
          feePolicyScopeValue: policy.scopeValue,
          obligationsCreated: created.map((line) => line.id),
          settlementStatus: "pending",
          automatedPayout: false,
        },
      },
    });

    return created.map(serialize);
  });
}
