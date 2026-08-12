import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import {
  CommercialFundingError,
  releaseCustomerFundedUsage,
  reserveCustomerFundedUsage,
  settleCustomerFundedUsage,
} from "@/lib/commercial/commercial-ledger-repository";
import { invokeZumi, type ZumiGatewayResult } from "@/features/zumi/gateway";
import { getZumiCapability } from "@/features/zumi/schemas";
import { selectProvider } from "@/features/zumi/providers";

const DEFAULT_RESERVATION_CENTS = 25;

function configuredReservationCents(env: NodeJS.ProcessEnv = process.env) {
  const raw = env.ZUMI_RESERVE_PER_CALL_CENTS?.trim();
  if (!raw) return DEFAULT_RESERVATION_CENTS;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

function providerCostCents(costMicroUsd: number) {
  if (!Number.isFinite(costMicroUsd) || costMicroUsd <= 0) return 0;
  return Math.ceil(costMicroUsd / 10_000);
}

/**
 * Self-hosted inference can correctly report $0 third-party API cost while still
 * consuming real Klinikos compute. Successful paid Zumi work therefore consumes at
 * least the reserved internal cost unit. If a provider reports a higher real cost,
 * the higher value wins and the commercial ledger detects the overrun.
 */
function fundedCostCents(costMicroUsd: number, reservedCents: number) {
  return Math.max(reservedCents, providerCostCents(costMicroUsd));
}

export type FundedZumiRequest = {
  session: ClinicSession;
  capability: string;
  organizationId: string;
  entitlements: readonly string[];
  question: string;
  context?: unknown;
  idempotencyKey: string;
};

export type FundedZumiResult =
  | ZumiGatewayResult
  | {
      allowed: false;
      reason: "commercial_unavailable" | "payment_required" | "upgrade_required" | "funds_required" | "policy_blocked";
      status: 402 | 403 | 503;
      message: string;
      invocationId: null;
    };

export async function invokeFundedZumi(request: FundedZumiRequest): Promise<FundedZumiResult> {
  const selection = selectProvider();
  if (!selection.ok) {
    return {
      allowed: false,
      reason: "commercial_unavailable",
      status: 503,
      message: selection.detail,
      invocationId: null,
    };
  }

  const reserveCents = configuredReservationCents();
  if (reserveCents == null) {
    return {
      allowed: false,
      reason: "commercial_unavailable",
      status: 503,
      message: "Zumi paid usage is not commercially configured for this deployment.",
      invocationId: null,
    };
  }

  const capability = getZumiCapability(request.capability);
  const allowUnfundedSyntheticDemo = process.env.ZUMI_ALLOW_UNFUNDED_SYNTHETIC_DEMO === "1";

  let reservation;
  try {
    reservation = await reserveCustomerFundedUsage({
      organizationId: request.session.organizationId,
      actorId: request.session.userId,
      capability: request.capability,
      requiredEntitlement: capability?.requiresEntitlement ?? null,
      bucket: "ai",
      estimatedCostCents: reserveCents,
      idempotencyKey: request.idempotencyKey,
      provider: selection.adapter.key,
      service: selection.adapter.modelId,
      allowSyntheticDemo: allowUnfundedSyntheticDemo,
      syntheticDataOnly: request.session.demo,
      metadata: { gateway: "zumi", reserveCents },
    });
  } catch (error) {
    if (error instanceof CommercialFundingError) {
      return {
        allowed: false,
        reason: error.reason === "invalid_state" ? "commercial_unavailable" : error.reason,
        status: error.reason === "policy_blocked" || error.reason === "upgrade_required" ? 403 : 402,
        message: error.message,
        invocationId: null,
      };
    }
    throw error;
  }

  try {
    const result = await invokeZumi({
      session: request.session,
      capability: request.capability,
      organizationId: request.organizationId,
      entitlements: request.entitlements,
      question: request.question,
      context: request.context,
    });

    if (!reservation.reservationId) return result;

    if (!result.allowed) {
      await releaseCustomerFundedUsage({
        organizationId: request.session.organizationId,
        actorId: request.session.userId,
        reservationId: reservation.reservationId,
        reason: `Zumi request ended before a successful governed response: ${result.reason}`,
      });
      return result;
    }

    await settleCustomerFundedUsage({
      organizationId: request.session.organizationId,
      actorId: request.session.userId,
      reservationId: reservation.reservationId,
      actualCostCents: fundedCostCents(result.response.usage.costMicroUsd, reservation.estimatedCostCents),
      metadata: {
        invocationAuditLogId: result.response.auditLogId,
        providerCostMicroUsd: result.response.usage.costMicroUsd,
        internalReservedCostCents: reservation.estimatedCostCents,
        inputTokens: result.response.usage.inputTokens,
        outputTokens: result.response.usage.outputTokens,
      },
    });

    return result;
  } catch (error) {
    if (reservation.reservationId) {
      await releaseCustomerFundedUsage({
        organizationId: request.session.organizationId,
        actorId: request.session.userId,
        reservationId: reservation.reservationId,
        reason: "Zumi invocation threw before commercial settlement.",
      }).catch(() => undefined);
    }
    throw error;
  }
}
