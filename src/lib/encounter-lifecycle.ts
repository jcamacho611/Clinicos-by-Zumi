import type { Encounter } from "@/lib/types";

export const encounterStatusLabels = {
  DRAFT: "Draft",
  READY_FOR_REVIEW: "Ready for Review",
  SIGNED: "Signed",
  LOCKED: "Locked",
  ADDENDUM_NEEDED: "Addendum Needed",
} as const satisfies Record<string, Encounter["status"]>;

export type EncounterStatusKey = keyof typeof encounterStatusLabels;
export type EncounterTransition = "ready_for_review" | "sign_and_lock";

export function encounterStatusLabel(value: string): Encounter["status"] {
  return encounterStatusLabels[value as EncounterStatusKey] ?? "Draft";
}

export function canEditEncounter(status: string) {
  return status === "DRAFT";
}

export function canTransitionEncounter(status: string, transition: EncounterTransition) {
  if (transition === "ready_for_review") return status === "DRAFT";
  return status === "READY_FOR_REVIEW";
}

export function missingEncounterReviewFields(encounter: {
  chiefComplaint: string | null;
  hpi: string | null;
  assessment: string | null;
  plan: string | null;
}) {
  const fields = [
    ["Chief complaint", encounter.chiefComplaint],
    ["HPI", encounter.hpi],
    ["Assessment", encounter.assessment],
    ["Plan", encounter.plan],
  ] as const;

  return fields.filter(([, value]) => !value?.trim()).map(([label]) => label);
}
