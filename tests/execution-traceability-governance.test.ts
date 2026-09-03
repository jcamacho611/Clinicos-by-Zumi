import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const jsonLedger = resolve(root, "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json");
const yamlLedger = resolve(root, "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml");
const validator = resolve(root, "scripts/validate-execution-traceability.mjs");

function read(path: string) {
  return readFileSync(path, "utf8");
}

function runValidator(path = jsonLedger) {
  return execFileSync(process.execPath, [validator, path], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function writeMutatedLedger(mutator: (ledger: any) => void) {
  const ledger = JSON.parse(read(jsonLedger));
  mutator(ledger);
  const dir = mkdtempSync(resolve(tmpdir(), "klinikos-trace-"));
  const path = resolve(dir, "ledger.json");
  writeFileSync(path, JSON.stringify(ledger));
  return path;
}

const validRequirement = {
  requirementId: "REQ-TEST",
  title: "Governance validator test record",
  sourceRefs: ["source:test"],
  canonRefs: ["canon:test"],
  strategyState: "NOW",
  implementationState: "PLANNED",
  programId: "P00",
  realityIds: [],
  journeyIds: [],
  frameIds: [],
  domainObjects: [],
  routeOrApiContracts: [],
  events: [],
  zumiCapabilities: [],
  monetizationClasses: ["N/A"],
  authorityGates: ["N/A"],
  securityPrivacyLegalGates: ["N/A"],
  codeDisposition: "REUSE",
  reuseTargets: ["docs/KLINIKOS_MASTER_CANON.md"],
  testContracts: ["tests/execution-traceability-governance.test.ts"],
  dependencies: [],
  owner: "Product Engineering",
  kpis: ["traceability gate green"],
  releaseWave: "W0",
  evidenceRefs: ["planned:test"],
  currentGap: "Planned test record only",
};

describe("P00 execution traceability governance", () => {
  it("has exactly one canonical machine ledger and it is JSON", () => {
    expect(existsSync(jsonLedger)).toBe(true);
    expect(existsSync(yamlLedger)).toBe(false);
  });

  it("keeps the approved commercial and authority laws machine-readable", () => {
    const ledger = JSON.parse(read(jsonLedger));
    expect(ledger.commercialLaws.personAccount).toBe("FREE");
    expect(ledger.commercialLaws.organizationActivation).toBe("COMMERCIAL");
    expect(ledger.commercialLaws.paymentNeverCreates).toEqual(
      expect.arrayContaining([
        "identity_authority",
        "professional_verification",
        "clinical_authority",
        "eligibility",
        "legal_authority",
        "tenant_permission",
        "referral_priority",
      ]),
    );
  });

  it("registers the known draft conflicts instead of silently inheriting them", () => {
    const ledger = JSON.parse(read(jsonLedger));
    const refs = ledger.openReconciliations.map((item: { subjectRef: string }) => item.subjectRef);
    expect(refs).toContain("PR#519");
    expect(refs).toContain("PR#524");
  });

  it("ships a dependency-free validator and wires it into package + Quality", () => {
    expect(existsSync(validator)).toBe(true);

    const pkg = JSON.parse(read(resolve(root, "package.json")));
    expect(pkg.scripts["governance:traceability"]).toBe(
      "node scripts/validate-execution-traceability.mjs",
    );

    const quality = read(resolve(root, ".github/workflows/quality.yml"));
    expect(quality).toContain("Validate execution traceability");
    expect(quality).toContain("npm run governance:traceability");
  });

  it("makes traceability consequences review-visible", () => {
    const template = read(resolve(root, ".github/pull_request_template.md"));
    expect(template).toContain("## Execution traceability");
    expect(template).toContain("Requirement IDs");
    expect(template).toContain("Code disposition");
    expect(template).toContain("Commercial consequence");
    expect(template).toContain("Authority / security / legal consequence");
    expect(template).toContain("Expected evidence");
  });

  it("accepts the checked-in canonical ledger", () => {
    expect(runValidator()).toContain("Execution traceability valid: 2026-09-03.2");
  });

  it("rejects duplicate requirement IDs", () => {
    const path = writeMutatedLedger((ledger) => {
      ledger.requirements = [validRequirement, { ...validRequirement }];
    });
    expect(() => runValidator(path)).toThrow(/Duplicate requirementId: REQ-TEST/);
  });

  it("rejects paid Person account regression", () => {
    const path = writeMutatedLedger((ledger) => {
      ledger.commercialLaws.personAccount = "PAID";
    });
    expect(() => runValidator(path)).toThrow(/commercialLaws.personAccount must be FREE/);
  });

  it("rejects free organization activation regression", () => {
    const path = writeMutatedLedger((ledger) => {
      ledger.commercialLaws.organizationActivation = "FREE";
    });
    expect(() => runValidator(path)).toThrow(/commercialLaws.organizationActivation must be COMMERCIAL/);
  });

  it("rejects an unknown strategy state", () => {
    const path = writeMutatedLedger((ledger) => {
      ledger.requirements = [{ ...validRequirement, strategyState: "SOON" }];
    });
    expect(() => runValidator(path)).toThrow(/strategyState has unsupported value "SOON"/);
  });

  it("rejects a requirement routed to an unknown program", () => {
    const path = writeMutatedLedger((ledger) => {
      ledger.requirements = [{ ...validRequirement, programId: "P99" }];
    });
    expect(() => runValidator(path)).toThrow(/programId references unknown program P99/);
  });

  it("rejects placeholder ownership", () => {
    const path = writeMutatedLedger((ledger) => {
      ledger.requirements = [{ ...validRequirement, owner: "TBD" }];
    });
    expect(() => runValidator(path)).toThrow(/owner contains forbidden placeholder value: TBD/);
  });

  it("requires evidence for LIVE_VERIFIED requirements", () => {
    const path = writeMutatedLedger((ledger) => {
      ledger.requirements = [{ ...validRequirement, implementationState: "LIVE_VERIFIED", evidenceRefs: [] }];
    });
    expect(() => runValidator(path)).toThrow(/evidenceRefs must not be empty/);
  });

  it("records main protection as live evidence rather than inferred documentation", () => {
    const doc = read(resolve(root, "docs/governance/GITHUB_MAIN_PROTECTION.md"));
    expect(doc).toContain("## Current enforcement state");
    expect(doc).toMatch(/ENFORCED|MANUAL_ADMIN_ACTION_REQUIRED/);
    expect(doc).toContain("## Live evidence");
    expect(doc).toContain("## Operator action");
  });
});
