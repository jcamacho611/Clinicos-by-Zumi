import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const source = read("docs/SOURCE_OF_TRUTH.md");
const ledger = read("docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md");
const clinical = read("docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md");
const agents = read("AGENTS.md");

describe("2026-08-22 professional findings remain canonical", () => {
  it("keeps one governed healthcare substrate and one evolving identity lifecycle", () => {
    expect(source).toContain("one persistent identity and governed ecosystem");
    expect(source).toContain("STUDENT → EDU → TRAINING → COMPETENCY → PLACEMENT → CREDENTIAL → GRID ELIGIBILITY → WORK");
    expect(ledger).toContain("One healthcare operating substrate");
    expect(ledger).toContain("Profession and authority are first-class");
  });

  it("keeps Current Visit as the provider convergence surface", () => {
    expect(clinical).toContain("Current Visit is the provider-facing convergence surface");
    expect(clinical).toContain("Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit");
    expect(agents).toContain("Current Visit is the provider-facing convergence surface");
  });

  it("keeps longitudinal change deterministic and AI subordinate to evidence", () => {
    expect(clinical).toContain("AI may summarize a deterministic change set; AI must not invent the change set");
    expect(ledger).toContain("Clinical Change Graph");
    expect(ledger).toContain("Zumi may summarize or explain change only from structured/source-linked evidence");
  });

  it("keeps staff handoff encounter-specific rather than relabeling generic patient summary", () => {
    expect(clinical).toContain("Encounter-specific staff handoff");
    expect(clinical).toContain("must not label general patient summary data as a completed staff handoff");
  });

  it("keeps specialty breadth configuration-driven instead of forking separate EHRs", () => {
    expect(clinical).toContain("KLINIKOS CORE + SPECIALTY PACK + ORGANIZATION CONFIG + LOCATION OVERRIDE");
    expect(ledger).toContain("Specialty packs are products, not forks");
    expect(ledger).toContain("Configuration Registry governs customization");
  });

  it("keeps external integration and downstream completion evidence-based", () => {
    expect(clinical).toContain("An internal order record does not prove a vendor accepted it");
    expect(ledger).toContain("External workflows are multi-step transactions");
    expect(ledger).toContain("Durable integration messaging is mandatory");
    expect(ledger).toContain("Connection state must be truthful");
  });

  it("keeps revenue integrity connected to clinical fulfillment without fabricating billability", () => {
    expect(clinical).toContain("PERFORMED → CHARGE EXPECTED → CHARGE PRESENT → CLAIM READY → CLAIM SENT → ACCEPTED → ADJUDICATED → PAID → RECONCILED");
    expect(ledger).toContain("Revenue Integrity Graph");
    expect(ledger).toContain("Never infer billability merely because an order exists");
  });

  it("keeps Zumi as orchestration intelligence rather than clinical, credential, payment, or tenant authority", () => {
    expect(source).toContain("Zumi is Klinikos Intelligence");
    expect(clinical).toContain("Zumi does not widen");
    expect(agents).toContain("AI never widens RBAC, tenant, credential, clinical, privacy, financial, or safety permissions");
  });
});
