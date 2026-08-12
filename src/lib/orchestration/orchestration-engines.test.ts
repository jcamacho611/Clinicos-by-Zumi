import { describe, expect, it } from "vitest";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";
import { rankMatches, requiredEligibilityDimension, availabilityOverlap, distanceScore } from "@/lib/orchestration/matching-engine";
import { advancePathSnapshot, resolvePathRuntime, type PersistedPathSnapshot } from "@/lib/orchestration/path-engine";
import { nextActionsFromPath, rankNextActions } from "@/lib/orchestration/next-action-engine";
import { blockersFromPolicy } from "@/lib/orchestration/blocker-engine";
import { collapseSignals, signalFromEvent } from "@/lib/orchestration/event-engine";
import type { DomainEvent, NextAction } from "@/lib/orchestration/contracts";

describe("Klinikos orchestration engines", () => {
  it("resolves a clinic staffing intent into the staffing Path without model authority", () => {
    const intent = resolveIntentDeterministically("I need an injector Saturday in Brooklyn");
    expect(intent.actor).toBe("clinic");
    expect(intent.candidatePathIds[0]).toBe("fill-staffing-need");
    expect(intent.timing?.toLowerCase()).toContain("saturday");
    expect(intent.location).toBe("Brooklyn");
    expect(intent.requiresClarification).toBe(false);
  });

  it("keeps unknown intent explicit instead of inventing a Path", () => {
    const intent = resolveIntentDeterministically("Help me with something unusual");
    expect(intent.actor).toBe("unknown");
    expect(intent.candidatePathIds).toEqual([]);
    expect(intent.requiresClarification).toBe(true);
  });

  it("hydrates and advances a Path runtime from a persisted snapshot", () => {
    const snapshot: PersistedPathSnapshot = {
      instanceId: "path-1",
      pathId: "fill-staffing-need",
      goal: "Cover Saturday",
      status: "active",
      completedNodeIds: ["need"],
      blockedNodeIds: [],
      currentNodeId: "matches",
      blockers: [],
    };

    const runtime = resolvePathRuntime({ pathId: snapshot.pathId, snapshot });
    expect(runtime?.progress).toBe(0.25);
    expect(runtime?.currentNodeId).toBe("matches");

    const advanced = advancePathSnapshot({ snapshot, completedNodeId: "matches" });
    expect(advanced.completedNodeIds).toContain("matches");
    expect(advanced.currentNodeId).toBe("availability");
  });

  it("turns the current Path node into a ranked Next Action", () => {
    const runtime = resolvePathRuntime({ pathId: "fix-referral-leakage" });
    expect(runtime).not.toBeNull();
    const actions = nextActionsFromPath(runtime!);
    expect(actions[0]?.title).toBe("Find open loops");
    expect(actions[0]?.state).toBe("recommended");
  });

  it("prioritizes urgent care workflow actions over lower-weight general actions", () => {
    const now = new Date("2026-08-12T12:00:00Z");
    const actions: NextAction[] = [
      { id: "a", title: "Continue learning", reason: "Path", sourceType: "edu", state: "available", priority: 0, blockers: [] },
      { id: "b", title: "Review result", reason: "Clinical result", sourceType: "result", state: "available", priority: 0, dueAt: new Date("2026-08-12T13:00:00Z"), blockers: [] },
    ];
    expect(rankNextActions(actions, now)[0]?.id).toBe("b");
  });

  it("keeps ineligible candidates below eligible candidates regardless of score", () => {
    const candidates = [
      { id: "eligible", eligible: true, quality: 0.5 },
      { id: "blocked", eligible: false, quality: 1 },
    ];
    const ranked = rankMatches({
      candidates,
      dimensions: [
        requiredEligibilityDimension((candidate) => ({ eligible: candidate.eligible, reasons: candidate.eligible ? [] : ["Credential missing"] })),
        { key: "quality", weight: 100, evaluate: (candidate) => ({ pass: true, score: candidate.quality, reason: "Quality score" }) },
      ],
    });
    expect(ranked[0]?.id).toBe("eligible");
    expect(ranked[1]?.blockers).toContain("Credential missing");
  });

  it("computes overlap and distance without treating unknown distance as a match", () => {
    expect(availabilityOverlap({
      requestedStart: new Date("2026-08-15T12:00:00Z"),
      requestedEnd: new Date("2026-08-15T18:00:00Z"),
      availableStart: new Date("2026-08-15T12:00:00Z"),
      availableEnd: new Date("2026-08-15T15:00:00Z"),
    })).toBe(0.5);
    expect(distanceScore(null, 10)).toBe(0);
    expect(distanceScore(5, 10)).toBe(0.5);
  });

  it("converts connector policy failures into actionable fallback blockers", () => {
    const blockers = blockersFromPolicy({
      state: "blocked",
      reasons: ["Connector unavailable"],
      missingRoles: [],
      missingPermissions: [],
      missingConnectors: ["stripe"],
      requiredConfirmations: [],
    });
    expect(blockers[0]?.owner).toBe("connector");
    expect(blockers[0]?.alternatives[0]?.title).toMatch(/manual fallback/i);
  });

  it("turns domain events into collapsible Moving signals", () => {
    const base: DomainEvent = {
      id: "e1",
      type: "grid_match_available",
      organizationId: "org-1",
      sourceType: "grid",
      severity: "attention",
      occurredAt: new Date("2026-08-12T12:00:00Z"),
      payload: { label: "Grid opportunities", value: 1, detail: "New match", href: "/grid" },
    };
    const second: DomainEvent = { ...base, id: "e2", occurredAt: new Date("2026-08-12T12:05:00Z") };
    const collapsed = collapseSignals([signalFromEvent(base), signalFromEvent(second)]);
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0]?.value).toBe(2);
  });
});
