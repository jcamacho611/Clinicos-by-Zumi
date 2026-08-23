export type BodyLaterality = "left" | "right" | "bilateral" | "midline" | "not_applicable";
export type BodyMapContextType = "patient_longitudinal" | "financial_case" | "clinical_episode" | "encounter_series";
export type BodyMapSeverityScale = "zero_to_ten";

export interface BodyMapFinding {
  id: string;
  bodyRegion: string;
  laterality: BodyLaterality;
  symptom: string;
  severity: number | null;
  severityScale: BodyMapSeverityScale | null;
  functionalImpact: string | null;
  annotations: string[];
}

export interface BodyMapVersion {
  id: string;
  organizationId: string;
  patientId: string;
  encounterId: string;
  contextType: BodyMapContextType;
  contextId: string;
  capturedAt: string;
  createdByUserId: string;
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
