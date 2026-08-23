import type { BodyLaterality } from "@/lib/clinical/body-map-types";

export type BodyMapFindingClinicalState = "active" | "resolved";
export type BodyMapSourceObservation = Record<string, unknown> | null;

export interface CreateBodyMapFindingInput {
  bodyRegion: string;
  laterality: BodyLaterality;
  symptom: string;
  severity: number | null;
  clinicalState: BodyMapFindingClinicalState;
  functionalImpact: string | null;
  radiation: string | null;
  annotations: readonly string[];
  sourceObservation: BodyMapSourceObservation;
}

export interface CreateBodyMapVersionInput {
  capturedAt: Date;
  source: string;
  findings: readonly CreateBodyMapFindingInput[];
}

export interface ValidatedBodyMapFindingInput extends CreateBodyMapFindingInput {
  findingKey: string;
  annotations: string[];
}

export interface ValidatedBodyMapVersionInput {
  capturedAt: Date;
  source: string;
  findings: ValidatedBodyMapFindingInput[];
}

export interface PersistedBodyMapFinding {
  id: string;
  findingKey: string;
  bodyRegion: string;
  laterality: BodyLaterality;
  symptom: string;
  severity: number | null;
  clinicalState: BodyMapFindingClinicalState;
  functionalImpact: string | null;
  radiation: string | null;
  annotations: string[];
  sourceObservation: BodyMapSourceObservation;
  createdAt: string;
}

export interface PersistedBodyMapVersion {
  id: string;
  organizationId: string;
  patientId: string;
  encounterId: string;
  createdByUserId: string;
  capturedAt: string;
  source: string;
  amendsVersionId: string | null;
  createdAt: string;
  findings: PersistedBodyMapFinding[];
}

export type BodyMapValidationResult =
  | { ok: true; value: ValidatedBodyMapVersionInput }
  | { ok: false; errors: string[] };

const LATERALITIES = new Set<BodyLaterality>([
  "left",
  "right",
  "bilateral",
  "midline",
  "not_applicable",
]);

const CLINICAL_STATES = new Set<BodyMapFindingClinicalState>([
  "active",
  "resolved",
]);

export function bodyMapFindingPersistenceKey(finding: Pick<CreateBodyMapFindingInput, "bodyRegion" | "laterality" | "symptom">) {
  return [
    finding.bodyRegion.trim().toLowerCase(),
    finding.laterality,
    finding.symptom.trim().toLowerCase(),
  ].join("::");
}

function normalizedNullableText(value: string | null) {
  if (value === null) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function validateBodyMapVersionInput(input: CreateBodyMapVersionInput): BodyMapValidationResult {
  const errors: string[] = [];
  const runtimeInput = input as CreateBodyMapVersionInput & Record<string, unknown>;

  if ("stage" in runtimeInput) {
    errors.push("BodyMap comparison stage is derived and must not be persisted.");
  }

  const capturedTime = input.capturedAt instanceof Date ? input.capturedAt.getTime() : Number.NaN;
  if (!Number.isFinite(capturedTime)) {
    errors.push("BodyMap capturedAt must be a valid timestamp.");
  }

  const source = typeof input.source === "string" ? input.source.trim() : "";
  if (!source) errors.push("BodyMap source is required.");

  if (!Array.isArray(input.findings)) {
    errors.push("BodyMap findings must be an array.");
    return { ok: false, errors };
  }

  const seenKeys = new Set<string>();
  const normalizedFindings: ValidatedBodyMapFindingInput[] = [];

  for (const [index, finding] of input.findings.entries()) {
    const bodyRegion = typeof finding.bodyRegion === "string" ? finding.bodyRegion.trim() : "";
    const symptom = typeof finding.symptom === "string" ? finding.symptom.trim() : "";

    if (!bodyRegion) errors.push(`Finding ${index + 1}: body region is required.`);
    if (!symptom) errors.push(`Finding ${index + 1}: symptom is required.`);
    if (!LATERALITIES.has(finding.laterality)) errors.push(`Finding ${index + 1}: laterality is invalid.`);
    if (!CLINICAL_STATES.has(finding.clinicalState)) errors.push(`Finding ${index + 1}: clinical state is invalid.`);

    if (finding.severity !== null && (
      !Number.isFinite(finding.severity)
      || !Number.isInteger(finding.severity)
      || finding.severity < 0
      || finding.severity > 10
    )) {
      errors.push(`Finding ${index + 1}: severity must be a whole number from 0 through 10 or null.`);
    }

    if (finding.sourceObservation !== null && (
      typeof finding.sourceObservation !== "object"
      || Array.isArray(finding.sourceObservation)
    )) {
      errors.push(`Finding ${index + 1}: source observation must be an object or null.`);
    }

    const key = bodyMapFindingPersistenceKey({
      bodyRegion,
      laterality: finding.laterality,
      symptom,
    });
    if (seenKeys.has(key)) errors.push(`Duplicate BodyMap finding identity: ${key}.`);
    seenKeys.add(key);

    const annotations = Array.isArray(finding.annotations)
      ? finding.annotations.map((annotation) => annotation.trim())
      : [];
    if (!Array.isArray(finding.annotations) || finding.annotations.some((annotation) => typeof annotation !== "string")) {
      errors.push(`Finding ${index + 1}: annotations must contain only strings.`);
    }

    normalizedFindings.push({
      findingKey: key,
      bodyRegion,
      laterality: finding.laterality,
      symptom,
      severity: finding.severity,
      clinicalState: finding.clinicalState,
      functionalImpact: normalizedNullableText(finding.functionalImpact),
      radiation: normalizedNullableText(finding.radiation),
      annotations,
      sourceObservation: finding.sourceObservation,
    });
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      capturedAt: new Date(capturedTime),
      source,
      findings: normalizedFindings,
    },
  };
}
