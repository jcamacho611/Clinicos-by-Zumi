import { z } from "zod";
import { CREDENTIAL_DISCLAIMER } from "@/lib/edu/edu-safety";

export const EDU_CERTIFICATE_DISCLAIMER = `${CREDENTIAL_DISCLAIMER} It does not establish clinical privileges, employment eligibility, or automatic Klinikos Grid eligibility. Regulated opportunities require separate authoritative credential, jurisdiction, insurance, organization, and policy verification.`;

export const eduCertificateTypes = ["completion", "competency_evidence"] as const;
export type EduCertificateType = (typeof eduCertificateTypes)[number];

export const issueEduCertificateSchema = z.object({
  action: z.literal("issue"),
  enrollmentId: z.string().trim().min(1).max(64),
  certificateType: z.enum(eduCertificateTypes),
  title: z.string().trim().min(3).max(160),
  competencyAreas: z.array(z.string().trim().min(2).max(100)).max(25).default([]),
});

export const revokeEduCertificateSchema = z.object({
  action: z.literal("revoke"),
  certificateId: z.string().trim().min(1).max(64),
  reason: z.string().trim().min(3).max(500),
});

export const eduCertificateMutationSchema = z.discriminatedUnion("action", [issueEduCertificateSchema, revokeEduCertificateSchema]);

export function validateEduCertificateEvidence(input: {
  certificateType: EduCertificateType;
  enrollmentStatus: string;
  requestedCompetencyAreas: readonly string[];
  demonstratedCompetencyAreas: readonly string[];
}) {
  const problems: string[] = [];
  if (input.certificateType === "completion" && input.enrollmentStatus !== "completed") {
    problems.push("Completion evidence can be issued only after the EDU enrollment is marked completed.");
  }
  if (input.certificateType === "competency_evidence") {
    const requested = [...new Set(input.requestedCompetencyAreas.map((area) => area.trim()).filter(Boolean))];
    if (!requested.length) problems.push("Competency evidence must name at least one competency area.");
    const demonstrated = new Set(input.demonstratedCompetencyAreas);
    const missing = requested.filter((area) => !demonstrated.has(area));
    if (missing.length) problems.push(`Competency has not been human-determined as demonstrated for: ${missing.join(", ")}.`);
  }
  return problems;
}

export function certificateCompetencyAreasFromAudit(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const value = (metadata as Record<string, unknown>).competencyAreas;
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean))];
}

export function certificateMayAffectProfessionalEligibility() {
  return false;
}
