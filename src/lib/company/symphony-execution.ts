import "server-only";

import type { OutboundMessage, OutboundResult } from "@/lib/communications/outbound";
import {
  hashSymphonyMessage,
  validateSymphonyApprovalEvidence,
  type SymphonyApprovalConsumer,
  type SymphonySendApprovalEvidence,
} from "@/lib/company/symphony-approval";
import type {
  SymphonyContactHistory,
  SymphonyExecutionState,
  SymphonyOpportunity,
} from "@/lib/company/symphony-opportunity-types";
import { buildSymphonyEmail, type SymphonyCompanyProfile } from "@/lib/company/symphony-message-builder";
import { evaluateSymphonySendPolicy } from "@/lib/company/symphony-policy";

export type SymphonySender = (message: OutboundMessage) => Promise<OutboundResult>;

export type SymphonyExecutionResult = {
  state: SymphonyExecutionState;
  reason: string;
  message?: OutboundMessage;
  provider?: string;
  providerReference?: string;
  nextFollowUpAt?: Date;
  approvalEvidence?: SymphonySendApprovalEvidence;
};

export type ExecuteSymphonyEmailInput = {
  opportunity: SymphonyOpportunity;
  history: SymphonyContactHistory;
  profile: SymphonyCompanyProfile;
  now: Date;
  senderAvailable: boolean;
  sender: SymphonySender;
  approvalId?: string | null;
  consumeApproval?: SymphonyApprovalConsumer;
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export async function executeSymphonyEmail(input: ExecuteSymphonyEmailInput): Promise<SymphonyExecutionResult> {
  const policy = evaluateSymphonySendPolicy({
    opportunity: input.opportunity,
    history: input.history,
    now: input.now,
    senderAvailable: input.senderAvailable,
  });

  if (!policy.allowed) {
    if (policy.nextState === "READY_TO_SEND_CONNECTION_REQUIRED") {
      const message = buildSymphonyEmail({ opportunity: input.opportunity, profile: input.profile });
      return {
        state: policy.nextState,
        reason: policy.reason,
        message,
      };
    }

    return {
      state: policy.nextState,
      reason: policy.reason,
    };
  }

  const message = buildSymphonyEmail({ opportunity: input.opportunity, profile: input.profile });
  const approvalId = input.approvalId?.trim() ?? "";

  // Preparing a message may be automatic. Crossing the external provider boundary is
  // consequential and therefore consumes evidence-bound approval for this exact message.
  if (!approvalId || !input.consumeApproval) {
    return {
      state: "USER_ACTION_REQUIRED",
      reason: "A one-time, evidence-bound approval is required before Symphony may send this prepared email.",
      message,
    };
  }

  const messageHash = hashSymphonyMessage(input.opportunity.id, message);
  let approvalResult;
  try {
    approvalResult = await input.consumeApproval({
      approvalId,
      opportunityId: input.opportunity.id,
      messageHash,
      requestedAt: input.now,
    });
  } catch {
    return {
      state: "USER_ACTION_REQUIRED",
      reason: "approval_unavailable: Symphony could not safely consume the required send approval.",
      message,
    };
  }

  if (!approvalResult.ok) {
    return {
      state: "USER_ACTION_REQUIRED",
      reason: `${approvalResult.reason}: ${approvalResult.detail}`,
      message,
    };
  }

  if (!validateSymphonyApprovalEvidence(approvalResult.evidence, approvalId, input.now)) {
    return {
      state: "USER_ACTION_REQUIRED",
      reason: "approval_mismatch: The approval evidence does not match this exact send request.",
      message,
    };
  }

  const approvalEvidence = approvalResult.evidence;
  const delivery = await input.sender(message);

  if (!delivery.ok) {
    return {
      state: "DELIVERY_FAILED",
      reason: delivery.detail,
      message,
      approvalEvidence,
    };
  }

  const providerReference = delivery.providerReference.trim();
  if (!providerReference) {
    return {
      state: "DELIVERY_FAILED",
      reason: "The provider reported acceptance without a usable provider reference.",
      message,
      approvalEvidence,
    };
  }

  return {
    state: "PROVIDER_ACCEPTED",
    reason: "The approved outbound provider accepted the email and returned delivery evidence.",
    message,
    provider: delivery.provider,
    providerReference,
    nextFollowUpAt: new Date(input.now.getTime() + THREE_DAYS_MS),
    approvalEvidence,
  };
}
