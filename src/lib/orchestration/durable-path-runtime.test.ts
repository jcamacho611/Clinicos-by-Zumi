import { describe, expect, it } from "vitest";
import { getKlinikosPath } from "@/lib/paths/catalog";
import { listTrustedPathEventRules, trustedRulesForEvent } from "@/lib/orchestration/path-domain-event-rules";
import { advancePathSnapshot, baselineSnapshotForPath, resolvePathRuntime } from "@/lib/orchestration/path-engine";

describe("durable Klinikos Path runtime", () => {
  it("honors baseline completed nodes and starts at the catalog current node", () => {
    const snapshot = baselineSnapshotForPath({
      instanceId: "instance-1",
      pathId: "find-extra-work",
      goal: "I want weekend work",
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot?.completedNodeIds).toEqual(["profile"]);
    expect(snapshot?.currentNodeId).toBe("credentials");

    const runtime = resolvePathRuntime({ pathId: "find-extra-work", snapshot });
    expect(runtime?.progress).toBe(0.2);
    expect(runtime?.nodes.find((node) => node.id === "profile")?.state).toBe("complete");
    expect(runtime?.nodes.find((node) => node.id === "credentials")?.state).toBe("current");
  });

  it("advances exactly one current step and preserves prior completion", () => {
    const baseline = baselineSnapshotForPath({
      instanceId: "instance-2",
      pathId: "fill-staffing-need",
      goal: "I need an injector Saturday",
    });
    expect(baseline?.currentNodeId).toBe("need");

    const afterNeed = advancePathSnapshot({ snapshot: baseline!, completedNodeId: "need" });
    expect(afterNeed.completedNodeIds).toEqual(["need"]);
    expect(afterNeed.currentNodeId).toBe("matches");
  });

  it("keeps domain-event progression restricted to known Path nodes", () => {
    for (const rule of listTrustedPathEventRules()) {
      const definition = getKlinikosPath(rule.pathId);
      expect(definition, `${rule.eventType} points to an unknown Path ${rule.pathId}`).toBeDefined();
      expect(
        definition?.nodes.some((node) => node.id === rule.nodeId),
        `${rule.eventType} points to unknown node ${rule.nodeId}`,
      ).toBe(true);
    }
  });

  it("maps the staffing transaction lifecycle to its four sequential Path steps", () => {
    expect(trustedRulesForEvent("grid.demand.created")).toContainEqual({ pathId: "fill-staffing-need", nodeId: "need" });
    expect(trustedRulesForEvent("grid.offer.sent")).toContainEqual({ pathId: "fill-staffing-need", nodeId: "matches" });
    expect(trustedRulesForEvent("grid.reservation.created")).toContainEqual({ pathId: "fill-staffing-need", nodeId: "availability" });
    expect(trustedRulesForEvent("grid.fulfillment.fulfilled")).toContainEqual({ pathId: "fill-staffing-need", nodeId: "confirm" });
  });

  it("maps referral closure only after the earlier governed referral milestones", () => {
    expect(trustedRulesForEvent("referral.reviewed")).toContainEqual({ pathId: "fix-referral-leakage", nodeId: "diagnose" });
    expect(trustedRulesForEvent("task.assigned")).toContainEqual({ pathId: "fix-referral-leakage", nodeId: "ownership" });
    expect(trustedRulesForEvent("patient.followup.completed")).toContainEqual({ pathId: "fix-referral-leakage", nodeId: "followup" });
    expect(trustedRulesForEvent("network.destination.confirmed")).toContainEqual({ pathId: "fix-referral-leakage", nodeId: "network" });
    expect(trustedRulesForEvent("referral.closed")).toContainEqual({ pathId: "fix-referral-leakage", nodeId: "closure" });
  });

  it("does not invent progression for unknown domain events", () => {
    expect(trustedRulesForEvent("zumi.said_it_was_done")).toEqual([]);
  });
});
