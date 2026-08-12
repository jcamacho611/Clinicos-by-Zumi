import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  allocateFundedUsage,
  evaluateCustomerFundedAccess,
  type CommercialCostBucket,
  type FundingAllocation,
} from "@/lib/commercial/customer-funded-access";

export class CommercialFundingError extends Error {
  constructor(
    message: string,
    public readonly reason: "payment_required" | "upgrade_required" | "funds_required" | "policy_blocked" | "invalid_state",
    public readonly status: 400 | 402 | 403 | 404 | 409 | 500 = 402,
    public readonly shortfallCents?: number,
  ) {
    super(message);
    this.name = "CommercialFundingError";
  }
}

type OrganizationRow = { id: string; status: string; demoMode: boolean };
type SubscriptionRow = {
  id: string;
  status: string;
  modules: string[];
  currentPeriodEndsAt: Date | null;
  paymentConfirmedAt: Date | null;
};
type FundingRow = {
  organizationId: string;
  prepaidBalanceCents: number;
  prepaidReservedCents: number;
  authorizedOverageLimitCents: number;
  authorizedOverageConsumedCents: number;
  authorizedOverageReservedCents: number;
  blockedAt: Date | null;
  blockReason: string | null;
};
type AllowanceRow = {
  id: string;
  organizationId: string;
  billingPeriodKey: string;
  bucket: string;
  includedBudgetCents: number;
  includedConsumedCents: number;
  includedReservedCents: number;
  hardLimitCents: number | null;
  periodStartsAt: Date;
  periodEndsAt: Date;
};
type ReservationRow = {
  id: string;
  organizationId: string;
  billingPeriodKey: string;
  bucket: string;
  capability: string;
  idempotencyKey: string;
  provider: string | null;
  service: string | null;
  estimatedCostCents: number;
  includedReservedCents: number;
  prepaidReservedCents: number;
  overageReservedCents: number;
  actualCostCents: number | null;
  unfundedOverrunCents: number;
  status: string;
};

export type CommercialUsageReservation = {
  reservationId: string | null;
  mode: "synthetic_demo" | "subscription" | "funded_usage";
  estimatedCostCents: number;
  allocations: FundingAllocation[];
  idempotent: boolean;
};

function cents(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new CommercialFundingError("Commercial usage cost must be finite and non-negative.", "invalid_state", 400);
  }
  return Math.ceil(value);
}

function allocationAmount(allocations: FundingAllocation[], source: FundingAllocation["source"]) {
  return allocations.find((allocation) => allocation.source === source)?.amountCents ?? 0;
}

async function lockOrganization(tx: Prisma.TransactionClient, organizationId: string) {
  const rows = await tx.$queryRaw<OrganizationRow[]>(Prisma.sql`
    SELECT "id", "status", "demoMode"
    FROM "Organization"
    WHERE "id" = ${organizationId}
    FOR SHARE
  `);
  const organization = rows[0];
  if (!organization || organization.status !== "active") {
    throw new CommercialFundingError("Organization is not active.", "invalid_state", 404);
  }
  return organization;
}

async function lockSubscription(tx: Prisma.TransactionClient, organizationId: string) {
  const rows = await tx.$queryRaw<SubscriptionRow[]>(Prisma.sql`
    SELECT "id", "status", "modules", "currentPeriodEndsAt", "paymentConfirmedAt"
    FROM "subscriptions"
    WHERE "organizationId" = ${organizationId}
      AND "status" = 'active'
      AND "paymentConfirmedAt" IS NOT NULL
      AND ("currentPeriodEndsAt" IS NULL OR "currentPeriodEndsAt" > CURRENT_TIMESTAMP)
    ORDER BY "createdAt" DESC
    LIMIT 1
    FOR UPDATE
  `);
  return rows[0] ?? null;
}

async function lockFundingAccount(tx: Prisma.TransactionClient, organizationId: string) {
  await tx.$executeRaw(Prisma.sql`
    INSERT INTO "commercial_funding_accounts" ("organizationId")
    VALUES (${organizationId})
    ON CONFLICT ("organizationId") DO NOTHING
  `);
  const rows = await tx.$queryRaw<FundingRow[]>(Prisma.sql`
    SELECT "organizationId", "prepaidBalanceCents", "prepaidReservedCents",
           "authorizedOverageLimitCents", "authorizedOverageConsumedCents", "authorizedOverageReservedCents",
           "blockedAt", "blockReason"
    FROM "commercial_funding_accounts"
    WHERE "organizationId" = ${organizationId}
    FOR UPDATE
  `);
  const account = rows[0];
  if (!account) throw new CommercialFundingError("Funding account could not be initialized.", "invalid_state", 500);
  return account;
}

async function lockAllowance(tx: Prisma.TransactionClient, organizationId: string, bucket: CommercialCostBucket) {
  const rows = await tx.$queryRaw<AllowanceRow[]>(Prisma.sql`
    SELECT "id", "organizationId", "billingPeriodKey", "bucket", "includedBudgetCents",
           "includedConsumedCents", "includedReservedCents", "hardLimitCents", "periodStartsAt", "periodEndsAt"
    FROM "commercial_usage_allowances"
    WHERE "organizationId" = ${organizationId}
      AND "bucket" = ${bucket}
      AND "periodStartsAt" <= CURRENT_TIMESTAMP
      AND "periodEndsAt" > CURRENT_TIMESTAMP
    ORDER BY "periodStartsAt" DESC
    LIMIT 1
    FOR UPDATE
  `);
  return rows[0] ?? null;
}

async function findReservation(tx: Prisma.TransactionClient, organizationId: string, idempotencyKey: string) {
  const rows = await tx.$queryRaw<ReservationRow[]>(Prisma.sql`
    SELECT "id", "organizationId", "billingPeriodKey", "bucket", "capability", "idempotencyKey",
           "provider", "service", "estimatedCostCents", "includedReservedCents", "prepaidReservedCents",
           "overageReservedCents", "actualCostCents", "unfundedOverrunCents", "status"
    FROM "commercial_usage_reservations"
    WHERE "organizationId" = ${organizationId} AND "idempotencyKey" = ${idempotencyKey}
    FOR UPDATE
  `);
  return rows[0] ?? null;
}

function allocationsFromReservation(row: ReservationRow): FundingAllocation[] {
  const allocations: FundingAllocation[] = [];
  if (row.includedReservedCents) allocations.push({ source: "included_allowance", amountCents: row.includedReservedCents });
  if (row.prepaidReservedCents) allocations.push({ source: "prepaid_balance", amountCents: row.prepaidReservedCents });
  if (row.overageReservedCents) allocations.push({ source: "authorized_overage", amountCents: row.overageReservedCents });
  return allocations;
}

export async function reserveCustomerFundedUsage(input: {
  organizationId: string;
  actorId: string | null;
  capability: string;
  requiredEntitlement?: string | null;
  bucket: CommercialCostBucket;
  estimatedCostCents: number;
  idempotencyKey: string;
  provider?: string | null;
  service?: string | null;
  allowSyntheticDemo?: boolean;
  syntheticDataOnly?: boolean;
  policyBlocked?: boolean;
  metadata?: Record<string, unknown>;
}): Promise<CommercialUsageReservation> {
  const estimatedCostCents = cents(input.estimatedCostCents);
  if (!input.idempotencyKey.trim()) {
    throw new CommercialFundingError("Commercial usage requires an idempotency key.", "invalid_state", 400);
  }

  return db.$transaction(async (tx) => {
    const organization = await lockOrganization(tx, input.organizationId);
    const existing = await findReservation(tx, input.organizationId, input.idempotencyKey);
    if (existing) {
      if (existing.capability !== input.capability || existing.bucket !== input.bucket || existing.estimatedCostCents !== estimatedCostCents) {
        throw new CommercialFundingError("Idempotency key is already bound to a different commercial request.", "invalid_state", 409);
      }
      if (existing.status === "released" || existing.status === "expired") {
        throw new CommercialFundingError("This commercial reservation is no longer executable.", "invalid_state", 409);
      }
      return {
        reservationId: existing.id,
        mode: "funded_usage",
        estimatedCostCents: existing.estimatedCostCents,
        allocations: allocationsFromReservation(existing),
        idempotent: true,
      };
    }

    if (organization.demoMode && input.allowSyntheticDemo && input.syntheticDataOnly) {
      const decision = evaluateCustomerFundedAccess(
        {
          subscriptionStatus: "demo",
          paymentConfirmed: false,
          entitlements: [],
          includedAllowanceRemainingCents: 0,
          prepaidBalanceCents: 0,
          authorizedOverageRemainingCents: 0,
          demoMode: true,
          syntheticDataOnly: true,
        },
        {
          capability: input.capability,
          requiredEntitlement: input.requiredEntitlement,
          estimatedVariableCostCents: estimatedCostCents,
          costBucket: input.bucket,
          allowSyntheticDemo: true,
          policyBlocked: input.policyBlocked,
        },
      );
      if (!decision.allowed) {
        throw new CommercialFundingError(decision.message, decision.reason, decision.reason === "policy_blocked" ? 403 : 402, decision.shortfallCents);
      }
      return { reservationId: null, mode: "synthetic_demo", estimatedCostCents: 0, allocations: [], idempotent: false };
    }

    const subscription = await lockSubscription(tx, input.organizationId);
    const funding = await lockFundingAccount(tx, input.organizationId);
    const allowance = await lockAllowance(tx, input.organizationId, input.bucket);

    if (funding.blockedAt) {
      throw new CommercialFundingError(funding.blockReason ?? "Variable-cost usage is held for review.", "funds_required", 402);
    }

    const includedRemaining = allowance
      ? Math.max(0, allowance.includedBudgetCents - allowance.includedConsumedCents - allowance.includedReservedCents)
      : 0;
    const prepaidRemaining = Math.max(0, funding.prepaidBalanceCents - funding.prepaidReservedCents);
    const overageRemaining = Math.max(
      0,
      funding.authorizedOverageLimitCents - funding.authorizedOverageConsumedCents - funding.authorizedOverageReservedCents,
    );

    if (allowance?.hardLimitCents != null && allowance.includedConsumedCents + allowance.includedReservedCents + estimatedCostCents > allowance.hardLimitCents) {
      throw new CommercialFundingError("This request exceeds the organization’s hard usage limit for this service.", "funds_required", 402);
    }

    const decision = evaluateCustomerFundedAccess(
      {
        subscriptionStatus: subscription?.status ?? "unpaid",
        paymentConfirmed: Boolean(subscription?.paymentConfirmedAt),
        entitlements: subscription?.modules ?? [],
        includedAllowanceRemainingCents: includedRemaining,
        prepaidBalanceCents: prepaidRemaining,
        authorizedOverageRemainingCents: overageRemaining,
        demoMode: false,
        syntheticDataOnly: false,
      },
      {
        capability: input.capability,
        requiredEntitlement: input.requiredEntitlement,
        estimatedVariableCostCents: estimatedCostCents,
        costBucket: input.bucket,
        policyBlocked: input.policyBlocked,
      },
    );

    if (!decision.allowed) {
      throw new CommercialFundingError(
        decision.message,
        decision.reason,
        decision.reason === "policy_blocked" || decision.reason === "upgrade_required" ? 403 : 402,
        decision.shortfallCents,
      );
    }

    if (estimatedCostCents === 0) {
      return { reservationId: null, mode: "subscription", estimatedCostCents: 0, allocations: [], idempotent: false };
    }

    const includedReservedCents = allocationAmount(decision.allocations, "included_allowance");
    const prepaidReservedCents = allocationAmount(decision.allocations, "prepaid_balance");
    const overageReservedCents = allocationAmount(decision.allocations, "authorized_overage");
    const reservationId = randomUUID();
    const billingPeriodKey = allowance?.billingPeriodKey ?? `subscription:${subscription?.id ?? "none"}`;

    if (includedReservedCents > 0) {
      if (!allowance) throw new CommercialFundingError("Included allowance disappeared during reservation.", "invalid_state", 409);
      await tx.$executeRaw(Prisma.sql`
        UPDATE "commercial_usage_allowances"
        SET "includedReservedCents" = "includedReservedCents" + ${includedReservedCents}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${allowance.id}
      `);
    }

    await tx.$executeRaw(Prisma.sql`
      UPDATE "commercial_funding_accounts"
      SET "prepaidReservedCents" = "prepaidReservedCents" + ${prepaidReservedCents},
          "authorizedOverageReservedCents" = "authorizedOverageReservedCents" + ${overageReservedCents},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "organizationId" = ${input.organizationId}
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "commercial_usage_reservations" (
        "id", "organizationId", "billingPeriodKey", "bucket", "capability", "idempotencyKey",
        "provider", "service", "estimatedCostCents", "includedReservedCents", "prepaidReservedCents",
        "overageReservedCents", "metadata"
      ) VALUES (
        ${reservationId}, ${input.organizationId}, ${billingPeriodKey}, ${input.bucket}, ${input.capability}, ${input.idempotencyKey},
        ${input.provider ?? null}, ${input.service ?? null}, ${estimatedCostCents}, ${includedReservedCents}, ${prepaidReservedCents},
        ${overageReservedCents}, ${JSON.stringify(input.metadata ?? {})}::jsonb
      )
    `);

    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        actorType: input.actorId ? "user" : "system",
        action: "commercial.usage_reserved",
        resourceType: "commercial_usage_reservation",
        resourceId: reservationId,
        metadata: {
          capability: input.capability,
          bucket: input.bucket,
          provider: input.provider ?? null,
          estimatedCostCents,
          allocations: decision.allocations,
          customerFundedBeforeExecution: true,
        },
      },
    });

    return {
      reservationId,
      mode: "funded_usage",
      estimatedCostCents,
      allocations: decision.allocations,
      idempotent: false,
    };
  });
}

function consumeReserved(row: ReservationRow, actualCostCents: number) {
  let remaining = actualCostCents;
  const included = Math.min(row.includedReservedCents, remaining);
  remaining -= included;
  const prepaid = Math.min(row.prepaidReservedCents, remaining);
  remaining -= prepaid;
  const overage = Math.min(row.overageReservedCents, remaining);
  remaining -= overage;
  return { included, prepaid, overage, overrun: remaining };
}

export async function settleCustomerFundedUsage(input: {
  organizationId: string;
  actorId: string | null;
  reservationId: string;
  actualCostCents: number;
  metadata?: Record<string, unknown>;
}) {
  const actualCostCents = cents(input.actualCostCents);
  return db.$transaction(async (tx) => {
    await lockOrganization(tx, input.organizationId);
    const rows = await tx.$queryRaw<ReservationRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "billingPeriodKey", "bucket", "capability", "idempotencyKey",
             "provider", "service", "estimatedCostCents", "includedReservedCents", "prepaidReservedCents",
             "overageReservedCents", "actualCostCents", "unfundedOverrunCents", "status"
      FROM "commercial_usage_reservations"
      WHERE "id" = ${input.reservationId} AND "organizationId" = ${input.organizationId}
      FOR UPDATE
    `);
    const reservation = rows[0];
    if (!reservation) throw new CommercialFundingError("Commercial usage reservation was not found.", "invalid_state", 404);
    if (reservation.status === "settled" || reservation.status === "settled_with_overrun") return true;
    if (reservation.status !== "reserved") throw new CommercialFundingError("Commercial usage reservation is not open.", "invalid_state", 409);

    const funding = await lockFundingAccount(tx, input.organizationId);
    const allowanceRows = await tx.$queryRaw<AllowanceRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "billingPeriodKey", "bucket", "includedBudgetCents",
             "includedConsumedCents", "includedReservedCents", "hardLimitCents", "periodStartsAt", "periodEndsAt"
      FROM "commercial_usage_allowances"
      WHERE "organizationId" = ${input.organizationId}
        AND "billingPeriodKey" = ${reservation.billingPeriodKey}
        AND "bucket" = ${reservation.bucket}
      FOR UPDATE
    `);
    const allowance = allowanceRows[0] ?? null;
    const used = consumeReserved(reservation, actualCostCents);
    const fundedCostCents = actualCostCents - used.overrun;

    if (allowance) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "commercial_usage_allowances"
        SET "includedReservedCents" = GREATEST(0, "includedReservedCents" - ${reservation.includedReservedCents}),
            "includedConsumedCents" = "includedConsumedCents" + ${used.included},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${allowance.id}
      `);
    } else if (reservation.includedReservedCents > 0) {
      throw new CommercialFundingError("The allowance backing this reservation is missing.", "invalid_state", 500);
    }

    await tx.$executeRaw(Prisma.sql`
      UPDATE "commercial_funding_accounts"
      SET "prepaidReservedCents" = GREATEST(0, "prepaidReservedCents" - ${reservation.prepaidReservedCents}),
          "prepaidBalanceCents" = GREATEST(0, "prepaidBalanceCents" - ${used.prepaid}),
          "authorizedOverageReservedCents" = GREATEST(0, "authorizedOverageReservedCents" - ${reservation.overageReservedCents}),
          "authorizedOverageConsumedCents" = "authorizedOverageConsumedCents" + ${used.overage},
          "blockedAt" = CASE WHEN ${used.overrun} > 0 THEN CURRENT_TIMESTAMP ELSE "blockedAt" END,
          "blockReason" = CASE WHEN ${used.overrun} > 0 THEN 'Actual vendor cost exceeded the customer-funded reservation; review required before more variable-cost execution.' ELSE "blockReason" END,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "organizationId" = ${input.organizationId}
    `);

    const status = used.overrun > 0 ? "settled_with_overrun" : "settled";
    await tx.$executeRaw(Prisma.sql`
      UPDATE "commercial_usage_reservations"
      SET "actualCostCents" = ${actualCostCents}, "unfundedOverrunCents" = ${used.overrun},
          "status" = ${status}, "settledAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${reservation.id}
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "commercial_usage_entries" (
        "id", "reservationId", "organizationId", "bucket", "capability", "provider", "service",
        "actualCostCents", "fundedCostCents", "unfundedOverrunCents", "metadata"
      ) VALUES (
        ${randomUUID()}, ${reservation.id}, ${input.organizationId}, ${reservation.bucket}, ${reservation.capability},
        ${reservation.provider}, ${reservation.service}, ${actualCostCents}, ${fundedCostCents}, ${used.overrun},
        ${JSON.stringify(input.metadata ?? {})}::jsonb
      ) ON CONFLICT ("reservationId") DO NOTHING
    `);

    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        actorType: input.actorId ? "user" : "system",
        action: "commercial.usage_settled",
        resourceType: "commercial_usage_reservation",
        resourceId: reservation.id,
        metadata: {
          actualCostCents,
          fundedCostCents,
          unfundedOverrunCents: used.overrun,
          accountBlocked: used.overrun > 0 || Boolean(funding.blockedAt),
        },
      },
    });
    return true;
  });
}

export async function releaseCustomerFundedUsage(input: {
  organizationId: string;
  actorId: string | null;
  reservationId: string;
  reason: string;
}) {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ReservationRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "billingPeriodKey", "bucket", "capability", "idempotencyKey",
             "provider", "service", "estimatedCostCents", "includedReservedCents", "prepaidReservedCents",
             "overageReservedCents", "actualCostCents", "unfundedOverrunCents", "status"
      FROM "commercial_usage_reservations"
      WHERE "id" = ${input.reservationId} AND "organizationId" = ${input.organizationId}
      FOR UPDATE
    `);
    const reservation = rows[0];
    if (!reservation) return false;
    if (reservation.status === "released" || reservation.status === "expired") return true;
    if (reservation.status !== "reserved") return false;

    const allowanceRows = await tx.$queryRaw<AllowanceRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "billingPeriodKey", "bucket", "includedBudgetCents",
             "includedConsumedCents", "includedReservedCents", "hardLimitCents", "periodStartsAt", "periodEndsAt"
      FROM "commercial_usage_allowances"
      WHERE "organizationId" = ${input.organizationId}
        AND "billingPeriodKey" = ${reservation.billingPeriodKey}
        AND "bucket" = ${reservation.bucket}
      FOR UPDATE
    `);
    const allowance = allowanceRows[0] ?? null;
    await lockFundingAccount(tx, input.organizationId);

    if (allowance && reservation.includedReservedCents > 0) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "commercial_usage_allowances"
        SET "includedReservedCents" = GREATEST(0, "includedReservedCents" - ${reservation.includedReservedCents}), "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${allowance.id}
      `);
    }

    await tx.$executeRaw(Prisma.sql`
      UPDATE "commercial_funding_accounts"
      SET "prepaidReservedCents" = GREATEST(0, "prepaidReservedCents" - ${reservation.prepaidReservedCents}),
          "authorizedOverageReservedCents" = GREATEST(0, "authorizedOverageReservedCents" - ${reservation.overageReservedCents}),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "organizationId" = ${input.organizationId}
    `);

    await tx.$executeRaw(Prisma.sql`
      UPDATE "commercial_usage_reservations"
      SET "status" = 'released', "releasedAt" = CURRENT_TIMESTAMP,
          "metadata" = "metadata" || ${JSON.stringify({ releaseReason: input.reason })}::jsonb
      WHERE "id" = ${reservation.id}
    `);

    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        actorType: input.actorId ? "user" : "system",
        action: "commercial.usage_released",
        resourceType: "commercial_usage_reservation",
        resourceId: reservation.id,
        metadata: { reason: input.reason },
      },
    });
    return true;
  });
}

export async function creditCommercialPrepaidBalance(input: {
  organizationId: string;
  actorId: string;
  amountCents: number;
  paymentEvidenceId: string;
}) {
  const amountCents = cents(input.amountCents);
  if (amountCents <= 0) throw new CommercialFundingError("Prepaid credit must be greater than zero.", "invalid_state", 400);

  return db.$transaction(async (tx) => {
    const evidence = await tx.$queryRaw<Array<{ verified: boolean; processingStatus: string }>>(Prisma.sql`
      SELECT "verified", "processingStatus"
      FROM "commercial_payment_events"
      WHERE "id" = ${input.paymentEvidenceId} AND "organizationId" = ${input.organizationId}
      FOR SHARE
    `);
    if (!evidence[0]?.verified || evidence[0].processingStatus !== "applied") {
      throw new CommercialFundingError("Prepaid balance requires applied verified payment evidence.", "payment_required", 409);
    }

    await lockFundingAccount(tx, input.organizationId);
    await tx.$executeRaw(Prisma.sql`
      UPDATE "commercial_funding_accounts"
      SET "prepaidBalanceCents" = "prepaidBalanceCents" + ${amountCents}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "organizationId" = ${input.organizationId}
    `);

    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        actorType: "user",
        action: "commercial.prepaid_balance_credited",
        resourceType: "commercial_funding_account",
        resourceId: input.organizationId,
        metadata: { amountCents, paymentEvidenceId: input.paymentEvidenceId },
      },
    });
    return true;
  });
}
