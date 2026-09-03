import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const canonical = "docs/governance/KLINIKOS_SECURITY_EVIDENCE.json";
const validator = "scripts/security/validate-security-evidence.mjs";

function run(path = canonical) {
  return execFileSync(process.execPath, [validator, path], { encoding: "utf8" });
}

function mutate(mutator: (ledger: any) => void) {
  const ledger = JSON.parse(readFileSync(canonical, "utf8"));
  mutator(ledger);
  const path = resolve(mkdtempSync(resolve(tmpdir(), "k-sec-")), "ledger.json");
  writeFileSync(path, JSON.stringify(ledger));
  return path;
}

describe("P16 security evidence", () => {
  it("accepts the checked-in register", () => {
    expect(run()).toContain("Security evidence valid");
  });

  it("rejects duplicate control IDs", () => {
    const path = mutate((ledger) => ledger.controls.push({ ...ledger.controls[0] }));
    expect(() => run(path)).toThrow(/duplicate control/i);
  });

  it("rejects broad unsupported compliance claims", () => {
    const path = mutate((ledger) => {
      ledger.controls[0].allowedClaim = "HIPAA compliant";
    });
    expect(() => run(path)).toThrow(/unsupported broad claim/i);
  });

  it("rejects PHI production verified without scoped evidence", () => {
    const path = mutate((ledger) => {
      ledger.controls[0] = {
        ...ledger.controls[0], environments: ["production"], dataClasses: ["PHI"],
        capabilities: ["clinical_phi"], state: "PRODUCTION_VERIFIED",
        technicalEvidenceRefs: [], operationalEvidenceRefs: [], externalEvidenceRefs: [], legalEvidenceRefs: [],
      };
    });
    expect(() => run(path)).toThrow(/PRODUCTION_VERIFIED/i);
  });

  it("rejects placeholder ownership", () => {
    const path = mutate((ledger) => { ledger.controls[0].owner = "TBD"; });
    expect(() => run(path)).toThrow(/placeholder owner/i);
  });

  it("rejects future verification timestamps", () => {
    const path = mutate((ledger) => { ledger.controls[0].lastVerifiedAt = "2999-01-01T00:00:00Z"; });
    expect(() => run(path)).toThrow(/future verification/i);
  });

  it("rejects expired evidence that still claims production verified", () => {
    const path = mutate((ledger) => {
      ledger.controls[0] = {
        ...ledger.controls[0], environments: ["production"], dataClasses: ["PUBLIC"], capabilities: ["frontend"],
        state: "PRODUCTION_VERIFIED", technicalEvidenceRefs: ["scripts/security/browser-confidentiality-gate.mjs"],
        operationalEvidenceRefs: [".github/workflows/quality.yml"], expiresAt: "2020-01-01T00:00:00Z",
      };
    });
    expect(() => run(path)).toThrow(/expired evidence/i);
  });

  it("rejects PHI external rails without legal and external evidence", () => {
    const path = mutate((ledger) => {
      ledger.controls[0] = {
        ...ledger.controls[0], environments: ["production"], dataClasses: ["PHI"], capabilities: ["external_ai_phi"],
        state: "PRODUCTION_VERIFIED", technicalEvidenceRefs: ["src/features/zumi"], operationalEvidenceRefs: ["docs/ZUMI.md"],
        externalEvidenceRefs: [], legalEvidenceRefs: [],
      };
    });
    expect(() => run(path)).toThrow(/legal|external/i);
  });
});
