import { rankMatches, requiredEligibilityDimension, type MatchDimension } from "@/lib/orchestration/matching-engine";

export type ExpertCapabilityDomain =
  | "quality"
  | "revenue_cycle"
  | "credentialing"
  | "prior_authorization"
  | "compliance"
  | "privacy"
  | "security"
  | "interoperability"
  | "clinical_informatics"
  | "operations"
  | "education"
  | "billing"
  | "coding"
  | "patient_experience"
  | "population_health";

export type ExpertDataAccessClass = "none" | "deidentified" | "limited_phi" | "phi";

export type ExpertGridProfile = {
  id: string;
  participantId: string;
  organizationId?: string | null;
  displayName: string;
  capabilityKeys: string[];
  capabilityDomains: ExpertCapabilityDomain[];
  jurisdictionKeys: string[];
  verifiedEvidenceKeys: string[];
  available: boolean;
  remoteAvailable: boolean;
  onsiteLocationKeys: string[];
  approvedDataAccessClass: ExpertDataAccessClass;
  conflictedOrganizationIds: string[];
  outcomeScore?: number | null;
  completedEngagements?: number | null;
  priceCents?: number | null;
};

export type ExpertEngagementNeed = {
  id: string;
  organizationId: string;
  capabilityKey: string;
  capabilityDomain: ExpertCapabilityDomain;
  jurisdictionKey?: string | null;
  remoteAllowed: boolean;
  onsiteLocationKey?: string | null;
  requiredEvidenceKeys: string[];
  requiredAgreementEvidenceKeys: string[];
  requiredDataAccessClass: ExpertDataAccessClass;
  urgency: "routine" | "priority" | "urgent" | "critical";
  maxPriceCents?: number | null;
};

const dataAccessRank: Record<ExpertDataAccessClass, number> = {
  none: 0,
  deidentified: 1,
  limited_phi: 2,
  phi: 3,
};

export function evaluateExpertGridEligibility(input: {
  need: ExpertEngagementNeed;
  expert: ExpertGridProfile;
}) {
  const blockers: string[] = [];
  const reasons: string[] = [];
  const { need, expert } = input;

  if (!expert.available) blockers.push("Expert is not currently available for new engagements.");
  if (!expert.capabilityKeys.includes(need.capabilityKey)) blockers.push(`Missing required capability: ${need.capabilityKey}.`);
  if (!expert.capabilityDomains.includes(need.capabilityDomain)) blockers.push(`Missing required expert domain: ${need.capabilityDomain}.`);
  if (expert.conflictedOrganizationIds.includes(need.organizationId)) blockers.push("Conflict-of-interest policy blocks this organization match.");

  if (need.jurisdictionKey && !expert.jurisdictionKeys.includes(need.jurisdictionKey)) {
    blockers.push(`Jurisdiction evidence is not available for ${need.jurisdictionKey}.`);
  }

  const missingEvidence = need.requiredEvidenceKeys.filter((key) => !expert.verifiedEvidenceKeys.includes(key));
  if (missingEvidence.length) blockers.push(`Missing verified evidence: ${missingEvidence.join(", ")}.`);

  if (dataAccessRank[expert.approvedDataAccessClass] < dataAccessRank[need.requiredDataAccessClass]) {
    blockers.push(`Approved data-access class ${expert.approvedDataAccessClass} is below required ${need.requiredDataAccessClass}.`);
  }

  if (need.remoteAllowed) {
    if (expert.remoteAvailable) reasons.push("Remote delivery is available.");
    else if (need.onsiteLocationKey && expert.onsiteLocationKeys.includes(need.onsiteLocationKey)) reasons.push("On-site delivery is available at the requested location.");
    else blockers.push("No compatible remote or on-site delivery mode is available.");
  } else if (!need.onsiteLocationKey || !expert.onsiteLocationKeys.includes(need.onsiteLocationKey)) {
    blockers.push("Required on-site location is not available for this expert.");
  }

  if (need.maxPriceCents != null && expert.priceCents != null && expert.priceCents > need.maxPriceCents) {
    blockers.push("Expert price exceeds the engagement's configured maximum.");
  }

  if (!blockers.length) reasons.push("Expert passed deterministic matching eligibility checks.");

  return {
    eligible: blockers.length === 0,
    blockers,
    reasons,
  };
}

export function rankExpertGridMatches(input: {
  need: ExpertEngagementNeed;
  experts: readonly ExpertGridProfile[];
}) {
  const dimensions: MatchDimension<ExpertGridProfile>[] = [
    requiredEligibilityDimension<ExpertGridProfile>((expert) => {
      const result = evaluateExpertGridEligibility({ need: input.need, expert });
      return { eligible: result.eligible, reasons: result.blockers.length ? result.blockers : result.reasons };
    }),
    {
      key: "outcomes",
      weight: 45,
      evaluate(expert) {
        const score = Math.max(0, Math.min(1, expert.outcomeScore ?? 0));
        return {
          pass: true,
          score,
          reason: expert.outcomeScore == null ? "No outcome score is available yet." : `Verified outcome score ${score.toFixed(2)}.`,
        };
      },
    },
    {
      key: "experience",
      weight: 20,
      evaluate(expert) {
        const completed = Math.max(0, expert.completedEngagements ?? 0);
        const score = Math.min(1, completed / 25);
        return { pass: true, score, reason: `${completed} completed governed engagement(s).` };
      },
    },
    {
      key: "verified-evidence",
      weight: 20,
      evaluate(expert) {
        const required = input.need.requiredEvidenceKeys.length;
        if (required === 0) return { pass: true, score: 1, reason: "No additional verification evidence is required for matching." };
        const matched = input.need.requiredEvidenceKeys.filter((key) => expert.verifiedEvidenceKeys.includes(key)).length;
        return { pass: matched === required, score: matched / required, reason: `${matched}/${required} required evidence keys are verified.` };
      },
    },
    {
      key: "price-fit",
      weight: 15,
      evaluate(expert) {
        if (input.need.maxPriceCents == null || expert.priceCents == null) return { pass: true, score: 0.5, reason: "Comparable price evidence is incomplete." };
        const ratio = expert.priceCents / Math.max(1, input.need.maxPriceCents);
        return { pass: ratio <= 1, score: Math.max(0, 1 - ratio * 0.5), reason: ratio <= 1 ? "Price is within configured maximum." : "Price exceeds configured maximum." };
      },
    },
  ];

  return rankMatches({ candidates: input.experts, dimensions });
}

/**
 * Matching eligibility is not data-access authorization. A Grid match must still
 * proceed through engagement terms, purpose-bound authorization, minimum-
 * necessary access, governed agreement requirements, and human approval before
 * sensitive clinic or patient data becomes visible to an outside expert.
 */
export function expertGridEngagementRequiresScopedAccess(need: ExpertEngagementNeed) {
  return need.requiredDataAccessClass !== "none";
}
