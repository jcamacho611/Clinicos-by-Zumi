import type { MatchCandidate } from "@/lib/orchestration/contracts";

export type MatchDimension<T> = {
  key: string;
  weight: number;
  required?: boolean;
  evaluate: (candidate: T) => { pass: boolean; score: number; reason: string };
};

export function rankMatches<T extends { id: string }>(input: {
  candidates: readonly T[];
  dimensions: readonly MatchDimension<T>[];
}) {
  const ranked: MatchCandidate<T>[] = input.candidates.map((candidate) => {
    const reasons: string[] = [];
    const blockers: string[] = [];
    let score = 0;
    let eligible = true;

    for (const dimension of input.dimensions) {
      const result = dimension.evaluate(candidate);
      reasons.push(`${dimension.key}: ${result.reason}`);
      if (dimension.required && !result.pass) {
        eligible = false;
        blockers.push(result.reason);
      }
      if (result.pass) score += Math.max(0, Math.min(1, result.score)) * dimension.weight;
    }

    return { id: candidate.id, item: candidate, eligible, score, reasons, blockers };
  });

  return ranked.sort((a, b) => {
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    return b.score - a.score;
  });
}

export function availabilityOverlap(input: {
  requestedStart: Date;
  requestedEnd: Date;
  availableStart: Date;
  availableEnd: Date;
}) {
  const overlapStart = Math.max(input.requestedStart.getTime(), input.availableStart.getTime());
  const overlapEnd = Math.min(input.requestedEnd.getTime(), input.availableEnd.getTime());
  const requested = input.requestedEnd.getTime() - input.requestedStart.getTime();
  if (requested <= 0 || overlapEnd <= overlapStart) return 0;
  return Math.min(1, (overlapEnd - overlapStart) / requested);
}

export function distanceScore(distanceMiles: number | null, maximumMiles: number | null) {
  if (distanceMiles == null || maximumMiles == null || maximumMiles <= 0) return 0;
  if (distanceMiles > maximumMiles) return 0;
  return Math.max(0, 1 - distanceMiles / maximumMiles);
}

/**
 * This engine ranks only after hard eligibility/policy checks are encoded as
 * required dimensions. It never converts a failed regulated eligibility decision
 * into a high-scoring match.
 */
export function requiredEligibilityDimension<T extends { id: string } = { id: string; eligible: boolean }>(
  evaluate: (candidate: T) => { eligible: boolean; reasons: string[] },
): MatchDimension<T> {
  return {
    key: "eligibility",
    weight: 0,
    required: true,
    evaluate(candidate) {
      const result = evaluate(candidate);
      return {
        pass: result.eligible,
        score: result.eligible ? 1 : 0,
        reason: result.eligible ? "Eligible under deterministic policy." : result.reasons.join("; ") || "Not eligible.",
      };
    },
  };
}
