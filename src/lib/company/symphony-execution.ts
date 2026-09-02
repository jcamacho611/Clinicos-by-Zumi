import "server-only";

import type { OutboundMessage, OutboundResult } from "@/lib/communications/outbound";
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
};

export type ExecuteSymphonyEmailInput = {
  opportunity: SymphonyOpportunity;
  history: SymphonyContactHistory;
  profile: SymphonyCompanyProfile;
  now: Date;
  senderAvailable: boolean;
  sender: SymphonySender;
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
  const delivery = await input.sender(message);

  if (!delivery.ok) {
    return {
      state: "DELIVERY_FAILED",
      reason: delivery.detail,
      message,
    };
  }

  const providerReference = delivery.providerReference.trim();
  if (!providerReference) {
    return {
      state: "DELIVERY_FAILED",
      reason: "The provider reported acceptance without a usable provider reference.",
      message,
    };
  }

  return {
    state: "PROVIDER_ACCEPTED",
    reason: "The outbound provider accepted the email and returned delivery evidence.",
    message,
    provider: delivery.provider,
    providerReference,
    nextFollowUpAt: new Date(input.now.getTime() + THREE_DAYS_MS),
  };
}
