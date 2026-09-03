import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const jsonLedger = resolve(root, "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json");
const yamlLedger = resolve(root, "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.yaml");
const validator = resolve(root, "scripts/validate-execution-traceability.mjs");

function read(path: string) {
  return readFileSync(path, "utf8");
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
});
