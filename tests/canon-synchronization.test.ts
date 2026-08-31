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

const subordinateAuthorityFiles = [
  "docs/KLINIKOS_UNIVERSAL_FRONTEND_AND_USER_OUTCOMES_CANON.md",
  "docs/FRONTEND_EXPERIENCE_CANON.md",
  "docs/KLINIKOS_ECOSYSTEM_CANON.md",
  "docs/SOURCE_OF_TRUTH.md",
  "docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md",
  "docs/CLINICOS_MASTER_CANON.md",
  "docs/history/KLINIKOS_MASTER_CANON_2026-08-27.2.md",
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

  it("rejects body-level authority leaks even when a predecessor header is subordinate", () => {
    const offenders: string[] = [];

    for (const file of subordinateAuthorityFiles) {
      if (!fs.existsSync(path.join(root, file))) continue;
      const content = read(file);
      const status = content
        .split("\n")
        .find((line) => line.trim().toLowerCase().startsWith("status:"));

      if (
        status
        && /authoritativ|governing|supreme|sole|final-form target/i.test(status)
        && !/subordinate|historical/i.test(status)
      ) {
        offenders.push(`${file}: status line asserts peer authority — ${status.trim()}`);
      }

      if (!/SUBORDINATE TO [`]?docs\/KLINIKOS_MASTER_CANON\.md/i.test(content)) {
        offenders.push(`${file}: does not route authority to the Master Canon`);
      }
    }

    const legacy = read("docs/CLINICOS_MASTER_CANON.md");
    const history = read("docs/history/KLINIKOS_MASTER_CANON_2026-08-27.2.md");
    const constitution = read("docs/KLINIKOS_CONSTITUTION.md");
    const predecessor = read("docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md");

    if (legacy.includes("All future repository work must use this document as the product and architecture source of truth.")) {
      offenders.push("docs/CLINICOS_MASTER_CANON.md: body issues a current repository instruction");
    }
    if (history.includes("This file is the single current governing specification")) {
      offenders.push("docs/history/KLINIKOS_MASTER_CANON_2026-08-27.2.md: history body claims current authority");
    }
    if (constitution.includes("docs/CLINICOS_MASTER_CANON.md")) {
      offenders.push("docs/KLINIKOS_CONSTITUTION.md: conflict route points to the legacy-spelling Canon");
    }
    if (predecessor.includes("It sits above them and says how to read them.")) {
      offenders.push("docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md: body claims precedence");
    }
    if (predecessor.includes("| `CLINICOS_MASTER_CANON.md` | Product and architecture source of truth |")) {
      offenders.push("docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md: register restores legacy authority");
    }
    if (predecessor.includes("| `SOURCE_OF_TRUTH.md` | Current operating law |")) {
      offenders.push("docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md: register restores predecessor law");
    }

    expect(offenders).toEqual([]);
  });

  it("keeps SOURCE_OF_TRUTH and navigation subordinate to the one intended-truth authority", () => {
    const source = read("docs/SOURCE_OF_TRUTH.md");
    const index = read("docs/KLINIKOS_ARCHITECTURE_INDEX.md");
    const masterPosition = index.indexOf("docs/KLINIKOS_MASTER_CANON.md");
    const sourcePosition = index.indexOf("docs/SOURCE_OF_TRUTH.md");
    const blueprintPosition = index.indexOf(blueprintPath);

    expect(source).not.toContain(
      "This document defines current Klinikos product, ecosystem, experience, design, wiring, security, Grid, intelligence, commercial, and engineering law.",
    );
    expect(source).toContain("Superseded by: `docs/KLINIKOS_MASTER_CANON.md`");
    expect(masterPosition).toBeGreaterThan(-1);
    expect(masterPosition).toBeLessThan(sourcePosition);
    expect(masterPosition).toBeLessThan(blueprintPosition);
  });

  it("makes every agent bootstrap from the Master Canon before subordinate implementation sources", () => {
    for (const file of ["AGENTS.md", "CLAUDE.md", "CODEX.md", "SYMPHONY.md"]) {
      const content = read(file);
      const masterPosition = content.indexOf(masterPath);
      const blueprintPosition = content.indexOf(blueprintPath);
      expect(masterPosition, `${file}: missing Master Canon`).toBeGreaterThan(-1);
      expect(blueprintPosition, `${file}: missing Engineering Blueprint`).toBeGreaterThan(-1);
      expect(masterPosition, `${file}: Master Canon must be read first`).toBeLessThan(blueprintPosition);
    }
  });

  it("guards MF-001 through MF-008 against future Canon and Blueprint compression", () => {
    const master = read(masterPath);
    const blueprint = read(blueprintPath);
    const required = [
      "MF-001",
      "MF-002",
      "MF-003",
      "MF-004",
      "MF-005",
      "MF-006",
      "MF-007",
      "MF-008",
    ];

    expect(required.filter((anchor) => !master.includes(anchor))).toEqual([]);
    expect(required.filter((anchor) => !blueprint.includes(anchor))).toEqual([]);
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
