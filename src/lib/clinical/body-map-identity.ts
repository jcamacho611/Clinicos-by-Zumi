import type { BodyLaterality } from "@/lib/clinical/body-map-types";

export function normalizeBodyMapIdentitySegment(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .trim()
    .toLowerCase();
}

export function bodyMapFindingIdentityKey(finding: {
  bodyRegion: string;
  laterality: BodyLaterality;
  symptom: string;
}) {
  return [
    normalizeBodyMapIdentitySegment(finding.bodyRegion),
    finding.laterality,
    normalizeBodyMapIdentitySegment(finding.symptom),
  ].join("::");
}
