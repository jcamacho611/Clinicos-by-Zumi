import type { Encounter } from "@/lib/types";

export interface LongitudinalEncounterReference {
  id: string;
  organizationId: string;
  patientId: string;
  serviceDate: Date;
  status: Encounter["status"];
}

const FINALIZED_STATUSES = new Set<Encounter["status"]>([
  "Signed",
  "Locked",
  "Addendum Needed",
]);

function validTimestamp(value: Date) {
  const timestamp = value.getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function selectPreviousFinalizedEncounter<T extends LongitudinalEncounterReference>(
  current: LongitudinalEncounterReference,
  candidates: readonly T[],
): T | null {
  const currentTime = validTimestamp(current.serviceDate);
  if (currentTime === null) return null;

  let selected: T | null = null;
  let selectedTime = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    if (candidate.id === current.id) continue;
    if (candidate.organizationId !== current.organizationId) continue;
    if (candidate.patientId !== current.patientId) continue;
    if (!FINALIZED_STATUSES.has(candidate.status)) continue;

    const candidateTime = validTimestamp(candidate.serviceDate);
    if (candidateTime === null || candidateTime >= currentTime || candidateTime <= selectedTime) continue;

    selected = candidate;
    selectedTime = candidateTime;
  }

  return selected;
}
