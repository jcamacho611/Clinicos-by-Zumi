import "server-only";

import type { CommercialCostBucket } from "@/lib/commercial/customer-funded-access";
import {
  CommercialAccessError,
  releaseCustomerFundedUsage,
  reserveCustomerFundedUsage,
} from "@/lib/commercial/commercial-ledger-repository";

export type FundedProviderExecutionResult<T> = {
  result: T;
  reservationId: string | null;
  commercialMode: "subscription" | "funded_usage";
  reconciliation: "not_required" | "pending_actual_cost" | "released_after_non_acceptance";
};

/**
 * Execute one variable-cost external provider call behind customer-backed funding.
 *
 * Important accounting boundary:
 * - estimated cost reserves money before the provider side effect;
 * - provider failure/non-acceptance releases that reservation;
 * - provider acceptance does NOT call the ledger's `settle` function because an estimate
 *   is not an actual invoice cost;
 * - accepted calls remain reserved until a provider-specific reconciliation process has
 *   trustworthy cost evidence and settles the reservation.
 *
 * This keeps the platform from fronting variable COGS while also keeping estimates out
 * of fields named `actualCostCents`.
 */
export async function executeCustomerFundedProviderCall<T>(input: {
  organizationId: string;
  actorId: string;
  capability: string;
  requiredEntitlement?: string | null;
  bucket: CommercialCostBucket;
  estimatedCostCents: number;
  idempotencyKey: string;
  provider: string;
  service?: string | null;
  metadata?: Record<string, unknown>;
  execute: () => Promise<T>;
  accepted: (result: T) => boolean;
}): Promise<FundedProviderExecutionResult<T>> {
  if (!Number.isInteger(input.estimatedCostCents) || input.estimatedCostCents <= 0) {
    throw new CommercialAccessError(
      "Variable-cost provider execution requires a positive whole-cent reservation estimate.",
      "invalid_state",
      400,
    );
  }

  const reservation = await reserveCustomerFundedUsage({
    organizationId: input.organizationId,
    actorId: input.actorId,
    capability: input.capability,
    requiredEntitlement: input.requiredEntitlement,
    bucket: input.bucket,
    estimatedCostCents: input.estimatedCostCents,
    idempotencyKey: input.idempotencyKey,
    provider: input.provider,
    service: input.service ?? null,
    metadata: {
      ...(input.metadata ?? {}),
      accountingBasis: "pre_execution_estimate",
      actualCostPendingProviderReconciliation: true,
    },
  });

  try {
    const result = await input.execute();
    if (!input.accepted(result)) {
      if (reservation.reservationId) {
        await releaseCustomerFundedUsage(
          input.organizationId,
          input.actorId,
          reservation.reservationId,
          "Provider did not accept the side effect; no billable usage is being claimed from this execution.",
        );
      }
      return {
        result,
        reservationId: reservation.reservationId,
        commercialMode: reservation.mode === "funded_usage" ? "funded_usage" : "subscription",
        reconciliation: "released_after_non_acceptance",
      };
    }

    return {
      result,
      reservationId: reservation.reservationId,
      commercialMode: reservation.mode === "funded_usage" ? "funded_usage" : "subscription",
      reconciliation: reservation.reservationId ? "pending_actual_cost" : "not_required",
    };
  } catch (error) {
    if (reservation.reservationId) {
      await releaseCustomerFundedUsage(
        input.organizationId,
        input.actorId,
        reservation.reservationId,
        "Provider execution threw before a successful accepted outcome was recorded.",
      ).catch(() => undefined);
    }
    throw error;
  }
}
