import type { LabResult, PatientImagingResult } from "@/lib/types";

const MAX_VISIBLE_RESULTS_PER_DOMAIN = 6;
const MAX_VISIBLE_LAB_ITEMS = 100;

type LabEvidence = Pick<
  LabResult,
  | "id"
  | "panel"
  | "resultedAt"
  | "reviewStatus"
  | "critical"
  | "abnormalCount"
  | "source"
  | "sourceReference"
  | "version"
  | "correctionOfId"
> & {
  items: LabResult["items"];
  totalItemCount: number;
  itemsTruncated: boolean;
};

type ImagingEvidence = Pick<
  PatientImagingResult,
  | "id"
  | "title"
  | "study"
  | "modality"
  | "bodyPart"
  | "facility"
  | "source"
  | "sourceReference"
  | "findings"
  | "impression"
  | "studyPerformedAt"
  | "status"
  | "urgentSourceFlag"
  | "version"
  | "correctionOfId"
>;

export interface CurrentVisitClinicalEvidence {
  status: "available" | "none_available";
  labs: LabEvidence[];
  imaging: ImagingEvidence[];
  attention: {
    labNeedsReview: number;
    criticalLabs: number;
    correctedLabs: number;
    urgentImaging: number;
  };
  externalCompletion: "not_inferred";
}

export interface CurrentVisitEvidenceReaders {
  listLabsForPatient: (patientId: string, organizationId: string) => Promise<LabResult[]>;
  listImagingForPatient: (patientId: string, organizationId: string) => Promise<PatientImagingResult[]>;
}

function assertPatientMatch(
  patientId: string,
  labs: LabResult[],
  imaging: PatientImagingResult[],
) {
  if (
    labs.some((result) => result.patientId !== patientId)
    || imaging.some((result) => result.patientId !== patientId)
  ) {
    throw new Error("Clinical evidence patient mismatch");
  }
}

export function buildCurrentVisitClinicalEvidence(
  patientId: string,
  input: { labs: LabResult[]; imaging: PatientImagingResult[] },
): CurrentVisitClinicalEvidence {
  assertPatientMatch(patientId, input.labs, input.imaging);

  const labs = input.labs.slice(0, MAX_VISIBLE_RESULTS_PER_DOMAIN).map((result) => ({
    id: result.id,
    panel: result.panel,
    resultedAt: result.resultedAt,
    reviewStatus: result.reviewStatus,
    critical: result.critical,
    abnormalCount: result.abnormalCount,
    source: result.source,
    sourceReference: result.sourceReference,
    version: result.version,
    correctionOfId: result.correctionOfId,
    totalItemCount: result.items.length,
    itemsTruncated: result.items.length > MAX_VISIBLE_LAB_ITEMS,
    items: result.items.slice(0, MAX_VISIBLE_LAB_ITEMS),
  }));

  const imaging = input.imaging.slice(0, MAX_VISIBLE_RESULTS_PER_DOMAIN).map((result) => ({
    id: result.id,
    title: result.title,
    study: result.study,
    modality: result.modality,
    bodyPart: result.bodyPart,
    facility: result.facility,
    source: result.source,
    sourceReference: result.sourceReference,
    findings: result.findings,
    impression: result.impression,
    studyPerformedAt: result.studyPerformedAt,
    status: result.status,
    urgentSourceFlag: result.urgentSourceFlag,
    version: result.version,
    correctionOfId: result.correctionOfId,
  }));

  return {
    status: labs.length || imaging.length ? "available" : "none_available",
    labs,
    imaging,
    /* Counted over everything the repository returned, not over the truncated display
       arrays. The display is bounded to MAX_VISIBLE_RESULTS_PER_DOMAIN; counting the
       bounded copy meant a critical result sitting in position seven or later produced
       no badge at all, so genuinely unresolved clinical work looked handled. Attention
       must describe the authorized set; truncation may only shorten what is shown. */
    attention: {
      labNeedsReview: input.labs.filter((result) => result.reviewStatus === "Needs Review").length,
      criticalLabs: input.labs.filter((result) => result.critical).length,
      correctedLabs: input.labs.filter((result) => result.reviewStatus === "Corrected").length,
      urgentImaging: input.imaging.filter((result) => result.urgentSourceFlag).length,
    },
    externalCompletion: "not_inferred",
  };
}

export async function loadCurrentVisitClinicalEvidence(
  patientId: string,
  organizationId: string,
  readers: CurrentVisitEvidenceReaders,
): Promise<CurrentVisitClinicalEvidence> {
  const [labs, imaging] = await Promise.all([
    readers.listLabsForPatient(patientId, organizationId),
    readers.listImagingForPatient(patientId, organizationId),
  ]);

  return buildCurrentVisitClinicalEvidence(patientId, { labs, imaging });
}
