import type { BodyLaterality } from "@/lib/clinical/body-map-types";

export type BodyMapFindingClinicalState = "active" | "resolved";
export type BodyMapCaptureSource = "clinical_capture" | "staff_intake" | "provider_review" | "structured_import";
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

/** Raw, untrusted mutation input. Validation narrows source into BodyMapCaptureSource. */
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
  source: BodyMapCaptureSource;
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
  source: BodyMapCaptureSource;
  amendsVersionId: string | null;
  createdAt: string;
  findings: PersistedBodyMapFinding[];
}

export type BodyMapValidationResult =
  | { ok: true; value: ValidatedBodyMapVersionInput }
  | { ok: false; errors: string[] };

const FUTURE_CAPTURE_TOLERANCE_MS = 5 * 60 * 1000;

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

const CAPTURE_SOURCES = new Set<BodyMapCaptureSource>([
  "clinical_capture",
  "staff_intake",
  "provider_review",
  "structured_import",
]);

function isBodyMapCaptureSource(value: string): value is BodyMapCaptureSource {
  return CAPTURE_SOURCES.has(value as BodyMapCaptureSource);
}

function normalizeFindingIdentitySegment(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .trim()
    .toLowerCase();
}

export function bodyMapFindingPersistenceKey(finding: Pick<CreateBodyMapFindingInput, "bodyRegion" | "laterality" | "symptom">) {
  return [
    normalizeFindingIdentitySegment(finding.bodyRegion),
    finding.laterality,
    normalizeFindingIdentitySegment(finding.symptom),
  ].join("::");
}

function normalizedNullableText(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isJsonSafeValue(value: unknown, ancestors = new WeakSet<object>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;

  const objectValue = value as object;
  if (ancestors.has(objectValue)) return false;
  ancestors.add(objectValue);

  try {
    if (Array.isArray(value)) {
      return value.every((item) => isJsonSafeValue(item, ancestors));
    }
    if (!isPlainRecord(value)) return false;
    return Object.values(value).every((item) => isJsonSafeValue(item, ancestors));
  } catch {
    return false;
  } finally {
    ancestors.delete(objectValue);
  }
}

export function validateBodyMapVersionInput(
  input: CreateBodyMapVersionInput,
  now = new Date(),
): BodyMapValidationResult {
  const errors: string[] = [];
  if (!isPlainRecord(input)) return { ok: false, errors: ["BodyMap payload must be an object."] };

  const runtimeInput = input as CreateBodyMapVersionInput & Record<string, unknown>;
  if ("stage" in runtimeInput) {
    errors.push("BodyMap comparison stage is derived and must not be persisted.");
  }

  const capturedTime = input.capturedAt instanceof Date ? input.capturedAt.getTime() : Number.NaN;
  const nowTime = now instanceof Date ? now.getTime() : Number.NaN;
  if (!Number.isFinite(capturedTime)) {
    errors.push("BodyMap capturedAt must be a valid timestamp.");
  } else if (!Number.isFinite(nowTime)) {
    errors.push("BodyMap validation clock must be a valid timestamp.");
  } else if (capturedTime > nowTime + FUTURE_CAPTURE_TOLERANCE_MS) {
    errors.push("BodyMap capturedAt cannot be materially future-dated.");
  }

  const sourceCandidate = typeof input.source === "string" ? input.source.trim() : "";
  const source = isBodyMapCaptureSource(sourceCandidate) ? sourceCandidate : null;
  if (source === null) {
    errors.push("BodyMap source must be a governed machine capture source.");
  }

  if (!Array.isArray(input.findings)) {
    errors.push("BodyMap findings must be an array.");
    return { ok: false, errors };
  }
  if (input.findings.length === 0) {
    errors.push("BodyMap must contain at least one explicit finding; omission has no resolution meaning.");
  }

  const seenKeys = new Set<string>();
  const normalizedFindings: ValidatedBodyMapFindingInput[] = [];

  for (const [index, rawFinding] of input.findings.entries()) {
    if (!isPlainRecord(rawFinding)) {
      errors.push(`Finding ${index + 1}: finding must be an object.`);
      continue;
    }

    const finding = rawFinding as unknown as CreateBodyMapFindingInput;
    const bodyRegion = typeof finding.bodyRegion === "string" ? finding.bodyRegion.trim() : "";
    const symptom = typeof finding.symptom === "string" ? finding.symptom.trim() : "";

    if (!bodyRegion) errors.push(`Finding ${index + 1}: body region is required.`);
    if (!symptom) errors.push(`Finding ${index + 1}: symptom is required.`);
    if (!LATERALITIES.has(finding.laterality)) errors.push(`Finding ${index + 1}: laterality is invalid.`);
    if (!CLINICAL_STATES.has(finding.clinicalState)) errors.push(`Finding ${index + 1}: clinical state is invalid.`);

    if (finding.severity !== null && (
      typeof finding.severity !== "number"
      || !Number.isFinite(finding.severity)
      || !Number.isInteger(finding.severity)
      || finding.severity < 0
      || finding.severity > 10
    )) {
      errors.push(`Finding ${index + 1}: severity must be a whole number from 0 through 10 or null.`);
    }
    if (finding.clinicalState === "resolved" && typeof finding.severity === "number" && finding.severity !== 0) {
      errors.push(`Finding ${index + 1}: resolved findings may only carry severity 0 or null.`);
    }

    const sourceObservation = finding.sourceObservation;
    if (sourceObservation !== null && (!isPlainRecord(sourceObservation) || !isJsonSafeValue(sourceObservation))) {
      errors.push(`Finding ${index + 1}: source observation must be a recursively JSON-safe object or null.`);
    }

    const key = bodyMapFindingPersistenceKey({
      bodyRegion,
      laterality: finding.laterality,
      symptom,
    });
    if (seenKeys.has(key)) errors.push(`Duplicate BodyMap finding identity: ${key}.`);
    seenKeys.add(key);

    const functionalImpact = normalizedNullableText(finding.functionalImpact);
    if (functionalImpact === undefined) errors.push(`Finding ${index + 1}: functional impact must be text or null.`);

    const radiation = normalizedNullableText(finding.radiation);
    if (radiation === undefined) errors.push(`Finding ${index + 1}: radiation must be text or null.`);

    const annotationValues = Array.isArray(finding.annotations) ? finding.annotations : [];
    const annotationsAreStrings = annotationValues.every((annotation) => typeof annotation === "string");
    if (!Array.isArray(finding.annotations) || !annotationsAreStrings) {
      errors.push(`Finding ${index + 1}: annotations must contain only strings.`);
    }
    const annotations = annotationsAreStrings
      ? (annotationValues as string[]).map((annotation) => annotation.trim())
      : [];

    normalizedFindings.push({
      findingKey: key,
      bodyRegion,
      laterality: finding.laterality,
      symptom,
      severity: finding.severity,
      clinicalState: finding.clinicalState,
      functionalImpact: functionalImpact ?? null,
      radiation: radiation ?? null,
      annotations,
      sourceObservation: sourceObservation !== null && isPlainRecord(sourceObservation) && isJsonSafeValue(sourceObservation)
        ? sourceObservation
        : null,
    });
  }

  if (errors.length > 0 || source === null) return { ok: false, errors };

  return {
    ok: true,
    value: {
      capturedAt: new Date(capturedTime),
      source,
      findings: normalizedFindings,
    },
  };
}
