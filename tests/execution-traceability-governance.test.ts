import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

type ProgramFixture = Record<string, unknown>;
type RequirementFixture = Record<string, unknown>;
type LedgerFixture = {
  commercialLaws: {
    personAccount: string;
    organizationActivation: string;
    paymentNeverCreates: string[];
  };
  openReconciliations: Array<{ subjectRef: string }>;
  programs: ProgramFixture[];
  requirements: RequirementFixture[];
};

const root = process.cwd();
const jsonLedger = resolve(root, "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json");
const yamlLedger = resolve(root, "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml");
const validator = resolve(root, "scripts/validate-execution-traceability.mjs");
const tempDirs: string[] = [];

function read(path: string) {
  return readFileSync(path, "utf8");
}

function loadLedger(): LedgerFixture {
  return JSON.parse(read(jsonLedger)) as LedgerFixture;
}

function validateFixture(mutator: (ledger: LedgerFixture) => void) {
  const ledger = loadLedger();
  mutator(ledger);
  const dir = mkdtempSync(resolve(tmpdir(), "klinikos-traceability-"));
  tempDirs.push(dir);
  const fixture = resolve(dir, "ledger.json");
  writeFileSync(fixture, `${JSON.stringify(ledger, null, 2)}\n`);
  return spawnSync(process.execPath, [validator, fixture], {
    cwd: root,
    encoding: "utf8",
  });
}

afterEach(() => {
  while (tempDirs.length) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("P00 execution traceability governance", () => {
  it("has exactly one canonical machine ledger and it is JSON", () => {
    expect(existsSync(jsonLedger)).toBe(true);
    expect(existsSync(yamlLedger)).toBe(false);
  });

  it("keeps the approved commercial and authority laws machine-readable", () => {
    const ledger = loadLedger();
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
    const ledger = loadLedger();
    const refs = ledger.openReconciliations.map((item) => item.subjectRef);
    expect(refs).toContain("PR#519");
    expect(refs).toContain("PR#524");
  });

  it("ships a dependency-free validator and wires it into package + Quality", () => {
    expect(existsSync(validator)).toBe(true);

    const pkg = JSON.parse(read(resolve(root, "package.json"))) as {
      scripts: Record<string, string>;
    };
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

  it("rejects duplicate program IDs deterministically", () => {
    const result = validateFixture((ledger) => {
      ledger.programs.push({ ...ledger.programs[0] });
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain("Duplicate program id: P00");
  });

  it("rejects requirements routed to a non-existent program", () => {
    const result = validateFixture((ledger) => {
      ledger.requirements.push({
        requirementId: "REQ-TEST-UNKNOWN-PROGRAM",
        title: "Validator fixture",
        sourceRefs: ["test://fixture"],
        canonRefs: ["docs/KLINIKOS_MASTER_CANON.md"],
        truthClass: "ACTUAL",
        strategyState: "NOW",
        implementationState: "NOT_BUILT",
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
        codeDisposition: "EXTEND",
        reuseTargets: [],
        testContracts: ["tests/execution-traceability-governance.test.ts"],
        dependencies: [],
        owner: "P00",
        kpis: ["validator rejects invalid routing"],
        releaseWave: "P00",
        evidenceRefs: [],
        currentGap: "Fixture is intentionally invalid.",
      });
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      "requirements[0].programId references unknown program: P99",
    );
  });

  it("rejects a payment-to-authority violation", () => {
    const result = validateFixture((ledger) => {
      ledger.commercialLaws.paymentNeverCreates = ["clinical_authority"];
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      "commercialLaws.paymentNeverCreates is missing protected authority: identity_authority",
    );
  });

  it("rejects placeholder ownership in an accepted requirement", () => {
    const result = validateFixture((ledger) => {
      ledger.requirements.push({
        requirementId: "REQ-TEST-PLACEHOLDER",
        title: "Validator fixture",
        sourceRefs: ["test://fixture"],
        canonRefs: ["docs/KLINIKOS_MASTER_CANON.md"],
        truthClass: "ACTUAL",
        strategyState: "NOW",
        implementationState: "NOT_BUILT",
        programId: "P00",
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
        codeDisposition: "EXTEND",
        reuseTargets: [],
        testContracts: ["tests/execution-traceability-governance.test.ts"],
        dependencies: [],
        owner: "TBD",
        kpis: ["validator rejects placeholders"],
        releaseWave: "P00",
        evidenceRefs: [],
        currentGap: "Fixture is intentionally invalid.",
      });
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      "requirements[0].owner contains a placeholder value: TBD",
    );
  });

  it("requires evidence when a requirement asserts built truth", () => {
    const result = validateFixture((ledger) => {
      ledger.requirements.push({
        requirementId: "REQ-TEST-LIVE-WITHOUT-EVIDENCE",
        title: "Validator fixture",
        sourceRefs: ["test://fixture"],
        canonRefs: ["docs/KLINIKOS_MASTER_CANON.md"],
        truthClass: "ACTUAL",
        strategyState: "NOW",
        implementationState: "LIVE_VERIFIED",
        programId: "P00",
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
        codeDisposition: "EXTEND",
        reuseTargets: [],
        testContracts: ["tests/execution-traceability-governance.test.ts"],
        dependencies: [],
        owner: "P00",
        kpis: ["live truth has evidence"],
        releaseWave: "P00",
        evidenceRefs: [],
        currentGap: "Fixture is intentionally invalid.",
      });
    });
    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      "requirements[0].evidenceRefs must be non-empty for LIVE_VERIFIED",
    );
  });
});
