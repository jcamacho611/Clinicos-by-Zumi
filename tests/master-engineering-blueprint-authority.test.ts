import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const MASTER_CANON = "docs/KLINIKOS_MASTER_CANON.md";
const ENGINEERING_BLUEPRINT =
  "docs/superpowers/specs/2026-08-29-klinikos-master-engineering-blueprint.md";
const AUTHORITY_MAP = "docs/KLINIKOS_AUTHORITY_MAP.yaml";

describe("Klinikos Master Canon and engineering implementation authority", () => {
  it("keeps exactly one product authority and a subordinate canonical implementation contract", () => {
    const master = read(MASTER_CANON);
    const blueprint = read(ENGINEERING_BLUEPRINT);
    const authority = read(AUTHORITY_MAP);

    expect(master).toContain("KLINIKOS MASTER CANON");
    expect(authority).toContain(`file: ${MASTER_CANON}`);
    expect(authority).toContain(
      "authority: SOLE_ACTIVE_PRODUCT_ARCHITECTURE_BUSINESS_EXPERIENCE_AUTHORITY",
    );

    expect(blueprint).toContain("# KLINIKOS MASTER ENGINEERING BLUEPRINT");
    expect(blueprint).toContain(
      "It does not replace the Master Canon — it is the canonical implementation contract the Master Canon generates.",
    );
    expect(authority).toContain(`file: ${ENGINEERING_BLUEPRINT}`);
    expect(authority).toContain("authority: IMPLEMENTATION_CONTRACT");
    expect(authority).toContain("may_override_master: false");
    expect(authority).toContain("may_override_verified_implementation: false");
    expect(authority).toContain("implementation_status_sections_are_snapshot_only: true");
  });

  it("makes every development agent start from the same Canon and blueprint", () => {
    const agentBootstrapFiles = ["AGENTS.md", "CLAUDE.md", "CODEX.md", "SYMPHONY.md"];

    for (const file of agentBootstrapFiles) {
      const contents = read(file);
      expect(contents).toContain(MASTER_CANON);
      expect(contents).toContain(ENGINEERING_BLUEPRINT);
    }

    expect(read("docs/KLINIKOS_MULTI_AGENT_EXECUTION_CONTROL.md")).toContain(
      "ONE KLINIKOS. MANY EXECUTION LANES. ONE ACTIVE OWNER PER CONSEQUENTIAL SLICE.",
    );
    expect(read("docs/KLINIKOS_CURRENT_PROJECT_STATE.md")).toContain(
      "Authority class:** EVIDENCE_SNAPSHOT",
    );
  });

  it("prevents new parallel supreme product or engineering authorities", () => {
    const authority = read(AUTHORITY_MAP);

    expect(authority).toContain("NEW_PARALLEL_SUPREME_CANON");
    expect(authority).toContain("NEW_PARALLEL_MASTER_CANON");
    expect(authority).toContain("NEW_PARALLEL_SOURCE_OF_TRUTH");
    expect(authority).toContain("NEW_PARALLEL_ENGINEERING_BLUEPRINT");
  });

  it("preserves the core engineering separation laws", () => {
    const blueprint = read(ENGINEERING_BLUEPRINT);

    expect(blueprint).toContain("Simple above. Technical below.");
    expect(blueprint).toContain("One Klinikos identity.");
    expect(blueprint).toContain(
      "EXISTS ≠ DISCOVERABLE ≠ PROMOTED ≠ ELIGIBLE ≠ ENTITLED ≠ AUTHORIZED ≠ VISIBLE DATA ≠ ACTIONABLE NOW.",
    );
    expect(blueprint).toContain(
      "Three controls that must never collapse: Promotion, Entitlement, Authority.",
    );
    expect(blueprint).toContain("Context switch is a security event, not a tab click.");
    expect(blueprint).toContain("Reuse → Extend → Generalize → Connect.");
  });
});
