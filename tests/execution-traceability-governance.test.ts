import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const jsonLedger = resolve(root, "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json");
const yamlLedger = resolve(root, "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml");
const validator = resolve(root, "scripts/validate-execution-traceability.mjs");

function read(path: string) {
  return readFileSync(path, "utf8");
}

function runValidator(path = jsonLedger) {
  return spawnSync(process.execPath, [validator, path], {
    cwd: root,
    encoding: "utf8",
  });
}

function mutatedLedger(mutator: (ledger: Record<string, unknown>) => void) {
  const dir = mkdtempSync(resolve(tmpdir(), "klinikos-traceability-"));
  const path = resolve(dir, "ledger.json");
  const ledger = JSON.parse(read(jsonLedger)) as Record<string, unknown>;
  mutator(ledger);
  writeFileSync(path, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
  return path;
}

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

  it("accepts the checked-in canonical ledger", () => {
    const result = runValidator();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Execution traceability valid");
  });

  it("rejects malformed JSON", () => {
    const dir = mkdtempSync(resolve(tmpdir(), "klinikos-traceability-bad-json-"));
    const path = resolve(dir, "ledger.json");
    writeFileSync(path, "{ not-json", "utf8");
    const result = runValidator(path);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("malformed JSON");
  });

  it("rejects duplicate requirement IDs", () => {
    const path = mutatedLedger((ledger) => {
      const planned = {
        requirementId: "REQ-DUP",
        title: "Trace one planned requirement",
        sourceRefs: ["source:accepted"],
        canonRefs: ["canon:accepted"],
        strategyState: "NOW",
        implementationState: "PLANNED",
        programId: "P00",
        realityIds: [],
        journeyIds: [],
        frameIds: ["F5"],
        domainObjects: [],
        routeOrApiContracts: [],
        events: [],
        zumiCapabilities: [],
        monetizationClasses: [],
        authorityGates: [],
        securityPrivacyLegalGates: [],
        codeDisposition: "EXTEND",
        reuseTargets: ["existing governance substrate"],
        testContracts: ["tests/execution-traceability-governance.test.ts"],
        dependencies: [],
        owner: "architecture",
        kpis: ["orphan_requirement_count"],
        releaseWave: "W0",
        evidenceRefs: [],
        currentGap: "Implementation remains planned.",
      };
      ledger.requirements = [planned, { ...planned }];
    });
    const result = runValidator(path);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("duplicate REQ-DUP");
  });

  it("rejects an unknown program reference and invalid strategy state", () => {
    const path = mutatedLedger((ledger) => {
      ledger.requirements = [{
        requirementId: "REQ-BAD-PROGRAM",
        title: "Invalid record",
        sourceRefs: ["source:accepted"],
        canonRefs: ["canon:accepted"],
        strategyState: "MAGIC",
        implementationState: "PLANNED",
        programId: "P99",
        realityIds: [],
        journeyIds: [],
        frameIds: [],
        domainObjects: [],
        routeOrApiContracts: [],
        events: [],
        zumiCapabilities: [],
        monetizationClasses: [],
        authorityGates: [],
        securityPrivacyLegalGates: [],
        codeDisposition: "REUSE",
        reuseTargets: ["governance"],
        testContracts: ["test"],
        dependencies: [],
        owner: "architecture",
        kpis: ["orphan_requirement_count"],
        releaseWave: "W0",
        evidenceRefs: [],
        currentGap: "Planned.",
      }];
    });
    const result = runValidator(path);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("unknown value MAGIC");
    expect(result.stderr).toContain("unknown program P99");
  });

  it("rejects placeholders and broken commercial authority law", () => {
    const path = mutatedLedger((ledger) => {
      const commercialLaws = ledger.commercialLaws as Record<string, unknown>;
      commercialLaws.organizationActivation = "FREE";
      const programs = ledger.programs as Record<string, Record<string, unknown>>;
      programs.P00.name = "TODO";
    });
    const result = runValidator(path);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("organizationActivation: expected COMMERCIAL");
    expect(result.stderr).toContain("placeholder values are forbidden");
  });

  it("rejects invalid reconciliation state", () => {
    const path = mutatedLedger((ledger) => {
      const reconciliations = ledger.openReconciliations as Array<Record<string, unknown>>;
      reconciliations[0].state = "IGNORE_IT";
    });
    const result = runValidator(path);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("unknown value IGNORE_IT");
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

  it("records main protection as live evidence rather than inferred documentation", () => {
    const doc = read(resolve(root, "docs/governance/GITHUB_MAIN_PROTECTION.md"));
    expect(doc).toContain("MANUAL_ADMIN_ACTION_REQUIRED");
    expect(doc).toContain("Current verified state");
    expect(doc).toContain("Required target state");
    expect(doc).toContain("Operator action required");
    expect(doc).toContain("protected: false");
    expect(doc).toContain("[]");
  });

  it("keeps execution traceability subordinate in the authority map", () => {
    const authority = read(resolve(root, "docs/KLINIKOS_AUTHORITY_MAP.yaml"));
    expect(authority).toContain("execution_traceability:");
    expect(authority).toContain("machine_ledger: docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json");
    expect(authority).toContain("authority: SUBORDINATE_EXECUTION_CONTROL");
    expect(authority).toContain("may_override_master: false");
    expect(authority).toContain("may_override_blueprint: false");
    expect(authority).toContain("may_override_verified_implementation: false");
  });
});
