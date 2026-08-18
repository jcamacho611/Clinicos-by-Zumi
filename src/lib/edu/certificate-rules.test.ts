import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EDU_CERTIFICATE_DISCLAIMER, certificateMayAffectProfessionalEligibility, validateEduCertificateEvidence } from "@/lib/edu/certificate-rules";

describe("Klinikos EDU certificate rules", () => {
  it("requires a completed enrollment before issuing completion evidence", () => {
    expect(validateEduCertificateEvidence({ certificateType: "completion", enrollmentStatus: "active", requestedCompetencyAreas: [], demonstratedCompetencyAreas: [] })).toContain("Completion evidence can be issued only after the EDU enrollment is marked completed.");
  });

  it("requires human-demonstrated competency evidence for every named area", () => {
    expect(validateEduCertificateEvidence({ certificateType: "competency_evidence", enrollmentStatus: "active", requestedCompetencyAreas: ["documentation_accuracy", "care_coordination"], demonstratedCompetencyAreas: ["documentation_accuracy"] })).toEqual(["Competency has not been human-determined as demonstrated for: care_coordination."]);
  });

  it("allows competency evidence only when all requested areas were demonstrated", () => {
    expect(validateEduCertificateEvidence({ certificateType: "competency_evidence", enrollmentStatus: "active", requestedCompetencyAreas: ["documentation_accuracy"], demonstratedCompetencyAreas: ["documentation_accuracy"] })).toEqual([]);
  });

  it("carries a permanent non-credential disclaimer", () => {
    const text = EDU_CERTIFICATE_DISCLAIMER.toLowerCase();
    expect(text).toContain("not professional licensure");
    expect(text).toContain("clinical privileges");
    expect(text).toContain("employment eligibility");
    expect(text).toContain("automatic klinikos grid eligibility");
    expect(certificateMayAffectProfessionalEligibility()).toBe(false);
  });

  it("keeps issuance and revocation server-owned and role-gated", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/app/api/edu/certificates/route.ts"), "utf8");
    expect(source).toContain('canEdu(identity.role, "certificate", "create")');
    expect(source).toContain('canEdu(identity.role, "certificate", "manage")');
    expect(source).toContain("EDU_CERTIFICATE_DISCLAIMER");
    expect(source).not.toContain("grid.eligibility");
  });
});
