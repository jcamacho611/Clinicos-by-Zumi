import "server-only";

import type {
  SymphonyContactHistory,
  SymphonyOpportunity,
  SymphonyUserGate,
} from "@/lib/company/symphony-opportunity-types";

export type SymphonySendPolicyInput = {
  opportunity: SymphonyOpportunity;
  history: SymphonyContactHistory;
  now: Date;
  senderAvailable: boolean;
};

export type SymphonySendPolicyResult =
  | { allowed: true; nextState: "EMAIL_PREPARED"; reason: string }
  | {
      allowed: false;
      nextState: "READY_TO_SEND_CONNECTION_REQUIRED" | "SEND_BLOCKED_POLICY" | "CLOSED";
      reason: string;
    };

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isApprovedCompetitorPartnership(opportunity: SymphonyOpportunity) {
  return (
    opportunity.targetClass === "COMPETITOR" &&
    opportunity.strategicPartnershipApproved &&
    opportunity.messageFamily === "PARTNERSHIP_TEAMING"
  );
}

function hasDuplicatePurpose(opportunity: SymphonyOpportunity, history: SymphonyContactHistory) {
  const recipient = normalize(opportunity.recipientEmail);
  const domain = normalize(opportunity.organizationDomain);
  const purpose = normalize(opportunity.purpose);
  return history.priorTouches.some((touch) => {
    const sameRecipient = normalize(touch.recipientEmail) === recipient;
    const sameOrganization = Boolean(domain) && normalize(touch.organizationDomain) === domain;
    return normalize(touch.purpose) === purpose && (sameRecipient || sameOrganization);
  });
}

export function evaluateSymphonySendPolicy(input: SymphonySendPolicyInput): SymphonySendPolicyResult {
  const { opportunity, history, now, senderAvailable } = input;
  const recipient = normalize(opportunity.recipientEmail);

  if (opportunity.deadline && opportunity.deadline.getTime() < now.getTime()) {
    return { allowed: false, nextState: "CLOSED", reason: "The opportunity deadline has passed." };
  }
  if (opportunity.targetClass === "UNKNOWN") {
    return { allowed: false, nextState: "SEND_BLOCKED_POLICY", reason: "The target must be classified before outreach." };
  }
  if (opportunity.targetClass === "COMPETITOR" && !isApprovedCompetitorPartnership(opportunity)) {
    return {
      allowed: false,
      nextState: "SEND_BLOCKED_POLICY",
      reason: "Competitors are research-only unless an approved strategic purpose exists.",
    };
  }
  if (!opportunity.fitVerified) {
    return {
      allowed: false,
      nextState: "SEND_BLOCKED_POLICY",
      reason: "Fit has not been verified from current evidence.",
    };
  }
  if (opportunity.officialContactPolicy !== "EMAIL_ALLOWED") {
    return {
      allowed: false,
      nextState: "SEND_BLOCKED_POLICY",
      reason:
        opportunity.officialContactPolicy === "PORTAL_ONLY"
          ? "The official process requires a portal rather than direct outreach."
          : opportunity.officialContactPolicy === "CONTACT_PROHIBITED"
            ? "The official process prohibits this contact path."
            : "The permitted contact path is not yet known.",
    };
  }
  if (opportunity.personalNetworkRestricted) {
    return {
      allowed: false,
      nextState: "SEND_BLOCKED_POLICY",
      reason: "This contact belongs to a founder-restricted personal network.",
    };
  }
  if (history.hardBouncedEmails.some((email) => normalize(email) === recipient)) {
    return { allowed: false, nextState: "SEND_BLOCKED_POLICY", reason: "This recipient is suppressed after a hard bounce." };
  }
  if (history.suppressedEmails.some((email) => normalize(email) === recipient)) {
    return { allowed: false, nextState: "SEND_BLOCKED_POLICY", reason: "This recipient is on the outreach suppression list." };
  }
  if (history.activeSubstantiveThread || history.priorTouches.some((touch) => touch.substantiveThread)) {
    return {
      allowed: false,
      nextState: "SEND_BLOCKED_POLICY",
      reason: "A substantive thread already exists and should be advanced instead of restarted.",
    };
  }
  if (hasDuplicatePurpose(opportunity, history)) {
    if (history.nextFollowUpAt && now.getTime() < history.nextFollowUpAt.getTime()) {
      return {
        allowed: false,
        nextState: "SEND_BLOCKED_POLICY",
        reason: "A prior touch exists and the deliberate follow-up date has not arrived.",
      };
    }
    if (history.followUpCount >= 3) {
      return { allowed: false, nextState: "CLOSED", reason: "The ordinary follow-up sequence is complete without new evidence." };
    }
  }
  if (!senderAvailable) {
    return {
      allowed: false,
      nextState: "READY_TO_SEND_CONNECTION_REQUIRED",
      reason: "The message is eligible, but no verified email sender is available for this runtime.",
    };
  }
  return { allowed: true, nextState: "EMAIL_PREPARED", reason: "Outreach is eligible under current Symphony policy." };
}

export function requiresSymphonyUserAction(gate: SymphonyUserGate) {
  return gate !== "NONE";
}
