export type BodyLaterality = "left" | "right" | "bilateral" | "midline" | "not_applicable";
export type BodyMapStage = "initial" | "previous" | "today";

export interface BodyMapFinding {
  id: string;
  bodyRegion: string;
  laterality: BodyLaterality;
  symptom: string;
  severity: number | null;
  functionalImpact: string | null;
  annotations: string[];
}

export interface BodyMapVersion {
  id: string;
  patientId: string;
  encounterId: string;
  capturedAt: string;
  createdByUserId: string;
  stage: BodyMapStage;
  findings: BodyMapFinding[];
}

export interface BodyMapEvidenceRef {
  bodyMapVersionId: string;
  findingId: string;
}

export type BodyMapDeltaKind =
  | "severity_improved"
  | "severity_worsened"
  | "severity_unchanged"
  | "finding_added"
  | "finding_removed"
  | "functional_impact_changed";

export interface BodyMapDelta {
  key: string;
  bodyRegion: string;
  laterality: BodyLaterality;
  symptom: string;
  kind: BodyMapDeltaKind;
  previousValue: string | number | null;
  currentValue: string | number | null;
  evidence: BodyMapEvidenceRef[];
}
