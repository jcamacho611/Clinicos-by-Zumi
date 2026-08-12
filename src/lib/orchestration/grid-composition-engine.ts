export type GridSlotKind =
  | "participant"
  | "resource"
  | "location"
  | "time"
  | "consent"
  | "payment"
  | "credential"
  | "authorization";

export type GridCompositionSlot = {
  key: string;
  kind: GridSlotKind;
  required: boolean;
  quantity?: number;
  policyClass?: string | null;
  description?: string | null;
};

export type GridCompositionTemplate = {
  id: string;
  title: string;
  slots: GridCompositionSlot[];
};

export type GridSlotCandidate = {
  id: string;
  slotKey: string;
  eligible: boolean;
  available: boolean;
  score: number;
  blockers: string[];
  metadata?: Record<string, unknown>;
};

export type GridCompositionAssignment = {
  slotKey: string;
  candidateIds: string[];
  satisfied: boolean;
  blockers: string[];
};

export type GridCompositionResult = {
  templateId: string;
  complete: boolean;
  assignments: GridCompositionAssignment[];
  blockers: string[];
};

function candidateRank(candidate: GridSlotCandidate) {
  if (!candidate.eligible || !candidate.available) return Number.NEGATIVE_INFINITY;
  return Number.isFinite(candidate.score) ? candidate.score : 0;
}

/**
 * Assemble a multi-party Grid opportunity without allowing soft score to bypass
 * eligibility or availability. Every required slot must be satisfied before a
 * composition can proceed to offer/agreement/booking.
 */
export function composeGridOpportunity(input: {
  template: GridCompositionTemplate;
  candidates: readonly GridSlotCandidate[];
}): GridCompositionResult {
  const assignments: GridCompositionAssignment[] = [];
  const blockers: string[] = [];

  for (const slot of input.template.slots) {
    const requiredQuantity = Math.max(1, slot.quantity ?? 1);
    const slotCandidates = input.candidates
      .filter((candidate) => candidate.slotKey === slot.key)
      .sort((a, b) => candidateRank(b) - candidateRank(a));

    const eligible = slotCandidates.filter((candidate) => candidate.eligible && candidate.available);
    const selected = eligible.slice(0, requiredQuantity);
    const satisfied = selected.length >= requiredQuantity;

    const slotBlockers = satisfied
      ? []
      : Array.from(new Set([
          ...slotCandidates.flatMap((candidate) => candidate.blockers),
          ...(slotCandidates.some((candidate) => candidate.eligible && !candidate.available)
            ? [`${slot.key}: eligible resource is not available in the requested window.`]
            : []),
          ...(slotCandidates.length === 0 ? [`${slot.key}: no candidate resource found.`] : []),
          ...(slotCandidates.length > 0 && !slotCandidates.some((candidate) => candidate.eligible)
            ? [`${slot.key}: no candidate satisfies deterministic eligibility.`]
            : []),
        ]));

    if (slot.required && !satisfied) blockers.push(...slotBlockers);

    assignments.push({
      slotKey: slot.key,
      candidateIds: selected.map((candidate) => candidate.id),
      satisfied: slot.required ? satisfied : true,
      blockers: slotBlockers,
    });
  }

  return {
    templateId: input.template.id,
    complete: input.template.slots.every((slot) => {
      if (!slot.required) return true;
      return assignments.find((assignment) => assignment.slotKey === slot.key)?.satisfied === true;
    }),
    assignments,
    blockers: Array.from(new Set(blockers)),
  };
}

export const GRID_COMPOSITION_TEMPLATES: readonly GridCompositionTemplate[] = [
  {
    id: "staffing-shift",
    title: "Staffing shift",
    slots: [
      { key: "professional", kind: "participant", required: true, policyClass: "regulated-professional" },
      { key: "shift", kind: "time", required: true },
      { key: "organization", kind: "location", required: true },
    ],
  },
  {
    id: "aesthetic-service",
    title: "Aesthetic service assembly",
    slots: [
      { key: "client", kind: "participant", required: true },
      { key: "clinician", kind: "participant", required: true, policyClass: "regulated-professional" },
      { key: "location", kind: "location", required: true, policyClass: "approved-care-setting" },
      { key: "appointment-window", kind: "time", required: true },
      { key: "consent", kind: "consent", required: true },
      { key: "payment", kind: "payment", required: true },
    ],
  },
  {
    id: "clinical-placement",
    title: "Clinical placement",
    slots: [
      { key: "student", kind: "participant", required: true },
      { key: "program", kind: "participant", required: true },
      { key: "preceptor", kind: "participant", required: true, policyClass: "preceptor-eligible" },
      { key: "site", kind: "location", required: true, policyClass: "clinical-placement-site" },
      { key: "placement-window", kind: "time", required: true },
    ],
  },
  {
    id: "referral-capacity",
    title: "Referral capacity",
    slots: [
      { key: "patient-need", kind: "authorization", required: true },
      { key: "specialist", kind: "participant", required: true, policyClass: "regulated-professional" },
      { key: "capacity", kind: "time", required: true },
      { key: "sharing-authority", kind: "consent", required: true },
    ],
  },
] as const;

export function getGridCompositionTemplate(id: string) {
  return GRID_COMPOSITION_TEMPLATES.find((template) => template.id === id) ?? null;
}
