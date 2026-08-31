import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("canonical Klinikos truth", () => {
  it("keeps Klinikos and klinikos.io as the public identity", () => {
    const readme = read("README.md");
    const publicSources = [
      readme,
      read("src/app/page.tsx"),
      read("src/app/start/page.tsx"),
      read("src/components/marketing/klinikos-homepage.tsx"),
    ];

    expect(readme.startsWith("# KLINIKOS\n")).toBe(true);
    expect(readme).toContain("Canonical public identity: **https://klinikos.io**");
    expect(readme).not.toContain("# ClinicOS by Zumi");
    expect(readme).not.toContain("Official public deployment target: [https://zumi.onrender.com");

    for (const source of publicSources) {
      expect(source).not.toContain("zumi.onrender.com");
    }
  });

  it("keeps the production host contract explicit and runtime build-free", () => {
    const render = read("render.yaml");
    const readme = read("README.md");

    expect(render).toContain("buildCommand: npm ci --include=dev --ignore-scripts && npm run render:build");
    expect(render).toContain("startCommand: npm start");
    expect(render).toContain("healthCheckPath: /api/health");
    expect(readme).toContain("Do not build or run migrations on every runtime wake.");
  });

  it("keeps paid activation in the complete DB-backed MVP runner", () => {
    const runner = read("scripts/mvp/run-all.mjs");
    const requiredJourneys = [
      "fresh-deploy-journey.ts",
      "commercial-journey.mts",
      "activation-journey.mts",
      "operations-journey.mts",
      "grid-journey.mts",
      "grid-trust-journey.mts",
      "zumi-journey.ts",
      "tenant-isolation-journey.mts",
      "role-routing-journey.ts",
      "failure-recovery-journey.ts",
    ];

    for (const journey of requiredJourneys) {
      expect(runner).toContain(`\"${journey}\"`);
    }

    expect(requiredJourneys).toHaveLength(10);
  });

  it("keeps payment redirect truth separate from entitlement", () => {
    const source = read("docs/SOURCE_OF_TRUTH.md");
    const status = read("docs/FEATURE_STATUS.md");

    // Law verified present at docs/SOURCE_OF_TRUTH.md:250 and again in the Master Canon. The
    // #388 rewrite dropped the markdown bold only; asserting on emphasis made this brittle.
    expect(source).toContain("Browser redirect/return state does not establish payment.");
    expect(source).toContain("Payment evidence is recorded separately from entitlement.");
    expect(status).toContain("Redirect state is never payment evidence.");
  });

  it("keeps every ecosystem engine bound to an indexed specialist canon", () => {
    const source = read("docs/SOURCE_OF_TRUTH.md");
    const index = read("docs/KLINIKOS_ARCHITECTURE_INDEX.md");
    const specialistCanons = [
      "GRID_CANON.md",
      "ZUMI_CANON.md",
      "EDU_CANON.md",
      "CLINIC_OS_CANON.md",
      "PORTAL_AND_ROLE_CANON.md",
      "FINANCIAL_OS_CANON.md",
    ];

    for (const filename of specialistCanons) {
      expect(fs.existsSync(path.join(process.cwd(), "docs", filename))).toBe(true);
      expect(source).toContain(`docs/${filename}`);
      expect(index).toContain(`docs/${filename}`);
    }
  });

  it("keeps product work inside the Klinikos repository boundary after recovery closeout", () => {
    const agentLaw = read("AGENTS.md");
    const ledger = read("docs/BRANCH_LEDGER.md");

    expect(agentLaw).toContain("jcamacho611/Clinicos-by-Zumi");
    expect(agentLaw).toContain("Never use, inspect, edit, merge, or copy LWA/IWA work");
    expect(agentLaw).toContain("Use neutral role language");
    expect(ledger).toContain("`main` is the only source of implementation truth");
    expect(ledger).toContain("There is intentionally no preservation/recovery status");
    expect(ledger).toContain("A historical branch must never be merged wholesale");
  });

  it("keeps Grid contractor fixtures anchored to roles instead of personal identities", () => {
    const seed = read("prisma/seed.ts");
    const migration = read("prisma/migrations/20260817025200_neutralize_grid_contractor_fixture_labels/migration.sql");

    expect(seed).toContain('name: "Independent Grid Provider"');
    expect(seed).toContain('name: "Grid Provider Applicant"');
    expect(seed).toContain('title: "Provider response requested"');
    expect(seed).toContain('id: "grid-request-provider-on-call"');
    expect(migration).toContain("Primary keys stay unchanged");
    expect(migration).toContain("'Independent Grid Provider'");
    expect(migration).toContain("'Grid Provider Applicant'");
    expect(migration).not.toContain('SET "id"');
  });

  it("locks the sole Master Canon hierarchy while preserving older designs as provenance", () => {
    const masterCanonPath = "docs/KLINIKOS_MASTER_CANON.md";
    const engineeringBlueprintPath = "docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md";
    const authorityMapPath = "docs/KLINIKOS_AUTHORITY_MAP.yaml";
    const historicalOperatingNetworkSpec = "docs/superpowers/specs/2026-08-26-klinikos-operating-network-kernel-design.md";
    const frontend = read("docs/FRONTEND_EXPERIENCE_CANON.md");
    const claude = read("CLAUDE.md");
    const masterCanon = read(masterCanonPath);
    const authorityMap = read(authorityMapPath);

    expect(fs.existsSync(path.join(process.cwd(), historicalOperatingNetworkSpec))).toBe(true);
    expect(masterCanon).toContain("KLINIKOS MASTER CANON");
    expect(authorityMap).toContain("SOLE_ACTIVE_PRODUCT_ARCHITECTURE_BUSINESS_EXPERIENCE_AUTHORITY");
    expect(authorityMap).toContain(`file: ${masterCanonPath}`);
    expect(authorityMap).toContain(`file: ${engineeringBlueprintPath}`);
    expect(claude).toContain(masterCanonPath);
    expect(claude).toContain(engineeringBlueprintPath);
    expect(claude).toContain(authorityMapPath);
    expect(claude).not.toContain(historicalOperatingNetworkSpec);
    expect(frontend).toContain("The interface itself is the signature.");
    expect(frontend).not.toContain("## Rose environmental contract");
    expect(frontend).toContain("No decorative motif is permanent");
  });
});