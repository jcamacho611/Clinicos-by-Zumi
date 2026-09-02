import "server-only";

import type { OutboundMessage, OutboundResult } from "@/lib/communications/outbound";
import {
  hashSymphonyOutboundMessage,
  validateClaimedSymphonyApproval,
  type SymphonyApprovalExpectation,
  type SymphonyOutboundApprovalRecord,
} from "@/lib/company/symphony-approval";
import { buildSymphonyEmail, type SymphonyCompanyProfile } from "@/lib/company/symphony-message-builder";
import type {
  SymphonyContactHistory,
  SymphonyExecutionState,
  SymphonyOpportunity,
} from "@/lib/company/symphony-opportunity-types";
import { evaluateSymphonySendPolicy } from "@/lib/company/symphony-policy";

export type { SymphonyOutboundApprovalRecord } from "@/lib/company/symphony-approval";

export type SymphonySender = {
  toolId: string;
  providerId: string;
  send: (message: OutboundMessage) => Promise<OutboundResult>;
};

export type SymphonyExecutionTruth = {
  providerAccepted: boolean;
  delivered: boolean;
  responseReceived: boolean;
  applicationSubmitted: boolean;
  awardedOrContracted: boolean;
  cashReceived: boolean;
};

export type SymphonyExecutionAuditEvent = {
  executionId: string;
  idempotencyKey: string;
  tenantId: string;
  opportunityId: string;
  approvalId: string | null;
  payloadSha256: string;
  recipient: string;
  actorId: string;
  approvedByActorId: string | null;
  toolId: string;
  providerId: string;
  fromState: "EMAIL_PREPARED";
  toState: SymphonyExecutionState;
  occurredAt: Date;
  reason: string;
  providerReference: string | null;
  nextAction: string;
  truth: SymphonyExecutionTruth;
};

export type SymphonyApprovalClaimRejection = "MISSING" | "EXPIRED" | "REVOKED" | "REPLAYED" | "MISMATCH" | "STORE_UNAVAILABLE";

export type SymphonyApprovalStore = {
  /** Must atomically validate and consume one approval for exactly this execution/idempotency pair. */
  claimForSend: (
    expected: SymphonyApprovalExpectation,
  ) => Promise<
    | { status: "CLAIMED"; approval: SymphonyOutboundApprovalRecord }
    | { status: "REJECTED"; reason: SymphonyApprovalClaimRejection; detail: string }
  >;
  /** Must durably append the outcome; it may not rewrite the consumed approval. */
  recordOutcome: (event: SymphonyExecutionAuditEvent) => Promise<void>;
};

export type SymphonySendAuthorization = {
  approvalId: string;
  tenantId: string;
  actorId: string;
  executionId: string;
  idempotencyKey: string;
  allowedToolIds: readonly string[];
  allowedProviderIds: readonly string[];
  store: SymphonyApprovalStore;
};

export type SymphonyExecutionResult = {
  state: SymphonyExecutionState;
  reason: string;
  message?: OutboundMessage;
  provider?: string;
  providerReference?: string;
  nextFollowUpAt?: Date;
  payloadSha256?: string;
  truth?: SymphonyExecutionTruth;
  auditEvent?: SymphonyExecutionAuditEvent;
};
export type ExecuteSymphonyEmailInput = {
  opportunity: SymphonyOpportunity;
  history: SymphonyContactHistory;
  profile: SymphonyCompanyProfile;
  now: Date;
  sender?: SymphonySender;
  authorization?: SymphonySendAuthorization;
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const noDownstreamTruth: SymphonyExecutionTruth = {
  providerAccepted: false,
  delivered: false,
  responseReceived: false,
  applicationSubmitted: false,
  awardedOrContracted: false,
  cashReceived: false,
};

function requiredIdentifier(value: string, label: string) {
  if (!value.trim()) throw new Error(`Symphony send authorization requires ${label}.`);
  return value;
}

function auditEvent(input: {
  authorization: SymphonySendAuthorization;
  opportunity: SymphonyOpportunity;
  message: OutboundMessage;
  payloadSha256: string;
  now: Date;
  sender: SymphonySender;
  toState: SymphonyExecutionState;
  reason: string;
  approval?: SymphonyOutboundApprovalRecord;
  providerReference?: string;
  truth?: SymphonyExecutionTruth;
  nextAction: string;
}): SymphonyExecutionAuditEvent {
  return {
    executionId: input.authorization.executionId,
    idempotencyKey: input.authorization.idempotencyKey,
    tenantId: input.opportunity.tenantId,
    opportunityId: input.opportunity.id,
    approvalId: input.authorization.approvalId || null,
    payloadSha256: input.payloadSha256,
    recipient: input.message.to,
    actorId: input.authorization.actorId,
    approvedByActorId: input.approval?.approvedByActorId ?? null,
    toolId: input.sender.toolId,
    providerId: input.sender.providerId,
    fromState: "EMAIL_PREPARED",
    toState: input.toState,
    occurredAt: input.now,
    reason: input.reason,
    providerReference: input.providerReference ?? null,
    nextAction: input.nextAction,
    truth: input.truth ?? noDownstreamTruth,
  };
}

async function persistOutcome(
  store: SymphonyApprovalStore,
  event: SymphonyExecutionAuditEvent,
): Promise<{ ok: true } | { ok: false; detail: string }> {
  try {
    await store.recordOutcome(event);
    return { ok: true };
  } catch {
    return { ok: false, detail: "The outbound outcome could not be durably recorded and requires reconciliation." };
  }
}

export async function executeSymphonyEmail(input: ExecuteSymphonyEmailInput): Promise<SymphonyExecutionResult> {
  const policy = evaluateSymphonySendPolicy({
    opportunity: input.opportunity,
    history: input.history,
    now: input.now,
    senderAvailable: Boolean(input.sender),
  });
  if (!policy.allowed) {
    return policy.nextState === "READY_TO_SEND_CONNECTION_REQUIRED"
      ? {
          state: policy.nextState,
          reason: policy.reason,
          message: buildSymphonyEmail({ opportunity: input.opportunity, profile: input.profile, now: input.now }),
        }
      : { state: policy.nextState, reason: policy.reason };
  }

  const message = buildSymphonyEmail({ opportunity: input.opportunity, profile: input.profile, now: input.now });
  const payloadSha256 = hashSymphonyOutboundMessage(message);
  const sender = input.sender;
  if (!sender) {
    return {
      state: "READY_TO_SEND_CONNECTION_REQUIRED",
      reason: "A reviewed draft exists, but no verified email sender is available for this runtime.",
      message,
      payloadSha256,
      truth: noDownstreamTruth,
    };
  }
  const authorization = input.authorization;
  if (!authorization) {
    return {
      state: "APPROVAL_REQUIRED",
      reason: "A reviewed draft exists, but no one-time server-side approval was supplied.",
      message,
      payloadSha256,
      truth: noDownstreamTruth,
    };
  }

  requiredIdentifier(authorization.approvalId, "an approval ID");
  requiredIdentifier(input.opportunity.tenantId, "an opportunity tenant ID");
  requiredIdentifier(authorization.tenantId, "an authorization tenant ID");
  requiredIdentifier(authorization.actorId, "an executing actor ID");
  requiredIdentifier(authorization.executionId, "an execution ID");
  requiredIdentifier(authorization.idempotencyKey, "an idempotency key");
  requiredIdentifier(sender.toolId, "an outbound tool ID");
  requiredIdentifier(sender.providerId, "an outbound provider ID");

  if (authorization.tenantId !== input.opportunity.tenantId) {
    const reason = "The outbound authorization tenant does not match the opportunity tenant; execution fails closed before store access.";
    return { state: "SEND_BLOCKED_POLICY", reason, message, payloadSha256, truth: noDownstreamTruth };
  }

  if (!authorization.allowedToolIds.includes(sender.toolId) || !authorization.allowedProviderIds.includes(sender.providerId)) {
    const reason = "The configured outbound tool or provider is not on the server allowlist.";
    const event = auditEvent({
      authorization,
      opportunity: input.opportunity,
      message,
      payloadSha256,
      now: input.now,
      sender,
      toState: "SEND_BLOCKED_POLICY",
      reason,
      nextAction: "Review the server-owned outbound tool/provider allowlist; do not send.",
    });
    await persistOutcome(authorization.store, event);
    return { state: "SEND_BLOCKED_POLICY", reason, message, payloadSha256, truth: noDownstreamTruth, auditEvent: event };
  }

  const expected: SymphonyApprovalExpectation = {
    approvalId: authorization.approvalId,
    tenantId: authorization.tenantId,
    payloadSha256,
    recipient: message.to,
    opportunityId: input.opportunity.id,
    purpose: input.opportunity.purpose,
    actorId: authorization.actorId,
    executionId: authorization.executionId,
    idempotencyKey: authorization.idempotencyKey,
    toolId: sender.toolId,
    providerId: sender.providerId,
    now: input.now,
  };
  const claim = await authorization.store.claimForSend(expected).catch(() => ({
    status: "REJECTED" as const,
    reason: "STORE_UNAVAILABLE" as const,
    detail: "The approval store is unavailable; outbound execution fails closed.",
  }));
  if (claim.status === "REJECTED") {
    const event = auditEvent({
      authorization,
      opportunity: input.opportunity,
      message,
      payloadSha256,
      now: input.now,
      sender,
      toState: "SEND_BLOCKED_POLICY",
      reason: claim.detail,
      nextAction: "Obtain a fresh one-time approval bound to the exact payload; do not send.",
    });
    await persistOutcome(authorization.store, event);
    return { state: "SEND_BLOCKED_POLICY", reason: claim.detail, message, payloadSha256, truth: noDownstreamTruth, auditEvent: event };
  }

  const approvalValidation = validateClaimedSymphonyApproval(claim.approval, expected);
  if (!approvalValidation.ok) {
    const event = auditEvent({
      authorization,
      opportunity: input.opportunity,
      message,
      payloadSha256,
      now: input.now,
      sender,
      approval: claim.approval,
      toState: "SEND_BLOCKED_POLICY",
      reason: approvalValidation.detail,
      nextAction: "Reconcile the consumed approval and obtain a fresh exact approval; do not send.",
    });
    await persistOutcome(authorization.store, event);
    return {
      state: "SEND_BLOCKED_POLICY",
      reason: approvalValidation.detail,
      message,
      payloadSha256,
      truth: noDownstreamTruth,
      auditEvent: event,
    };
  }

  const delivery: OutboundResult = await sender.send(message).catch(() => ({
    ok: false as const,
    reason: "provider_error" as const,
    detail: "The outbound provider request failed.",
  }));
  if (!delivery.ok) {
    const event = auditEvent({
      authorization,
      opportunity: input.opportunity,
      message,
      payloadSha256,
      now: input.now,
      sender,
      approval: claim.approval,
      toState: "DELIVERY_FAILED",
      reason: delivery.detail,
      nextAction: "Review provider failure evidence; a new approval is required before any retry.",
    });
    const persisted = await persistOutcome(authorization.store, event);
    return persisted.ok
      ? { state: "DELIVERY_FAILED", reason: delivery.detail, message, payloadSha256, truth: noDownstreamTruth, auditEvent: event }
      : {
          state: "AUDIT_RECONCILIATION_REQUIRED",
          reason: persisted.detail,
          message,
          payloadSha256,
          truth: noDownstreamTruth,
          auditEvent: { ...event, toState: "AUDIT_RECONCILIATION_REQUIRED", reason: persisted.detail },
        };
  }
  const providerReference = delivery.providerReference.trim();
  if (!providerReference) {
    const reason = "The provider reported acceptance without a usable provider reference.";
    const event = auditEvent({
      authorization,
      opportunity: input.opportunity,
      message,
      payloadSha256,
      now: input.now,
      sender,
      approval: claim.approval,
      toState: "DELIVERY_FAILED",
      reason,
      nextAction: "Reconcile the provider response; do not infer delivery and require new approval before retry.",
    });
    await persistOutcome(authorization.store, event);
    return { state: "DELIVERY_FAILED", reason, message, payloadSha256, truth: noDownstreamTruth, auditEvent: event };
  }
  if (delivery.provider !== sender.providerId) {
    const reason = "The provider acceptance evidence does not match the approved provider binding.";
    const truth = { ...noDownstreamTruth, providerAccepted: true };
    const event = auditEvent({
      authorization,
      opportunity: input.opportunity,
      message,
      payloadSha256,
      now: input.now,
      sender,
      approval: claim.approval,
      toState: "AUDIT_RECONCILIATION_REQUIRED",
      reason,
      providerReference,
      truth,
      nextAction: "Reconcile unexpected provider acceptance before any downstream claim or retry.",
    });
    await persistOutcome(authorization.store, event);
    return {
      state: "AUDIT_RECONCILIATION_REQUIRED",
      reason,
      message,
      provider: delivery.provider,
      providerReference,
      payloadSha256,
      truth,
      auditEvent: event,
    };
  }

  const truth: SymphonyExecutionTruth = { ...noDownstreamTruth, providerAccepted: true };
  const reason = "The approved outbound provider accepted the email and returned a provider reference; delivery, response, application, award, and cash remain unproven.";
  const event = auditEvent({
    authorization,
    opportunity: input.opportunity,
    message,
    payloadSha256,
    now: input.now,
    sender,
    approval: claim.approval,
    toState: "PROVIDER_ACCEPTED",
    reason,
    providerReference,
    truth,
    nextAction: "Await independent delivery/response evidence; do not inflate provider acceptance.",
  });
  const persisted = await persistOutcome(authorization.store, event);
  if (!persisted.ok) {
    return {
      state: "AUDIT_RECONCILIATION_REQUIRED",
      reason: persisted.detail,
      message,
      provider: delivery.provider,
      providerReference,
      payloadSha256,
      truth,
      auditEvent: { ...event, toState: "AUDIT_RECONCILIATION_REQUIRED", reason: persisted.detail },
    };
  }
  return {
    state: "PROVIDER_ACCEPTED",
    reason,
    message,
    provider: delivery.provider,
    providerReference,
    nextFollowUpAt: new Date(input.now.getTime() + THREE_DAYS_MS),
    payloadSha256,
    truth,
    auditEvent: event,
  };
}
