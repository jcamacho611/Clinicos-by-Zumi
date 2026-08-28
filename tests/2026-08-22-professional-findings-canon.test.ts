import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const master = read("docs/KLINIKOS_MASTER_CANON.md");
const clinical = read("docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md");
const agents = read("AGENTS.md");

describe("2026-08-22 professional findings remain canonical", () => {
  it("keeps one governed healthcare substrate and one evolving identity lifecycle", () => {
    expect(master).toContain("KLINIKOS-IDENTITY-001");
    expect(master).toContain("One person has one durable Klinikos identity");
    expect(master).toContain("One ecosystem, many purpose-built experiences");
    expect(master).toContain("COMPETENCY EVIDENCE");
    expect(master).toContain("GRID DISCOVERY / ELIGIBILITY");
    expect(master).toContain("FULFILLMENT / EXPERIENCE EVIDENCE");
  });

  it("keeps Current Visit as the provider convergence surface", () => {
    expect(master).toContain("KLINIKOS-CLINICAL-001");
    expect(clinical).toContain("Current Visit is the provider-facing convergence surface");
    expect(clinical).toContain("Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit");
    expect(agents).toContain("Current Visit is the provider-facing convergence surface");
  });

  it("keeps longitudinal change deterministic and AI subordinate to evidence", () => {
    expect(clinical).toContain("AI may summarize a deterministic change set; AI must not invent the change set");
    expect(clinical).toContain("If structured comparison is not available, the UI must state that truthfully");
    expect(master).toContain("Zumi is not product authority, clinical authority, payment authority, credential authority, or legal authority");
  });

  it("keeps staff handoff encounter-specific rather than relabeling generic patient summary", () => {
    expect(clinical).toContain("Encounter-specific staff handoff");
    expect(clinical).toContain("must not label general patient summary data as a completed staff handoff");
  });

  it("keeps specialty breadth configuration-driven instead of forking separate EHRs", () => {
    expect(clinical).toContain("Do not build separate incompatible EHR products for every specialty");
    expect(clinical).toContain("KLINIKOS CORE + SPECIALTY PACK + ORGANIZATION CONFIG + LOCATION OVERRIDE");
    expect(clinical).toContain("must still reuse the same underlying clinical components");
  });

  it("keeps external integration and downstream completion evidence-based", () => {
    expect(clinical).toContain("An internal order record does not prove a vendor accepted it");
    expect(clinical).toContain("External completion is never inferred from an internal UI state");
    expect(clinical).toContain("Do not describe an adapter, credential, sandbox, or internal event as a live external connection");
  });

  it("keeps revenue integrity connected to clinical fulfillment without fabricating billability", () => {
    expect(clinical).toContain("PERFORMED → CHARGE EXPECTED → CHARGE PRESENT → CLAIM READY → CLAIM SENT → ACCEPTED → ADJUDICATED → PAID → RECONCILED");
    expect(clinical).toContain("This is an operational/revenue integrity graph, not permission to fabricate charges or submit unsupported claims");
  });

  it("keeps Zumi as orchestration intelligence rather than clinical, credential, payment, or tenant authority", () => {
    expect(master).toContain("Zumi is Klinikos Intelligence and the semantic navigation/control layer");
    expect(clinical).toContain("Zumi does not widen");
    expect(agents).toContain("Zumi is Klinikos Intelligence and orchestration. Zumi is never domain authority.");
  });
});
