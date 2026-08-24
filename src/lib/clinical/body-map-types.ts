export type BodyLaterality = "left" | "right" | "bilateral" | "midline" | "not_applicable";
export type BodyMapFindingClinicalState = "active" | "resolved";

/**
 * A comparison-only role assigned when Klinikos composes longitudinal evidence.
 * It must not be persisted as authoritative clinical state because today's version
 * can become the previous version on a later encounter.
 */
export type BodyMapStage = "initial" | "previous" | "today";

export interface BodyMapFinding {
  id: string;
  bodyRegion: string;
  laterality: BodyLaterality;
  symptom: string;
  /** Normalized symptom severity on a 0-10 scale where higher means worse. */
  severity: number | null;
  /** Explicit recorded state. Omission is never interpreted as resolved. */
  clinicalState: BodyMapFindingClinicalState;
  functionalImpact: string | null;
  annotations: string[];
}

export interface BodyMapVersion {
  id: string;
  patientId: string;
  encounterId: string;
  capturedAt: string;
  createdByUserId: string;
  /** Derived comparison-only role. Persistence must derive this at read/composition time. */
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
  | "finding_resolved"
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
