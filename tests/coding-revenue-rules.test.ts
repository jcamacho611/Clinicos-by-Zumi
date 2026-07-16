import { describe, expect, it } from "vitest";
import { buildCodingFindings, calculateReadiness, createCodingDraftSchema, reviewCodingDraftSchema } from "@/lib/coding-revenue-rules";

describe("coding revenue readiness rules", () => {
  it("requires a tenant claim draft and human review notes", () => {
    expect(createCodingDraftSchema.parse({ claimDraftId: "claim-1" }).claimDraftId).toBe("claim-1");
    expect(() => createCodingDraftSchema.parse({ claimDraftId: "" })).toThrow();
    expect(reviewCodingDraftSchema.parse({ decision: "approve", notes: "Authorized reviewer confirmed the preparation checklist." }).decision).toBe("approve");
    expect(() => reviewCodingDraftSchema.parse({ decision: "approve", notes: "ok" })).toThrow();
  });

  it("flags missing authority and unsupported diagnosis pointers", () => {
    const findings = buildCodingFindings({ encounterStatus: "DRAFT", signedAt: null, lineCount: 1, diagnosisCodes: ["E11.65"], icd10Pointers: ["I10"], hasSuperbill: true, authorizationStatus: null });
    expect(findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(["provider_signature", "diagnosis_support", "authorization_check", "supporting_records"]));
    expect(calculateReadiness(findings)).toBeLessThan(60);
  });

  it("does not penalize a signed, supported claim for authorization when not required", () => {
    const findings = buildCodingFindings({ encounterStatus: "LOCKED", signedAt: new Date(), lineCount: 1, diagnosisCodes: ["Z00.00"], icd10Pointers: ["Z00.00"], hasSuperbill: true, authorizationStatus: "not_required" });
    expect(findings.map((finding) => finding.code)).toEqual(["supporting_records"]);
    expect(calculateReadiness(findings)).toBe(95);
  });
});
