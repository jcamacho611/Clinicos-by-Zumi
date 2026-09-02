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

  it("keeps Living Universe foundation, visual completion, and customer-visible release truth separate", () => {
    const master = read(masterPath);
    const blueprint = read(blueprintPath);
    const required = [
      "LIVING UNIVERSE FOUNDATION ≠ FRONTEND COMPLETION",
      "CUSTOMER-VISIBLE FRONTEND PARITY IS A RELEASE REQUIREMENT",
      "MERGED ≠ DEPLOYED ≠ CUSTOMER-VISIBLE",
      "HEALTH RELEASE IDENTITY ALONE DOES NOT PROVE CUSTOMER-SURFACE PARITY",
    ];

    expect(required.filter((anchor) => !master.includes(anchor))).toEqual([]);
    expect(required.filter((anchor) => !blueprint.includes(anchor))).toEqual([]);
  });

  it("keeps one program and shell while allowing role-specific application projections", () => {
    const master = read(masterPath);
    const blueprint = read(blueprintPath);
    const required = [
      "ONE PRODUCT / ONE PROGRAM / ONE IDENTITY / ONE SHELL / ONE ZUMI",
      "APPLICATIONS DIFFERENTIATE THROUGH CONTENT, CONTEXT, AND WORK",
      "HOME / CLINIC / MONEY / NETWORK / LEARN",
    ];

    expect(required.filter((anchor) => !master.includes(anchor))).toEqual([]);
    expect(required.filter((anchor) => !blueprint.includes(anchor))).toEqual([]);
  });

  it("keeps Founder Command inside Plane E and connector evidence below Klinikos authority", () => {
    const master = read(masterPath);
    const blueprint = read(blueprintPath);
    const authority = read(authorityMapPath);
    const required = [
      "KLINIKOS COMMAND / FOUNDER COMMAND CENTER",
      "EXTERNAL CONNECTORS ARE EVIDENCE PROVIDERS, NOT AUTHORITIES",
      "COMPANY AUTHORITY IS SEPARATE FROM CLINICAL AUTHORITY",
      "CommandSignal / CommandInitiative / CommandOpportunity / CommandRisk / CommandDecision",
    ];

    expect(required.filter((anchor) => !master.includes(anchor))).toEqual([]);
    expect(required.filter((anchor) => !blueprint.includes(anchor))).toEqual([]);
    expect(authority).toContain("one_program_one_shell_multi_application_projection");
    expect(authority).toContain("company_command_evidence_projection");
  });

  it("versions the public-reference tranche without claiming authenticated member convergence", () => {
    const master = read(masterPath);
    const blueprint = read(blueprintPath);

    expect(master).toContain("Version: `2026-09-02.1`");
    expect(blueprint).toContain("**Version:** 2026-09-02 rev5");
    expect(blueprint).toContain("ordinary-language intent actions");
    expect(blueprint).not.toContain("twelve ordinary-language intents");
    expect(blueprint).toContain("This public-first convergence tranche does not claim `/member` visual convergence.");
  });

  it("preserves the twelve delivery workstreams as a projection of the five-plane Canon", () => {
    const master = read(masterPath);
    const blueprint = read(blueprintPath);
    const workstreams = [
      "CANON + FIVE-PLANE ARCHITECTURE",
      "IDENTITY + TRUST + SECURITY",
      "PATIENT + CLINICAL OS",
      "FINANCIAL OS + RCM",
      "GRID EXCHANGE",
      "WORKFORCE CONVERSION",
      "MED SPA + INDEPENDENT PRACTICE",
      "QUALITY + EXPERT GRID",
      "ZUMI + INTEGRATIONS",
      "CUSTOMER EXPERIENCE + DESIGN",
      "REVENUE + GROWTH COMPANY OS",
      "PRODUCTION + SCALE + UNICORN READINESS",
    ];

    expect(workstreams.filter((anchor) => !master.includes(anchor))).toEqual([]);
    expect(workstreams.filter((anchor) => !blueprint.includes(anchor))).toEqual([]);
    expect(master).toContain("delivery projection, not a sixth plane");
    expect(blueprint).toContain("DONE / BUILDING / BLOCKED_OR_RISK / NOT_YET");
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

  it("keeps Grid money states conditional on resource-class economic policy", () => {
    const blueprint = read(blueprintPath);

    expect(blueprint).toContain("pricing / rate set where applicable");
    expect(blueprint).toContain(
      "obligations created only when resource-class / economic policy requires them",
    );
    expect(blueprint).toContain("MONEY EVENT (WHERE APPLICABLE)");
    expect(blueprint).toContain("no-money / zero-fee completion remains valid");
    expect(blueprint).not.toContain(
      "Every resource class below uses the same underlying primitives: a listing (I HAVE), a need (I NEED), a match, an agreement, fulfillment, evidence, and a money event.",
    );
    expect(blueprint).not.toContain("  → obligations created\n");
    expect(blueprint).not.toContain("MONEY EVENT\n");
  });

  it("lets no subordinate document claim peer or supreme product authority", () => {
    // The failure this catches is specific and already happened once: Quality went fully
    // green while three documents each called themselves authoritative. A green build is
    // not evidence of one authority unless something actually checks for rivals.
    const subordinates = [
      "docs/KLINIKOS_UNIVERSAL_FRONTEND_AND_USER_OUTCOMES_CANON.md",
      "docs/FRONTEND_EXPERIENCE_CANON.md",
      "docs/KLINIKOS_ECOSYSTEM_CANON.md",
      "docs/SOURCE_OF_TRUTH.md",
      "docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md",
      // A repo-wide sweep found these two after the first pass. Both are named "MASTER
      // CANON" and both claimed current authority — the legacy-spelling copy plainly, and
      // a dated history snapshot as "ACTIVE - SOLE ... AUTHORITY". A history file that
      // calls itself the sole active authority is the worst kind of rival: it reads as
      // settled law and is invisible to anyone auditing the live documents.
      "docs/CLINICOS_MASTER_CANON.md",
      "docs/history/KLINIKOS_MASTER_CANON_2026-08-27.2.md",
    ];
    const claims = [
      "AUTHORITATIVE FRONTEND / PRODUCT EXPERIENCE CONTRACT",
      "Status: `AUTHORITATIVE`",
      "Status: AUTHORITATIVE",
      "AUTHORITATIVE — TOP OF THE DOCUMENT CHAIN",
      "SOLE ACTIVE PRODUCT AUTHORITY",
    ];
    const offenders: string[] = [];
    for (const file of subordinates) {
      if (!fs.existsSync(path.join(root, file))) continue;
      const content = read(file);
      for (const claim of claims) {
        if (content.includes(claim)) offenders.push(`${file}: ${claim}`);
      }
      // Literal strings are not enough on their own: two of these once claimed authority
      // in casing the list did not cover ("authoritative product/design/implementation
      // contract"). Any Status line asserting authority counts, however it is spelled.
      const status = content.split("\n").find((line) => line.trim().toLowerCase().startsWith("status:"));
      if (status && /authoritativ|governing|supreme|final-form target/i.test(status) && !/subordinate to/i.test(status)) {
        offenders.push(`${file}: status line asserts authority — ${status.trim()}`);
      }

      // Each must also name what it is subordinate to, so a reader landing in the middle
      // of the file cannot mistake it for the top of the chain.
      if (!content.includes("SUBORDINATE TO")) offenders.push(`${file}: does not declare subordination`);
    }

    expect(offenders).toEqual([]);
  });

  it("stops SOURCE_OF_TRUTH from defining permanent product law in its body", () => {
    // Its header was corrected once while the first paragraph still said it "defines
    // current Klinikos product ... law". A subordinate header over a governing body is
    // not a reconciled document, so the body is asserted separately from the status line.
    const sot = read("docs/SOURCE_OF_TRUTH.md");
    expect(sot).not.toContain("This document defines current Klinikos product, ecosystem, experience, design, wiring, security, Grid, intelligence, commercial, and engineering law.");
    expect(sot).toContain("Permanent intended company/product law belongs to `docs/KLINIKOS_MASTER_CANON.md`");
  });

  it("makes a fresh agent read the Master Canon before any subordinate source", () => {
    // An index that ranks the Canon 18th is worse than no index: an agent following it
    // correctly would rebuild exactly the parallel authority this convergence removed.
    const index = read("docs/KLINIKOS_ARCHITECTURE_INDEX.md");
    const canon = index.indexOf("docs/KLINIKOS_MASTER_CANON.md");
    const sourceOfTruth = index.indexOf("docs/SOURCE_OF_TRUTH.md");
    const frontend = index.indexOf("docs/KLINIKOS_UNIVERSAL_FRONTEND_AND_USER_OUTCOMES_CANON.md");

    expect(canon).toBeGreaterThan(-1);
    expect(canon).toBeLessThan(sourceOfTruth);
    expect(canon).toBeLessThan(frontend);
  });

  it("keeps the merge-forward deltas that a later compression pass would drop first", () => {
    // MF-001..MF-008 are the accepted additions most at risk of vanishing in a summary,
    // because each reads like detail rather than law. They are law.
    const master = read(masterPath);
    const deltas = [
      "MF-001",
      "UNIVERSAL FREE ECOSYSTEM ENTRY",
      "MF-002",
      "ECOSYSTEM PASSPORT",
      "MF-003",
      "LIVING UNIVERSE INTERACTION LAW",
      "MF-004",
      "BEFORE / NOW / NEXT",
      "MF-005",
      "WORKFORCE BOARD / GOVERNMENT TRAINING",
      "MF-006",
      "RFP / PROCUREMENT LIFECYCLE",
      "MF-007",
      "ACTIVE_PUBLIC / ACTIVE_PRIVATE / LEGACY_QUOTED / GRANDFATHERED / TARGET / SCENARIO / RETIRED",
      "MF-008",
      "REPRESENTATIVE HUMAN JOURNEYS",
    ];

    expect(deltas.filter((delta) => !master.includes(delta))).toEqual([]);
  });
});
