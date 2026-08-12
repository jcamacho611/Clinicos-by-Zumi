import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { gridObligationTransitionSchema } from "@/lib/grid/financial-rules";
import {
  canTransitionGridSettlement,
  payoutCanSettle,
  type GridFulfillmentState,
  type GridSettlementState,
} from "@/lib/grid/transaction-state";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type SettlementRow = {
  id: string;
  organizationId: string;
  reservationId: string;
  obligationType: string;
  beneficiaryType: string;
  beneficiaryReference: string | null;
  amountCents: number;
  status: GridSettlementState;
  externalReference: string | null;
  fulfillmentStatus: GridFulfillmentState;
  createdAt: Date;
  updatedAt: Date;
};

async function requirePlatformAdmin(session: ClinicSession) {
  if (!can(session.role, "settings", "manage")) {
    throw new NetworkAccessError("Grid settlement requires owner-level platform permission.", 403);
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
    throw new NetworkAccessError("Grid settlement can only be controlled from the Klinikos platform organization.", 403);
  }
}

function serialize(row: SettlementRow) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    processorVerified: false,
  };
}

export async function transitionGridFinancialObligation(session: ClinicSession, obligationId: string, rawInput: unknown) {
  await requirePlatformAdmin(session);
  const input = gridObligationTransitionSchema.parse(rawInput);

  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<SettlementRow[]>(Prisma.sql`
      SELECT f."id", f."organizationId", f."reservationId", f."obligationType", f."beneficiaryType",
             f."beneficiaryReference", f."amountCents", f."status", f."externalReference",
             r."fulfillmentStatus", f."createdAt", f."updatedAt"
      FROM "GridFinancialObligationRecord" f
      JOIN "GridReservationRecord" r ON r."id" = f."reservationId"
      WHERE f."id" = ${obligationId}
      FOR UPDATE OF f
    `);
    const obligation = rows[0];
    if (!obligation) throw new NetworkAccessError("Grid financial obligation not found.", 404);

    if (!canTransitionGridSettlement(obligation.status, input.targetStatus)) {
      throw new NetworkAccessError(
        `Grid obligation cannot move from ${obligation.status} to ${input.targetStatus}.`,
        409,
      );
    }

    if (["payable", "processing", "settled"].includes(input.targetStatus) && obligation.fulfillmentStatus !== "fulfilled") {
      throw new NetworkAccessError("A Grid obligation cannot become payable or settle before fulfillment is complete.", 409);
    }

    if (input.targetStatus === "settled" && !payoutCanSettle({
      fulfillmentState: obligation.fulfillmentStatus,
      externalReference: input.externalReference,
      disputed: obligation.status === "disputed",
    })) {
      throw new NetworkAccessError("Settlement requires fulfilled work, no active dispute, and a real external reference.", 409);
    }

    const nextReference = input.externalReference ?? obligation.externalReference;
    const updatedRows = await tx.$queryRaw<SettlementRow[]>(Prisma.sql`
      UPDATE "GridFinancialObligationRecord" f
      SET "status" = ${input.targetStatus},
          "externalReference" = ${nextReference ?? null},
          "updatedAt" = CURRENT_TIMESTAMP
      FROM "GridReservationRecord" r
      WHERE f."id" = ${obligation.id} AND r."id" = f."reservationId"
      RETURNING f."id", f."organizationId", f."reservationId", f."obligationType", f."beneficiaryType",
                f."beneficiaryReference", f."amountCents", f."status", f."externalReference",
                r."fulfillmentStatus", f."createdAt", f."updatedAt"
    `);
    const updated = updatedRows[0];
    if (!updated) throw new NetworkAccessError("Grid settlement transition could not be recorded.", 500);

    const metadata = JSON.stringify({
      obligationType: obligation.obligationType,
      beneficiaryType: obligation.beneficiaryType,
      beneficiaryReference: obligation.beneficiaryReference,
      amountCents: obligation.amountCents,
      processorVerified: false,
      manualReconciliation: true,
    });
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "GridSettlementEventRecord" (
        "id", "organizationId", "obligationId", "actorId", "action", "fromStatus", "toStatus",
        "externalReference", "note", "metadata", "createdAt"
      ) VALUES (
        ${randomUUID()}, ${obligation.organizationId}, ${obligation.id}, ${session.userId},
        ${`grid.settlement.${input.targetStatus}`}, ${obligation.status}, ${input.targetStatus},
        ${nextReference ?? null}, ${input.note}, CAST(${metadata} AS JSONB), CURRENT_TIMESTAMP
      )
    `);

    await tx.auditLog.create({
      data: {
        organizationId: session.organizationId,
        actorId: session.userId,
        actorType: "user",
        action: `grid.settlement_${input.targetStatus}`,
        resourceType: "grid_financial_obligation",
        resourceId: obligation.id,
        metadata: {
          ownerOrganizationId: obligation.organizationId,
          reservationId: obligation.reservationId,
          obligationType: obligation.obligationType,
          amountCents: obligation.amountCents,
          fromStatus: obligation.status,
          toStatus: input.targetStatus,
          externalReference: nextReference ?? null,
          processorVerified: false,
          manualReconciliation: true,
          note: input.note,
        },
      },
    });

    return serialize(updated);
  });
}
