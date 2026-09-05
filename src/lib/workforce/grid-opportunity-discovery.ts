import type { DomainEvent, MatchCandidate } from "@/lib/orchestration/contracts";
import {
  rankMatches,
  requiredEligibilityDimension,
  type MatchDimension,
} from "@/lib/orchestration/matching-engine";

export type WorkforceCareerPreferences = {
  skills: string[];
  careerGoals: string[];
  locationPreferences: string[];
  availabilityPreferences: string[];
};

export type WorkforceGridOpportunity = {
  id: string;
  organizationId: string;
  title: string;
  category: string;
  serviceName: string | null;
  city: string | null;
  state: string | null;
  requiredSkills: string[];
  availabilityLabels: string[];
  eligibility: {
    eligible: boolean;
    reasons: string[];
  };
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function nonEmptyNormalized(values: readonly string[]) {
  return values.map(normalize).filter(Boolean);
}

function fractionMatched(required: readonly string[], available: readonly string[]) {
  const wanted = nonEmptyNormalized(required);
  if (wanted.length === 0) return 0;
  const have = new Set(nonEmptyNormalized(available));
  const matched = wanted.filter((value) => have.has(value)).length;
  return matched / wanted.length;
}

function textContainsPreference(textValues: readonly (string | null)[], preferences: readonly string[]) {
  const haystack = textValues
    .filter((value): value is string => Boolean(value?.trim()))
    .map(normalize)
    .join(" ");
  if (!haystack) return 0;

  return nonEmptyNormalized(preferences).some(
    (preference) => haystack.includes(preference) || preference.includes(haystack),
  )
    ? 1
    : 0;
}

function locationScore(opportunity: WorkforceGridOpportunity, preferences: readonly string[]) {
  if (!opportunity.city && !opportunity.state) return 0;
  const locations = [opportunity.city, opportunity.state]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(normalize);
  const wanted = nonEmptyNormalized(preferences);
  if (wanted.length === 0 || locations.length === 0) return 0;

  return wanted.some((preference) =>
    locations.some(
      (location) =>
        preference === location ||
        preference.includes(location) ||
        location.includes(preference),
    ),
  )
    ? 1
    : 0;
}

/**
 * Rank Grid opportunities for workforce discovery.
 *
 * CareerArtifact information is deliberately soft preference data only. The required
 * eligibility dimension is evaluated first-class by the shared orchestration matcher,
 * and no amount of resume/career fit can turn an ineligible opportunity into an
 * eligible one.
 */
export function rankWorkforceGridOpportunities(input: {
  career: WorkforceCareerPreferences;
  opportunities: readonly WorkforceGridOpportunity[];
}): MatchCandidate<WorkforceGridOpportunity>[] {
  const dimensions: MatchDimension<WorkforceGridOpportunity>[] = [
    requiredEligibilityDimension((candidate) => candidate.eligibility),
    {
      key: "skills",
      weight: 35,
      evaluate(candidate) {
        const score = fractionMatched(candidate.requiredSkills, input.career.skills);
        return {
          pass: true,
          score,
          reason: score > 0 ? "Saved skill preferences overlap." : "No known skill preference overlap.",
        };
      },
    },
    {
      key: "career-goals",
      weight: 25,
      evaluate(candidate) {
        const score = textContainsPreference(
          [candidate.title, candidate.category, candidate.serviceName],
          input.career.careerGoals,
        );
        return {
          pass: true,
          score,
          reason: score > 0 ? "Saved career goals overlap." : "No known career-goal overlap.",
        };
      },
    },
    {
      key: "location",
      weight: 25,
      evaluate(candidate) {
        const score = locationScore(candidate, input.career.locationPreferences);
        return {
          pass: true,
          score,
          reason: score > 0 ? "Saved location preferences overlap." : "No known location preference overlap.",
        };
      },
    },
    {
      key: "availability",
      weight: 15,
      evaluate(candidate) {
        const score = fractionMatched(
          candidate.availabilityLabels,
          input.career.availabilityPreferences,
        );
        return {
          pass: true,
          score,
          reason: score > 0 ? "Saved availability preferences overlap." : "No known availability preference overlap.",
        };
      },
    },
  ];

  return rankMatches({ candidates: input.opportunities, dimensions });
}

/**
 * Convert an already-eligible ranked Grid opportunity into a safe workflow event.
 *
 * The payload intentionally excludes resume source/provenance, matching internals,
 * credential evidence, malpractice/privilege evidence, PHI, and any consequential
 * action. The recipient still has to review the opportunity and pass the normal Grid
 * transaction lifecycle before anything can be accepted or reserved.
 */
export function createWorkforceGridMatchEvent(input: {
  personId: string;
  match: MatchCandidate<WorkforceGridOpportunity>;
  occurredAt: Date;
}): DomainEvent {
  if (!input.match.eligible) {
    throw new Error("A workforce Grid alert requires an eligible opportunity.");
  }

  const opportunity = input.match.item;
  return {
    id: `grid-match:${input.personId}:${opportunity.id}:${input.occurredAt.getTime()}`,
    type: "grid_match_available",
    actorId: input.personId,
    organizationId: opportunity.organizationId,
    sourceType: "grid",
    sourceId: opportunity.id,
    severity: "attention",
    occurredAt: input.occurredAt,
    payload: {
      label: "New Grid opportunity",
      detail:
        "A verified-eligibility Grid opportunity may fit your saved career preferences. Review it before taking action.",
      opportunityId: opportunity.id,
      title: opportunity.title,
      href: "/grid",
    },
  };
}
