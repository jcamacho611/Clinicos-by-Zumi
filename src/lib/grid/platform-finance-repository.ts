import "server-only";

import { Prisma } from "@prisma/client";
import type { ClinicSession } from "@/lib/auth/types";
import { can } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

type PolicyRow = {
  id: string;
  scopeKind: string;
  scopeValue: string | null;
  platformFeeBps: number;
  platformFeeFlatCents: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type FinanceLineRow = {
  id: string;
  organizationId: string;
  ownerName: string;
  reservationId: string;
  demandTitle: string;
  obligationType: string;
  beneficiaryType: string;
  beneficiaryReference: string | null;
  beneficiaryName: string | null;
  amountCents: number;
  status: string;
  externalReference: string | null;
  fulfillmentStatus: string;
  grossAmountCents: number;
  updatedAt: Date;
};

async function requirePlatformFinance(session: ClinicSession) {
  if (!can(session.role, "settings", "manage")) throw new NetworkAccessError("Platform finance requires owner-level settings permission.", 403);
  const organization = await db.organization.findUnique({ where: { id: session.organizationId }, select: { slug: true, name: true, status: true } });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  const platformSlug = process.env.KLINIKOS_PLATFORM_ORGANIZATION_SLUG ?? process.env.CLINICOS_SALES_ORGANIZATION_SLUG ?? "clinicos-by-zumi";
  if (organization.slug !== platformSlug) throw new NetworkAccessError("This finance console is restricted to the Klinikos platform organization.", 403);
  return organization;
}

export async function getGridPlatformFinanceBoard(session: ClinicSession) {
  const platform = await requirePlatformFinance(session);
  const [policies, obligations] = await Promise.all([
    db.$queryRaw<PolicyRow[]>(Prisma.sql`
      SELECT "id", "scopeKind", "scopeValue", "platformFeeBps", "platformFeeFlatCents", "status", "createdAt", "updatedAt"
      FROM "GridFeePolicyRecord"
      ORDER BY CASE WHEN "status" = 'active' THEN 0 ELSE 1 END, "scopeKind", "scopeValue", "updatedAt" DESC
    `),
    db.$queryRaw<FinanceLineRow[]>(Prisma.sql`
      SELECT f."id", f."organizationId", owner."name" AS "ownerName", f."reservationId", d."title" AS "demandTitle",
             f."obligationType", f."beneficiaryType", f."beneficiaryReference", beneficiary."name" AS "beneficiaryName",
             f."amountCents", f."status", f."externalReference", r."fulfillmentStatus", r."grossAmountCents", f."updatedAt"
      FROM "GridFinancialObligationRecord" f
      JOIN "GridReservationRecord" r ON r."id" = f."reservationId"
      JOIN "GridDemandRecord" d ON d."id" = r."demandId"
      JOIN "organizations" owner ON owner."id" = f."organizationId"
      LEFT JOIN "organizations" beneficiary ON f."beneficiaryType" = 'organization' AND beneficiary."id" = f."beneficiaryReference"
      ORDER BY f."updatedAt" DESC
      LIMIT 500
    `),
  ]);

  const sum = (filter: (line: FinanceLineRow) => boolean) => obligations.filter(filter).reduce((total, line) => total + line.amountCents, 0);

  return {
    platformName: platform.name,
    metrics: {
      unsettledCents: sum((line) => line.status !== "settled" && line.status !== "reversed"),
      pendingPlatformFeesCents: sum((line) => line.obligationType === "platform_fee" && line.status !== "settled" && line.status !== "reversed"),
      settledPlatformFeesCents: sum((line) => line.obligationType === "platform_fee" && line.status === "settled"),
      payableSupplyCents: sum((line) => ["supply_payable", "location_payable"].includes(line.obligationType) && !["settled", "reversed"].includes(line.status)),
      activePolicies: policies.filter((policy) => policy.status === "active").length,
    },
    policies: policies.map((policy) => ({ ...policy, createdAt: policy.createdAt.toISOString(), updatedAt: policy.updatedAt.toISOString() })),
    obligations: obligations.map((line) => ({ ...line, updatedAt: line.updatedAt.toISOString() })),
  };
}

export type GridPlatformFinanceBoard = Awaited<ReturnType<typeof getGridPlatformFinanceBoard>>;
