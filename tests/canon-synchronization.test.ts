import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { klinikosCanonLayers } from "@/lib/governance/canon-layer-registry";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const masterPath = "docs/KLINIKOS_MASTER_CANON.md";
const blueprintPath = "docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md";
const authorityMapPath = "docs/KLINIKOS_AUTHORITY_MAP.yaml";

const legacyAuthorityFiles = [
  "docs/CLINICOS_MASTER_CANON.md",
  "docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md",
  "docs/SOURCE_OF_TRUTH.md",
  "governance/KLINIKOS_FINAL_ECOSYSTEM_MASTER_BLUEPRINT.md",
  "governance/KLINIKOS_ECOSYSTEM_UNIVERSE_AND_EXPANSION_MAP.md",
  "governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md",
] as const;

describe("Klinikos Canon synchronization", () => {
  it("keeps every required company/product layer in both the Master Canon and Engineering Blueprint", () => {
    const master = read(masterPath);
    const blueprint = read(blueprintPath);
    const missing: string[] = [];

    for (const layer of klinikosCanonLayers) {
      for (const anchor of layer.canonAnchors) {
        if (!master.includes(anchor)) missing.push(`${layer.id}: Master Canon missing ${JSON.stringify(anchor)}`);
      }
      for (const anchor of layer.blueprintAnchors) {
        if (!blueprint.includes(anchor)) missing.push(`${layer.id}: Engineering Blueprint missing ${JSON.stringify(anchor)}`);
      }
    }

    expect(missing).toEqual([]);
  });

  it("requires every layer to terminate in implementation, evidence, money, risk, and measurement consequences", () => {
    const incomplete = klinikosCanonLayers
      .filter((layer) => !layer.owners.length || !layer.implementationConsequences.length || !layer.evidence.length || !layer.moneyPath.length || !layer.riskControls.length || !layer.kpis.length)
      .map((layer) => layer.id);

    expect(incomplete).toEqual([]);
  });

  it("keeps strategy state separate from implementation/evidence state", () => {
    const master = read(masterPath);
    expect(master).toContain("NOW / NEXT / LATER / PARTNER / CONNECT / INTERNALIZE / NEVER_BUILD");
    expect(master).toContain("LIVE_VERIFIED / BUILT_NEEDS_VERIFICATION / PARTIAL / DESIGNED / PLANNED / EXTERNAL_CONNECTION_REQUIRED / LEGAL_REVIEW_REQUIRED / NOT_BUILT / HISTORICAL_ONLY");
    expect(master).toContain("Strategy state and implementation state are separate axes");
  });

  it("keeps one authority chain", () => {
    const authority = read(authorityMapPath);
    expect(authority).toContain("file: docs/KLINIKOS_MASTER_CANON.md");
    expect(authority).toContain("SOLE_ACTIVE_PRODUCT_ARCHITECTURE_BUSINESS_EXPERIENCE_AUTHORITY");
    expect(authority).toContain("file: docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md");
    expect(authority).toContain("authority: IMPLEMENTATION_CONTRACT");
    expect(authority).toContain("may_override_master: false");
  });

  it("does not allow predecessor documents to claim current supreme authority", () => {
    const forbiddenSignals = [
      "TOP-LEVEL FINAL-FORM TARGET ARCHITECTURE",
      "GOVERNING FINAL-FORM ECOSYSTEM BOUNDARY",
      "GOVERNING COMPANY-BUILDING ARCHITECTURE",
      "SOLE ACTIVE PRODUCT AUTHORITY",
      "SOLE PRODUCT / ARCHITECTURE / BUSINESS / EXPERIENCE AUTHORITY",
    ];
    const offenders: string[] = [];

    for (const file of legacyAuthorityFiles) {
      if (!fs.existsSync(path.join(root, file))) continue;
      const content = read(file);
      for (const signal of forbiddenSignals) {
        if (content.includes(signal)) offenders.push(`${file}: ${signal}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("protects the hard safety and truth invariants against future Canon compression", () => {
    const master = read(masterPath);
    const invariants = [
      "Resume evidence is a claim, not professional authority",
      "EDU completion does not create licensure",
      "Payment does not create authority",
      "Subscription does not create professional eligibility",
      "Patients are never public Grid supply",
      "An unverified professional cannot publicly offer governed clinical services",
      "Placement matching does not equal school/site/preceptor approval",
      "AI cannot sign, submit, settle, or create regulated authority on its own",
      "Partnership status cannot bypass PHI, security, privacy, or legal gates",
      "Regulated clinical inventory is not ordinary public commerce",
      "Cross-context and cross-tenant data must not leak",
    ];

    const missing = invariants.filter((invariant) => !master.includes(invariant));
    expect(missing).toEqual([]);
  });
});
