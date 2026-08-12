export const securityRiskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type SecurityRiskLevel = (typeof securityRiskLevels)[number];

export const sensitiveActionClasses = [
  "read_private_data",
  "export_private_data",
  "change_identity_or_access",
  "change_security_configuration",
  "release_records",
  "credential_decision",
  "financial_commitment",
  "payout_or_refund",
  "external_write",
  "clinical_high_impact",
] as const;
export type SensitiveActionClass = (typeof sensitiveActionClasses)[number];

export type SessionRiskSignals = {
  newIp?: boolean;
  newUserAgent?: boolean;
  impossibleTravel?: boolean;
  recentlyFailedAuth?: boolean;
  unusuallyHighRequestRate?: boolean;
  demoSession?: boolean;
  staleAuthenticationMinutes?: number | null;
};

export type SecurityDecision = {
  risk: SecurityRiskLevel;
  allow: boolean;
  requireStepUp: boolean;
  requireHumanApproval: boolean;
  reasons: string[];
};

const actionBaseRisk: Record<SensitiveActionClass, SecurityRiskLevel> = {
  read_private_data: "LOW",
  export_private_data: "HIGH",
  change_identity_or_access: "HIGH",
  change_security_configuration: "CRITICAL",
  release_records: "CRITICAL",
  credential_decision: "HIGH",
  financial_commitment: "HIGH",
  payout_or_refund: "CRITICAL",
  external_write: "HIGH",
  clinical_high_impact: "CRITICAL",
};

function riskRank(level: SecurityRiskLevel) {
  return securityRiskLevels.indexOf(level);
}

function maxRisk(a: SecurityRiskLevel, b: SecurityRiskLevel) {
  return riskRank(a) >= riskRank(b) ? a : b;
}

export function evaluateSensitiveAction(input: {
  actionClass: SensitiveActionClass;
  sessionSignals?: SessionRiskSignals;
  authenticated: boolean;
  authorized: boolean;
  humanApprovalPresent?: boolean;
  stepUpPresent?: boolean;
}): SecurityDecision {
  const reasons: string[] = [];
  let risk = actionBaseRisk[input.actionClass];

  if (!input.authenticated) {
    return { risk: "CRITICAL", allow: false, requireStepUp: true, requireHumanApproval: true, reasons: ["authentication_required"] };
  }
  if (!input.authorized) {
    return { risk: "CRITICAL", allow: false, requireStepUp: false, requireHumanApproval: false, reasons: ["authorization_denied"] };
  }

  const signals = input.sessionSignals ?? {};
  if (signals.demoSession) { risk = maxRisk(risk, "HIGH"); reasons.push("demo_session"); }
  if (signals.newIp) { risk = maxRisk(risk, "MEDIUM"); reasons.push("new_ip"); }
  if (signals.newUserAgent) { risk = maxRisk(risk, "MEDIUM"); reasons.push("new_user_agent"); }
  if (signals.recentlyFailedAuth) { risk = maxRisk(risk, "HIGH"); reasons.push("recent_failed_auth"); }
  if (signals.unusuallyHighRequestRate) { risk = maxRisk(risk, "HIGH"); reasons.push("unusually_high_request_rate"); }
  if (signals.impossibleTravel) { risk = "CRITICAL"; reasons.push("impossible_travel"); }
  if ((signals.staleAuthenticationMinutes ?? 0) > 30 && riskRank(risk) >= riskRank("HIGH")) {
    reasons.push("stale_authentication");
  }

  const requireStepUp = risk === "HIGH" || risk === "CRITICAL";
  const requireHumanApproval = ["release_records", "credential_decision", "payout_or_refund", "clinical_high_impact", "change_security_configuration"].includes(input.actionClass);

  if (signals.demoSession && riskRank(risk) >= riskRank("HIGH")) {
    return { risk, allow: false, requireStepUp, requireHumanApproval, reasons: [...reasons, "high_risk_action_forbidden_in_demo"] };
  }
  if (signals.impossibleTravel) {
    return { risk, allow: false, requireStepUp: true, requireHumanApproval: true, reasons: [...reasons, "session_hold_required"] };
  }
  if (requireStepUp && !input.stepUpPresent) {
    return { risk, allow: false, requireStepUp: true, requireHumanApproval, reasons: [...reasons, "step_up_required"] };
  }
  if (requireHumanApproval && !input.humanApprovalPresent) {
    return { risk, allow: false, requireStepUp, requireHumanApproval: true, reasons: [...reasons, "human_approval_required"] };
  }

  return { risk, allow: true, requireStepUp, requireHumanApproval, reasons };
}

export function actionRiskLevel(actionClass: SensitiveActionClass) {
  return actionBaseRisk[actionClass];
}
