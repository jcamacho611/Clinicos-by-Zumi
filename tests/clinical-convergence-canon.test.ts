import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("clinical convergence canon", () => {
  it("makes Current Visit the provider-facing convergence surface without erasing domain work queues", () => {
    const canon = read("docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md");
    expect(canon).toContain("Current Visit");
    expect(canon).toContain("Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit");
    expect(canon).toContain("Modules remain governed work queues");
  });

  it("requires deterministic longitudinal truth and human clinical authority", () => {
    const canon = read("docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md");
    expect(canon).toContain("AI may summarize a deterministic change set; AI must not invent the change set");
    expect(canon).toContain("Training, AI output, a Grid profile, or a template never grants clinical authority");
    expect(canon).toContain("SIGNED");
    expect(canon).toContain("LOCKED");
  });

  it("preserves specialty configuration and downstream revenue/integration continuity", () => {
    const canon = read("docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md");
    expect(canon).toContain("KLINIKOS CORE + SPECIALTY PACK + ORGANIZATION CONFIG + LOCATION OVERRIDE");
    expect(canon).toContain("PERFORMED → CHARGE EXPECTED → CHARGE PRESENT");
    expect(canon).toContain("ordered → transmitted → accepted → performed → resulted → reviewed → communicated → closed");
  });
});
