import { z } from "zod";

export const createCodingDraftSchema = z.object({
  claimDraftId: z.string().min(1),
});

export const reviewCodingDraftSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  notes: z.string().trim().min(12).max(1000),
});

export type CodingFinding = {
  code: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  owner: "provider" | "biller" | "staff";
};

export function readinessTone(score: number) {
  if (score >= 90) return "ready";
  if (score >= 70) return "needs_review";
  return "blocked";
}

export function calculateReadiness(findings: CodingFinding[]) {
  const penalties = { high: 24, medium: 12, low: 5 };
  return Math.max(0, Math.min(100, 100 - findings.reduce((total, finding) => total + penalties[finding.severity], 0)));
}

export function buildCodingFindings(input: {
  encounterStatus: string | null;
  signedAt: Date | null;
  lineCount: number;
  diagnosisCodes: string[];
  icd10Pointers: string[];
  hasSuperbill: boolean;
  authorizationStatus: string | null;
}) {
  const findings: CodingFinding[] = [];
  const signed = Boolean(input.signedAt) || ["SIGNED", "LOCKED"].includes(input.encounterStatus ?? "");
  if (!signed) findings.push({ code: "provider_signature", severity: "high", title: "Provider signature is missing", detail: "The encounter must be signed or locked by the responsible provider before claim review can be completed.", owner: "provider" });
  if (!input.hasSuperbill) findings.push({ code: "superbill_missing", severity: "high", title: "Superbill is missing", detail: "Create or reconcile the encounter superbill before a biller reviews the claim.", owner: "biller" });
  if (!input.lineCount) findings.push({ code: "claim_line_missing", severity: "high", title: "No claim line is present", detail: "A CPT or procedure line must be confirmed by billing staff before the claim can move forward.", owner: "biller" });
  const knownCodes = new Set(input.diagnosisCodes);
  const unsupportedPointers = input.icd10Pointers.filter((code) => !knownCodes.has(code));
  if (unsupportedPointers.length) findings.push({ code: "diagnosis_support", severity: "high", title: "Diagnosis support needs reconciliation", detail: `Claim pointers do not match the encounter diagnosis list: ${unsupportedPointers.join(", ")}.`, owner: "provider" });
  if (!input.diagnosisCodes.length) findings.push({ code: "diagnosis_missing", severity: "high", title: "Diagnosis support is missing", detail: "At least one encounter diagnosis must be reviewed and linked to the service line.", owner: "provider" });
  if (!input.authorizationStatus || !["approved", "not_required"].includes(input.authorizationStatus)) findings.push({ code: "authorization_check", severity: "medium", title: "Authorization status needs confirmation", detail: "ClinicOS cannot guarantee payer authorization. Staff must document the manual check or attach an approved authorization.", owner: "staff" });
  findings.push({ code: "supporting_records", severity: "low", title: "Confirm supporting records", detail: "Before submission, the biller should confirm that the documentation and any required results are attached to the claim packet.", owner: "biller" });
  return findings;
}
