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

export class CommercialAccessError extends Error {
  constructor(
    message: string,
    public readonly reason: "policy_blocked" | "payment_required" | "upgrade_required" | "funds_required" | "account_blocked" | "invalid_state",
    public readonly status = 402,
    public readonly shortfallCents?: number,
  ) {
    super(message);
    this.name = "CommercialAccessError";
  }
}

type OrganizationRow = { id: string; demoMode: boolean; status: string };
type SubscriptionRow = {
  id: string;
  status: string;
  modules: string[];
  currentPeriodEndsAt: Date | null;
  paymentConfirmedAt: Date | null;
};
type FundingAccountRow = {
  organizationId: string;
  currency: string;
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
  status: "reserved" | "settled" | "released" | "expired" | "settled_with_overrun";
  createdAt: Date;
  settledAt: Date | null;
  releasedAt: Date | null;
};

type UsageEntryRow = {
  id: string;
  reservationId: string;
  organizationId: string;
  bucket: string;
  capability: string;
  provider: string | null;
  service: string | null;
  actualCostCents: number;
  fundedCostCents: number;
  unfundedOverrunCents: number;
  createdAt: Date;
};

export type ReserveCommercialUsageInput = {
  organizationId: string;
  actorId: string;
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
};

export type CommercialUsageReservation = {
  reservationId: string | null;
  mode: "synthetic_demo" | "subscription" | "funded_usage";
  estimatedCostCents: number;
  allocations: FundingAllocation[];
  idempotent: boolean;
};

function cents(value: number) {
  if (!Number.isFinite(value) || value < 0) throw new CommercialAccessError("Commercial usage cost must be a finite non-negative amount.", "invalid_state", 400);
  return Math.ceil(value);
}

function monthKey(at = new Date()) {
  return `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}`;
}

function allocationAmount(allocations: FundingAllocation[], source: FundingAllocation["source"]) {
  return allocations.find((allocation) => allocation.source === source)?.amountCents ?? 0;
}

async function lockOrganization(tx: Prisma.TransactionClient, organizationId: string) {
  const rows = await tx.$queryRaw<OrganizationRow[]>(Prisma.sql`
    SELECT "id", "demoMode", "status"
    FROM "Organization"
    WHERE "id" = ${organizationId}
    FOR SHARE
  `);
  const organization = rows[0];
  if (!organization || organization.status !== "active") {
    throw new CommercialAccessError("Organization is not active.", "invalid_state", 404);
  }
  return organization;
}

async function lockPaidSubscription(tx: Prisma.TransactionClient, organizationId: string) {
  const rows = await tx.$queryRaw<SubscriptionRow[]>(Prisma.sql`
    SELECT "id", "status", "modules", "currentPeriodEndsAt", "paymentConfirmedAt"
    FROM "subscriptions"
    WHERE "organizationId" = ${organizationId}
      AND "status" = 'active'
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
  const rows = await tx.$queryRaw<FundingAccountRow[]>(Prisma.sql`
    SELECT "organizationId", "currency", "prepaidBalanceCents", "prepaidReservedCents",
           "authorizedOverageLimitCents", "authorizedOverageConsumedCents", "authorizedOverageReservedCents",
           "blockedAt", "blockReason"
    FROM "commercial_funding_accounts"
    WHERE "organizationId" = ${organizationId}
    FOR UPDATE
  `);
  const account = rows[0];
  if (!account) throw new CommercialAccessError("Commercial funding account could not be initialized.", "invalid_state", 500);
  return account;
}

async function lockCurrentAllowance(tx: Prisma.TransactionClient, organizationId: string, bucket: CommercialCostBucket) {
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

async function findExistingReservation(tx: Prisma.TransactionClient, organizationId: string, idempotencyKey: string) {
  const rows = await tx.$queryRaw<ReservationRow[]>(Prisma.sql`
    SELECT "id", "organizationId", "billingPeriodKey", "bucket", "capability", "idempotencyKey",
           "provider", "service", "estimatedCostCents", "includedReservedCents", "prepaidReservedCents",
           "overageReservedCents", "actualCostCents", "unfundedOverrunCents", "status", "createdAt", "settledAt", "releasedAt"
    FROM "commercial_usage_reservations"
    WHERE "organizationId" = ${organizationId} AND "idempotencyKey" = ${idempotencyKey}
    FOR UPDATE
  `);
  return rows[0] ?? null;
}

function reservationAllocations(row: ReservationRow): FundingAllocation[] {
  const allocations: FundingAllocation[] = [];
  if (row.includedReservedCents > 0) allocations.push({ source: "included_allowance", amountCents: row.includedReservedCents });
  if (row.prepaidReservedCents > 0) allocations.push({ source: "prepaid_balance", amountCents: row.prepaidReservedCents });
  if (row.overageReservedCents > 0) allocations.push({ source: "authorized_overage", amountCents: row.overageReservedCents });
  return allocations;
}

/**
 * Reserves customer-backed money before a variable-cost provider call.
 *
 * This function owns tenant selection: organizationId must come from a server
 * session/job, never model output or browser-supplied organization context.
 */
export async function reserveCustomerFundedUsage(input: ReserveCommercialUsageInput): Promise<CommercialUsageReservation> {
  const estimatedCostCents = cents(input.estimatedCostCents);
  if (!input.idempotencyKey.trim()) throw new CommercialAccessError("Commercial usage requires an idempotency key.", "invalid_state", 400);

  return db.$transaction(async (tx) => {
    const organization = await lockOrganization(tx, input.organizationId);
    const existing = await findExistingReservation(tx, input.organizationId, input.idempotencyKey);
    if (existing) {
      if (existing.capability !== input.capability || existing.bucket !== input.bucket || existing.estimatedCostCents !== estimatedCostCents) {
        throw new CommercialAccessError("Idempotency key was already used for a different commercial request.", "invalid_state", 409);
      }
      if (existing.status === "released" || existing.status === "expired") {
        throw new CommercialAccessError("This commercial reservation is no longer executable.", "invalid_state", 409);
      }
      return {
        reservationId: existing.id,
        mode: "funded_usage" as const,
        estimatedCostCents: existing.estimatedCostCents,
        allocations: reservationAllocations(existing),
        idempotent: true,
      };
    }

    if (organization.demoMode && input.syntheticDataOnly && input.allowSyntheticDemo) {
      const demoDecision = evaluateCustomerFundedAccess(
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
      if (!demoDecision.allowed) throw new CommercialAccessError(demoDecision.message, demoDecision.reason, demoDecision.reason === "policy_blocked" ? 403 : 402, demoDecision.shortfallCents);
      return { reservationId: null, mode: "synthetic_demo", estimatedCostCents: 0, allocations: [], idempotent: false };
    }

    const subscription = await lockPaidSubscription(tx, input.organizationId);
    const account = await lockFundingAccount(tx, input.organizationId);
    const allowance = await lockCurrentAllowance(tx, input.organizationId, input.bucket);

    if (account.blockedAt) {
      throw new CommercialAccessError(account.blockReason ?? "Commercial usage is temporarily blocked pending review.", "account_blocked", 402);
    }

    const includedRemaining = allowance
      ? Math.max(0, allowance.includedBudgetCents - allowance.includedConsumedCents - allowance.includedReservedCents)
      : 0;
    const prepaidRemaining = Math.max(0, account.prepaidBalanceCents - account.prepaidReservedCents);
    const overageRemaining = Math.max(
      0,
      account.authorizedOverageLimitCents - account.authorizedOverageConsumedCents - account.authorizedOverageReservedCents,
    );

    if (allowance?.hardLimitCents != null && allowance.includedConsumedCents + allowance.includedReservedCents + estimatedCostCents > allowance.hardLimitCents) {
      throw new CommercialAccessError("This request would exceed the organization’s hard usage limit for this service.", "funds_required", 402);
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
      throw new CommercialAccessError(
        decision.message,
        decision.reason,
        decision.reason === "policy_blocked" ? 403 : decision.reason === "upgrade_required" ? 403 : 402,
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
    const billingPeriodKey = allowance?.billingPeriodKey ?? `subscription:${subscription?.id ?? "none"}:${monthKey()}`;

    if (includedReservedCents > 0) {
      if (!allowance) throw new CommercialAccessError("Included allowance disappeared during reservation.", "invalid_state", 409);
      await tx.$executeRaw(Prisma.sql`
        UPDATE "commercial_usage_allowances"
        SET "includedReservedCents" = "includedReservedCents" + ${includedReservedCents}, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${allowance.id}
      `);
    }
    if (prepaidReservedCents > 0 || overageReservedCents > 0) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "commercial_funding_accounts"
        SET "prepaidReservedCents" = "prepaidReservedCents" + ${prepaidReservedCents},
            "authorizedOverageReservedCents" = "authorizedOverageReservedCents" + ${overageReservedCents},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "organizationId" = ${input.organizationId}
      `);
    }

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
        actorType: "system",
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

    return { reservationId, mode: "funded_usage", estimatedCostCents, allocations: decision.allocations, idempotent: false };
  });
}

function consumeReservedSources(row: ReservationRow, actualCostCents: number) {
  let remaining = actualCostCents;
  const included = Math.min(row.includedReservedCents, remaining);
  remaining -= included;
  const prepaid = Math.min(row.prepaidReservedCents, remaining);
  remaining -= prepaid;
  const overage = Math.min(row.overageReservedCents, remaining);
  remaining -= overage;
  return { included, prepaid, overage, remaining };
}

export async function settleCustomerFundedUsage(
  organizationId: string,
  actorId: string,
  reservationId: string,
  actualCostCentsInput: number,
  metadata: Record<string, unknown> = {},
) {
  const actualCostCents = cents(actualCostCentsInput);
  return db.$transaction(async (tx) => {
    await lockOrganization(tx, organizationId);
    const rows = await tx.$queryRaw<ReservationRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "billingPeriodKey", "bucket", "capability", "idempotencyKey",
             "provider", "service", "estimatedCostCents", "includedReservedCents", "prepaidReservedCents",
             "overageReservedCents", "actualCostCents", "unfundedOverrunCents", "status", "createdAt", "settledAt", "releasedAt"
      FROM "commercial_usage_reservations"
      WHERE "id" = ${reservationId} AND "organizationId" = ${organizationId}
      FOR UPDATE
    `);
    const reservation = rows[0];
    if (!reservation) throw new CommercialAccessError("Commercial usage reservation not found.", "invalid_state", 404);

    if (reservation.status === "settled" || reservation.status === "settled_with_overrun") {
      const entries = await tx.$queryRaw<UsageEntryRow[]>(Prisma.sql`
        SELECT "id", "reservationId", "organizationId", "bucket", "capability", "provider", "service",
               "actualCostCents", "fundedCostCents", "unfundedOverrunCents", "createdAt"
        FROM "commercial_usage_entries" WHERE "reservationId" = ${reservation.id}
      `);
      return entries[0] ?? null;
    }
    if (reservation.status !== "reserved") throw new CommercialAccessError("Commercial usage reservation is not executable.", "invalid_state", 409);

    const account = await lockFundingAccount(tx, organizationId);
    const allowanceRows = await tx.$queryRaw<AllowanceRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "billingPeriodKey", "bucket", "includedBudgetCents", "includedConsumedCents",
             "includedReservedCents", "hardLimitCents", "periodStartsAt", "periodEndsAt"
      FROM "commercial_usage_allowances"
      WHERE "organizationId" = ${organizationId} AND "billingPeriodKey" = ${reservation.billingPeriodKey} AND "bucket" = ${reservation.bucket}
      FOR UPDATE
    `);
    const allowance = allowanceRows[0] ?? null;

    const reservedUse = consumeReservedSources(reservation, actualCostCents);
    let includedUsed = reservedUse.included;
    let prepaidUsed = reservedUse.prepaid;
    let overageUsed = reservedUse.overage;
    let remaining = reservedUse.remaining;

    if (remaining > 0) {
      const extraFunding = allocateFundedUsage(remaining, {
        includedAllowanceRemainingCents: allowance
          ? Math.max(0, allowance.includedBudgetCents - allowance.includedConsumedCents - allowance.includedReservedCents)
          : 0,
        prepaidBalanceCents: Math.max(0, account.prepaidBalanceCents - account.prepaidReservedCents),
        authorizedOverageRemainingCents: Math.max(
          0,
          account.authorizedOverageLimitCents - account.authorizedOverageConsumedCents - account.authorizedOverageReservedCents,
        ),
      });
      includedUsed += allocationAmount(extraFunding.allocations, "included_allowance");
      prepaidUsed += allocationAmount(extraFunding.allocations, "prepaid_balance");
      overageUsed += allocationAmount(extraFunding.allocations, "authorized_overage");
      remaining = extraFunding.shortfallCents;
    }

    const fundedCostCents = actualCostCents - remaining;
    const unfundedOverrunCents = remaining;

    if (allowance) {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "commercial_usage_allowances"
        SET "includedReservedCents" = GREATEST(0, "includedReservedCents" - ${reservation.includedReservedCents}),
            "includedConsumedCents" = "includedConsumedCents" + ${includedUsed},
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = ${allowance.id}
      `);
    } else if (includedUsed > 0 || reservation.includedReservedCents > 0) {
      throw new CommercialAccessError("The included allowance backing this reservation is missing.", "invalid_state", 500);
    }

    await tx.$executeRaw(Prisma.sql`
      UPDATE "commercial_funding_accounts"
      SET "prepaidReservedCents" = GREATEST(0, "prepaidReservedCents" - ${reservation.prepaidReservedCents}),
          "prepaidBalanceCents" = GREATEST(0, "prepaidBalanceCents" - ${prepaidUsed}),
          "authorizedOverageReservedCents" = GREATEST(0, "authorizedOverageReservedCents" - ${reservation.overageReservedCents}),
          "authorizedOverageConsumedCents" = "authorizedOverageConsumedCents" + ${overageUsed},
          "blockedAt" = CASE WHEN ${unfundedOverrunCents} > 0 THEN CURRENT_TIMESTAMP ELSE "blockedAt" END,
          "blockReason" = CASE WHEN ${unfundedOverrunCents} > 0 THEN 'Vendor usage exceeded the customer-funded reservation; review required before further variable-cost execution.' ELSE "blockReason" END,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "organizationId" = ${organizationId}
    `);

    const status = unfundedOverrunCents > 0 ? "settled_with_overrun" : "settled";
    await tx.$executeRaw(Prisma.sql`
      UPDATE "commercial_usage_reservations"
      SET "actualCostCents" = ${actualCostCents},
          "unfundedOverrunCents" = ${unfundedOverrunCents},
          "status" = ${status},
          "settledAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${reservation.id}
    `);

    const usageEntryId = randomUUID();
    const entries = await tx.$queryRaw<UsageEntryRow[]>(Prisma.sql`
      INSERT INTO "commercial_usage_entries" (
        "id", "reservationId", "organizationId", "bucket", "capability", "provider", "service",
        "actualCostCents", "fundedCostCents", "unfundedOverrunCents", "metadata"
      ) VALUES (
        ${usageEntryId}, ${reservation.id}, ${organizationId}, ${reservation.bucket}, ${reservation.capability},
        ${reservation.provider}, ${reservation.service}, ${actualCostCents}, ${fundedCostCents}, ${unfundedOverrunCents},
        ${JSON.stringify(metadata)}::jsonb
      )
      RETURNING "id", "reservationId", "organizationId", "bucket", "capability", "provider", "service",
                "actualCostCents", "fundedCostCents", "unfundedOverrunCents", "createdAt"
    `);

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId,
        actorType: "system",
        action: "commercial.usage_settled",
        resourceType: "commercial_usage_reservation",
        resourceId: reservation.id,
        metadata: {
          actualCostCents,
          fundedCostCents,
          unfundedOverrunCents,
          status,
          provider: reservation.provider,
          blockedForReview: unfundedOverrunCents > 0,
        },
      },
    });

    return entries[0] ?? null;
  });
}

export async function releaseCustomerFundedUsage(
  organizationId: string,
  actorId: string,
  reservationId: string,
  reason: string,
) {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ReservationRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "billingPeriodKey", "bucket", "capability", "idempotencyKey",
             "provider", "service", "estimatedCostCents", "includedReservedCents", "prepaidReservedCents",
             "overageReservedCents", "actualCostCents", "unfundedOverrunCents", "status", "createdAt", "settledAt", "releasedAt"
      FROM "commercial_usage_reservations"
      WHERE "id" = ${reservationId} AND "organizationId" = ${organizationId}
      FOR UPDATE
    `);
    const reservation = rows[0];
    if (!reservation) return false;
    if (reservation.status === "released" || reservation.status === "expired") return true;
    if (reservation.status !== "reserved") return false;

    const allowanceRows = await tx.$queryRaw<AllowanceRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "billingPeriodKey", "bucket", "includedBudgetCents", "includedConsumedCents",
             "includedReservedCents", "hardLimitCents", "periodStartsAt", "periodEndsAt"
      FROM "commercial_usage_allowances"
      WHERE "organizationId" = ${organizationId} AND "billingPeriodKey" = ${reservation.billingPeriodKey} AND "bucket" = ${reservation.bucket}
      FOR UPDATE
    `);
    const allowance = allowanceRows[0] ?? null;
    await lockFundingAccount(tx, organizationId);

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
      WHERE "organizationId" = ${organizationId}
    `);
    await tx.$executeRaw(Prisma.sql`
      UPDATE "commercial_usage_reservations"
      SET "status" = 'released', "releasedAt" = CURRENT_TIMESTAMP,
          "metadata" = "metadata" || ${JSON.stringify({ releaseReason: reason })}::jsonb
      WHERE "id" = ${reservation.id}
    `);

    await tx.auditLog.create({
      data: {
        organizationId,
        actorId,
        actorType: "system",
        action: "commercial.usage_released",
        resourceType: "commercial_usage_reservation",
        resourceId: reservation.id,
        metadata: { reason },
      },
    });
    return true;
  });
}

export async function setCommercialAllowance(input: {
  organizationId: string;
  actorId: string;
  billingPeriodKey: string;
  bucket: CommercialCostBucket;
  includedBudgetCents: number;
  hardLimitCents?: number | null;
  periodStartsAt: Date;
  periodEndsAt: Date;
}) {
  const budget = cents(input.includedBudgetCents);
  const hardLimit = input.hardLimitCents == null ? null : cents(input.hardLimitCents);
  if (input.periodEndsAt <= input.periodStartsAt) throw new CommercialAccessError("Commercial allowance period is invalid.", "invalid_state", 400);
  if (hardLimit != null && hardLimit < budget) throw new CommercialAccessError("Hard limit cannot be lower than the included allowance.", "invalid_state", 400);

  return db.$transaction(async (tx) => {
    await lockOrganization(tx, input.organizationId);
    const existing = await tx.$queryRaw<AllowanceRow[]>(Prisma.sql`
      SELECT "id", "organizationId", "billingPeriodKey", "bucket", "includedBudgetCents", "includedConsumedCents",
             "includedReservedCents", "hardLimitCents", "periodStartsAt", "periodEndsAt"
      FROM "commercial_usage_allowances"
      WHERE "organizationId" = ${input.organizationId} AND "billingPeriodKey" = ${input.billingPeriodKey} AND "bucket" = ${input.bucket}
      FOR UPDATE
    `);
    const row = existing[0];
    if (row && budget < row.includedConsumedCents + row.includedReservedCents) {
      throw new CommercialAccessError("Allowance cannot be reduced below already consumed or reserved usage.", "invalid_state", 409);
    }
    const id = row?.id ?? randomUUID();
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "commercial_usage_allowances" (
        "id", "organizationId", "billingPeriodKey", "bucket", "includedBudgetCents", "hardLimitCents", "periodStartsAt", "periodEndsAt"
      ) VALUES (
        ${id}, ${input.organizationId}, ${input.billingPeriodKey}, ${input.bucket}, ${budget}, ${hardLimit}, ${input.periodStartsAt}, ${input.periodEndsAt}
      )
      ON CONFLICT ("organizationId", "billingPeriodKey", "bucket") DO UPDATE SET
        "includedBudgetCents" = EXCLUDED."includedBudgetCents",
        "hardLimitCents" = EXCLUDED."hardLimitCents",
        "periodStartsAt" = EXCLUDED."periodStartsAt",
        "periodEndsAt" = EXCLUDED."periodEndsAt",
        "updatedAt" = CURRENT_TIMESTAMP
    `);
    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        actorType: "system",
        action: "commercial.allowance_set",
        resourceType: "commercial_usage_allowance",
        resourceId: id,
        metadata: { billingPeriodKey: input.billingPeriodKey, bucket: input.bucket, includedBudgetCents: budget, hardLimitCents: hardLimit },
      },
    });
    return id;
  });
}

export async function creditCommercialPrepaidBalance(input: {
  organizationId: string;
  actorId: string;
  amountCents: number;
  paymentEvidenceId: string;
}) {
  const amountCents = cents(input.amountCents);
  if (amountCents <= 0) throw new CommercialAccessError("Prepaid credit must be greater than zero.", "invalid_state", 400);
  return db.$transaction(async (tx) => {
    await lockOrganization(tx, input.organizationId);
    await lockFundingAccount(tx, input.organizationId);
    const evidence = await tx.$queryRaw<Array<{ id: string; verified: boolean; processingStatus: string }>>(Prisma.sql`
      SELECT "id", "verified", "processingStatus"
      FROM "commercial_payment_events"
      WHERE "id" = ${input.paymentEvidenceId} AND "organizationId" = ${input.organizationId}
      FOR SHARE
    `);
    if (!evidence[0]?.verified || evidence[0]?.processingStatus !== "applied") {
      throw new CommercialAccessError("Prepaid funds require applied verified payment evidence.", "payment_required", 409);
    }
    await tx.$executeRaw(Prisma.sql`
      UPDATE "commercial_funding_accounts"
      SET "prepaidBalanceCents" = "prepaidBalanceCents" + ${amountCents}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "organizationId" = ${input.organizationId}
    `);
    await tx.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        actorType: "system",
        action: "commercial.prepaid_balance_credited",
        resourceType: "commercial_funding_account",
        resourceId: input.organizationId,
        metadata: { amountCents, paymentEvidenceId: input.paymentEvidenceId },
      },
    });
    return true;
  });
}
