import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const defensePath = join(process.cwd(), "src/lib/legal/legal-defense.ts");
const agreementPath = join(process.cwd(), "src/lib/legal/global-agreement.ts");
const registryPath = join(process.cwd(), "src/lib/legal/document-registry.ts");
const suitePath = join(process.cwd(), "docs/legal/LEGAL_DOCUMENT_SUITE.md");
const canonPath = join(process.cwd(), "governance/KLINIKOS_ACCESS_IDENTITY_AGREEMENTS_IP_TRUST_CANON.md");

function source(path: string) {
  return readFileSync(path, "utf8");
}

describe("Klinikos legal defense stack", () => {
  it("defines a server-authoritative severe protected-asset breach policy", () => {
    const defense = source(defensePath);
    expect(defense).toContain('import "server-only"');
    expect(defense).toContain('SEVERE_PROTECTED_ASSET_BREACH');
    expect(defense).toContain("trade secret");
    expect(defense).toContain("source code");
    expect(defense).toContain("mass extraction");
    expect(defense).toContain("credential");
    expect(defense).toContain("evidence");
  });

  it("closes indirect assistance and knowing-benefit loopholes", () => {
    const defense = source(defensePath);
    for (const phrase of [
      "attempting",
      "directing",
      "inducing",
      "financing",
      "facilitating",
      "assisting",
      "enabling",
      "conspiring",
      "knowingly benefiting",
    ]) {
      expect(defense).toContain(phrase);
    }
  });

  it("defines cumulative remedies but prohibits double recovery", () => {
    const defense = source(defensePath);
    expect(defense).toContain("injunctive");
    expect(defense).toContain("forensic");
    expect(defense).toContain("remediation");
    expect(defense).toContain("attorneys' fees");
    expect(defense).toContain("no double recovery");
  });

  it("does not activate arbitrary punitive liquidated damages", () => {
    const defense = source(defensePath);
    expect(defense).toContain("productionApproved: false");
    expect(defense).toContain("not a penalty");
    expect(defense).not.toMatch(/amount:\s*(25000|50000|75000)/);
  });

  it("includes the DTSA whistleblower immunity notice required for covered worker agreements", () => {
    const defense = source(defensePath);
    expect(defense).toContain("18 U.S.C. § 1833(b)");
    expect(defense).toContain("government official");
    expect(defense).toContain("attorney");
    expect(defense).toContain("under seal");
  });

  it("requires a material-version bump and explicit breach-consequences acknowledgment", () => {
    const agreement = source(agreementPath);
    expect(agreement).toContain('GLOBAL_TERMS_VERSION = "2026.08.27.1"');
    expect(agreement).toContain('GLOBAL_TERMS_EFFECTIVE_DATE = "2026-08-27"');
    expect(agreement).toContain('"breach_consequences"');
    expect(agreement).toContain("Severe Protected-Asset Breach");
    expect(agreement).toContain("no double recovery");
    expect(agreement).toContain("Anti-Circumvention");
  });

  it("keeps legal approval server-controlled and counsel-gated", () => {
    const registry = source(registryPath);
    expect(registry).toContain("counselReviewRequired: true");
    expect(registry).toContain("productionApproved: false");
    expect(registry).toContain('version: "2026-08-27.1"');
  });

  it("makes the defense mapping governing legal architecture", () => {
    const suite = source(suitePath);
    const canon = source(canonPath);
    const rule = "Every prohibited act must map to a defined contractual consequence, evidence path, survival rule, and remedy.";
    expect(suite).toContain(rule);
    expect(canon).toContain(rule);
  });
});
