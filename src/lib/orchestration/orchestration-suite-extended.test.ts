import { describe, expect, it } from "vitest";
import { orchestrateGoal } from "@/lib/orchestration/orchestrator";
import { evaluateReliability, systemHealth } from "@/lib/orchestration/reliability-engine";
import { engineStatusSummary, klinikosEngineRegistry } from "@/lib/orchestration/engine-registry";
import type { ActorContext } from "@/lib/orchestration/contracts";

const clinicContext: ActorContext = {
  actorId: "user-1",
  actorKind: "user",
  userId: "user-1",
  organizationId: "org-1",
  contextKind: "clinic",
  roleKeys: ["owner"],
  permissionKeys: [],
};

describe("Klinikos integrated orchestration suite", () => {
  it("orchestrates a clinic staffing goal into a governed Path and Next Action", async () => {
    const result = await orchestrateGoal({ rawIntent: "I need an injector Saturday in Brooklyn", context: clinicContext });
    expect(result.ok).toBe(true);
    expect(result.value?.intent.candidatePathIds[0]).toBe("fill-staffing-need");
    expect(result.value?.path?.pathId).toBe("fill-staffing-need");
    expect(result.value?.nextActions[0]?.title).toBe("Define the need");
    expect(result.value?.nextActions[0]?.capabilityKey).toBe("grid.request.create");
  });

  it("does not let a model invent a Path", async () => {
    const result = await orchestrateGoal({
      rawIntent: "I need an injector Saturday",
      context: clinicContext,
      interpreter: async (raw) => ({
        raw,
        actor: "clinic",
        goal: raw,
        outcome: "Invented path",
        timing: "Saturday",
        location: null,
        constraints: [],
        candidatePathIds: ["made-up-path"],
        confidence: 0.99,
        requiresClarification: false,
        clarificationQuestions: [],
      }),
    });
    expect(result.ok).toBe(true);
    expect(result.value?.path).toBeNull();
    expect(result.warnings.join(" ")).toMatch(/removed|no trusted path/i);
  });

  it("preserves the journey during dependency failure", () => {
    const unavailable = evaluateReliability({ id: "labs", health: "unavailable", lastCheckedAt: new Date(), manualFallbackAvailable: true });
    expect(unavailable.continuePath).toBe(true);
    expect(unavailable.useManualFallback).toBe(true);
    expect(systemHealth([
      { id: "a", health: "healthy", lastCheckedAt: new Date(), manualFallbackAvailable: false },
      { id: "b", health: "degraded", lastCheckedAt: new Date(), manualFallbackAvailable: true },
    ])).toBe("degraded");
  });

  it("tracks all 45 logical backend engines in one canonical registry", () => {
    expect(klinikosEngineRegistry).toHaveLength(45);
    const summary = engineStatusSummary();
    expect(Object.values(summary).reduce((sum, value) => sum + value, 0)).toBe(45);
    expect(summary.shared_v1).toBeGreaterThan(0);
    expect(summary.existing).toBeGreaterThan(0);
  });
});
