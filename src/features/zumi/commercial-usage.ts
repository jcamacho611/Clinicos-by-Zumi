import "server-only";

import {
  releaseCustomerFundedUsage,
  reserveCustomerFundedUsage,
  settleCustomerFundedUsage,
  type CommercialUsageReservation,
  type ReserveCommercialUsageInput,
} from "@/lib/commercial/commercial-ledger-repository";

const MICRO_USD_PER_CENT = 10_000;

function requireNonNegativeSafeInteger(value: number, field: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
  return value;
}

function requireNonEmpty(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

/**
 * The commercial ledger is cent-denominated while Zumi provider telemetry is kept in
 * integer micro-USD. Reserve/settle conservatively so variable provider cost is never
 * silently rounded down. Exact micro-USD stays in Zumi/commercial metadata for margin
 * analysis and later aggregation.
 */
export function microUsdToCommercialCents(costMicroUsd: number) {
  const microUsd = requireNonNegativeSafeInteger(costMicroUsd, "costMicroUsd");
  return microUsd === 0 ? 0 : Math.ceil(microUsd / MICRO_USD_PER_CENT);
}

export type ZumiCommercialUsageLedger = {
  reserve: (input: ReserveCommercialUsageInput) => Promise<CommercialUsageReservation>;
  settle: (
    organizationId: string,
    actorId: string,
    reservationId: string,
    actualCostCents: number,
    metadata?: Record<string, unknown>,
  ) => Promise<unknown>;
  release: (
    organizationId: string,
    actorId: string,
    reservationId: string,
    reason: string,
  ) => Promise<boolean>;
};

const defaultLedger: ZumiCommercialUsageLedger = {
  reserve: reserveCustomerFundedUsage,
  settle: settleCustomerFundedUsage,
  release: releaseCustomerFundedUsage,
};

export type FundedZumiInvocationInput = {
  organizationId: string;
  actorId: string;
  capability: string;
  provider: string;
  service?: string | null;
  /**
   * Stable, server-trusted identifier for this logical provider invocation. The API
   * boundary must preserve it across an HTTP retry before this wrapper is wired into
   * the live gateway; a fresh random value per retry would defeat ledger idempotency.
   */
  invocationKey: string;
  estimatedCostMicroUsd: number;
  allowSyntheticDemo?: boolean;
  syntheticDataOnly?: boolean;
};

export type CostedZumiProviderResult = {
  costMicroUsd: number;
  providerResponseId?: string | null;
};

export type FundedZumiInvocationResult<T> = {
  value: T;
  reservationId: string | null;
  reservationMode: CommercialUsageReservation["mode"];
  estimatedCostCents: number;
  actualCostCents: number;
  settlement: unknown;
};

/**
 * Execute one already-admitted Zumi provider operation against the existing commercial
 * usage rail.
 *
 * This function is deliberately NOT an entitlement, PHI, credential, clinical, or
 * organization-authority engine. Those gates must run before the caller reaches this
 * point. Funding proves only that variable provider cost may execute.
 */
export async function executeFundedZumiInvocation<T extends CostedZumiProviderResult>(
  input: FundedZumiInvocationInput,
  executeProvider: () => Promise<T>,
  ledger: ZumiCommercialUsageLedger = defaultLedger,
): Promise<FundedZumiInvocationResult<T>> {
  const organizationId = requireNonEmpty(input.organizationId, "organizationId");
  const actorId = requireNonEmpty(input.actorId, "actorId");
  const capability = requireNonEmpty(input.capability, "capability");
  const provider = requireNonEmpty(input.provider, "provider");
  const invocationKey = requireNonEmpty(input.invocationKey, "invocationKey");
  const estimatedCostMicroUsd = requireNonNegativeSafeInteger(
    input.estimatedCostMicroUsd,
    "estimatedCostMicroUsd",
  );
  const estimatedCostCents = microUsdToCommercialCents(estimatedCostMicroUsd);

  const reservation = await ledger.reserve({
    organizationId,
    actorId,
    capability: `zumi.${capability}`,
    bucket: "ai",
    estimatedCostCents,
    idempotencyKey: `zumi:${invocationKey}`,
    provider,
    service: input.service?.trim() || null,
    requiredEntitlement: null,
    allowSyntheticDemo: input.allowSyntheticDemo,
    syntheticDataOnly: input.syntheticDataOnly,
    metadata: {
      zumiInvocationKey: invocationKey,
      exactEstimatedCostMicroUsd: estimatedCostMicroUsd,
      commercialAuthorityOnly: true,
    },
  });

  let value: T;
  try {
    value = await executeProvider();
  } catch (error) {
    if (reservation.reservationId) {
      try {
        await ledger.release(
          organizationId,
          actorId,
          reservation.reservationId,
          "provider_execution_failed",
        );
      } catch (releaseError) {
        console.error(
          "[zumi] failed to release commercial usage reservation after provider failure",
          releaseError instanceof Error ? releaseError.message : "unknown error",
        );
      }
    }
    throw error;
  }

  // Once provider work succeeded, do not release this reservation merely because cost
  // validation or settlement fails. Provider cost has already been incurred; keeping
  // the reservation open preserves a recoverable reconciliation state instead of
  // falsely returning money to the available pool.
  const actualCostMicroUsd = requireNonNegativeSafeInteger(value.costMicroUsd, "actualCostMicroUsd");
  const actualCostCents = microUsdToCommercialCents(actualCostMicroUsd);

  let settlement: unknown = null;
  if (reservation.reservationId) {
    settlement = await ledger.settle(
      organizationId,
      actorId,
      reservation.reservationId,
      actualCostCents,
      {
        zumiInvocationKey: invocationKey,
        exactActualCostMicroUsd: actualCostMicroUsd,
        providerResponseId: value.providerResponseId ?? null,
        commercialAuthorityOnly: true,
      },
    );
  }

  return {
    value,
    reservationId: reservation.reservationId,
    reservationMode: reservation.mode,
    estimatedCostCents,
    actualCostCents,
    settlement,
  };
}
