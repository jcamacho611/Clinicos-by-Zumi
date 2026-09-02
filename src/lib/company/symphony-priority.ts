import "server-only";

export const symphonyRelationshipStates = [
  "COLD",
  "WARM_INTRO",
  "REFERRED",
  "SUBSTANTIVE_REPLY",
  "PROPOSAL_REQUESTED",
  "DILIGENCE_REQUESTED",
] as const;

export type SymphonyRelationshipState = (typeof symphonyRelationshipStates)[number];
export type SymphonyPriorityInput = {
  fit: number;
  eligibilityConfidence: number;
  urgency: number;
  expectedValueSignal: number;
  strategicMultiplier: number;
  effortBurden: number;
  commitmentBurden: number;
  founderActionBurden: number;
  relationshipState: SymphonyRelationshipState;
};
export type SymphonyPriorityResult = { score: number; reasons: string[] };

function bounded(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

const relationshipBonus: Record<SymphonyRelationshipState, number> = {
  COLD: 0,
  WARM_INTRO: 22,
  REFERRED: 32,
  SUBSTANTIVE_REPLY: 55,
  PROPOSAL_REQUESTED: 66,
  DILIGENCE_REQUESTED: 75,
};

const relationshipReason: Record<SymphonyRelationshipState, string | null> = {
  COLD: null,
  WARM_INTRO: "Warm introduction reduces routing friction.",
  REFERRED: "A referral provides a qualified human routing signal.",
  SUBSTANTIVE_REPLY: "A substantive reply exists and should outrank unrelated cold outreach.",
  PROPOSAL_REQUESTED: "A proposal was requested, creating a near-term execution path.",
  DILIGENCE_REQUESTED: "Diligence was requested, creating a high-priority active opportunity.",
};

export function scoreSymphonyOpportunity(input: SymphonyPriorityInput): SymphonyPriorityResult {
  const fit = bounded(input.fit);
  const eligibility = bounded(input.eligibilityConfidence);
  const urgency = bounded(input.urgency);
  const expectedValue = bounded(input.expectedValueSignal);
  const strategic = bounded(input.strategicMultiplier);
  const effort = bounded(input.effortBurden);
  const commitment = bounded(input.commitmentBurden);
  const founderBurden = bounded(input.founderActionBurden);
  const score = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        fit * 0.2 +
          eligibility * 0.2 +
          urgency * 0.14 +
          expectedValue * 0.11 +
          strategic * 0.15 -
          effort * 0.08 -
          commitment * 0.1 -
          founderBurden * 0.06 +
          relationshipBonus[input.relationshipState],
      ),
    ) * 100,
  ) / 100;

  const reasons: string[] = [];
  const relationship = relationshipReason[input.relationshipState];
  if (relationship) reasons.push(relationship);
  if (fit >= 80) reasons.push("Strong evidence-backed Klinikos fit.");
  if (eligibility >= 80) reasons.push("Eligibility confidence is high from current evidence.");
  if (urgency >= 80) reasons.push("A near-term deadline or timing window raises priority.");
  if (expectedValue >= 80) reasons.push("Potential economic value is material if the opportunity converts.");
  if (strategic >= 80) reasons.push("The opportunity can create a strong strategic multiplier beyond immediate cash.");
  if (effort >= 70) reasons.push("High execution burden reduces priority.");
  if (commitment >= 70) reasons.push("Material repayment, dilution, or commitment burden reduces priority.");
  if (founderBurden >= 70) reasons.push("Heavy founder-only action burden reduces priority.");
  if (reasons.length === 0) reasons.push("Priority reflects fit, eligibility, timing, economics, effort, commitment, and relationship state.");
  return { score, reasons };
}
