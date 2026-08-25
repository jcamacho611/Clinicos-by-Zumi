import { describe, expect, it } from "vitest";
import { findPathPresentation } from "@/lib/home/path-presentation";
import { presentPath, presentPaths } from "@/lib/home/path-presentation-resolver";
import type { PersistedPathSnapshot } from "@/lib/orchestration/path-engine";

function snapshot(overrides: Partial<PersistedPathSnapshot> = {}): PersistedPathSnapshot {
  return {
    instanceId: "instance-1",
    pathId: "find-extra-work",
    goal: "Pick up weekend shifts",
    status: "active",
    completedNodeIds: [],
    blockedNodeIds: [],
    currentNodeId: null,
    blockers: [],
    ...overrides,
  };
}

/**
 * The point of this module is that the browser never sees the path catalog or the
 * sequencing rules, so these assertions are as much about what is absent from the
 * result as what is present.
 */
describe("path presentation", () => {
  it("reduces a stored Path to the few facts the interface renders", () => {
    const presentation = presentPath(snapshot());

    expect(presentation).not.toBeNull();
    expect(presentation?.instanceId).toBe("instance-1");
    expect(presentation?.pathId).toBe("find-extra-work");
    expect(presentation?.definitionId).toBe("find-extra-work");
    expect(presentation?.title).toBeTruthy();
    expect(typeof presentation?.progressPercent).toBe("number");
  });

  it("carries nothing beyond the agreed fields", () => {
    // A catalog definition holds node lists, hrefs, capability keys and availability
    // rules. If any of that starts riding along, it reaches the browser again.
    expect(Object.keys(presentPath(snapshot()) ?? {}).sort()).toEqual([
      "definitionId",
      "instanceId",
      "pathId",
      "progressPercent",
      "title",
    ]);
  });

  it("reports whole percentages so the client never re-derives progress", () => {
    const presentation = presentPath(snapshot({ completedNodeIds: ["profile"] }));

    expect(presentation?.progressPercent).toBe(Math.round(presentation?.progressPercent ?? -1));
    expect(presentation?.progressPercent).toBeGreaterThanOrEqual(0);
    expect(presentation?.progressPercent).toBeLessThanOrEqual(100);
  });

  it("advances the reported percentage as steps complete", () => {
    const none = presentPath(snapshot())?.progressPercent ?? 0;
    const some = presentPath(snapshot({ completedNodeIds: ["profile", "credentials"] }))?.progressPercent ?? 0;

    expect(some).toBeGreaterThan(none);
  });

  it("drops a Path whose definition no longer exists rather than rendering it untitled", () => {
    // A stored Path can outlive its catalog entry. An unnamed card tells the user
    // nothing they can act on, so it is omitted instead.
    expect(presentPath(snapshot({ pathId: "no-such-path-in-catalog" }))).toBeNull();
    expect(
      presentPaths([snapshot(), snapshot({ instanceId: "instance-2", pathId: "no-such-path-in-catalog" })]),
    ).toHaveLength(1);
  });

  it("finds a presentation by instance, and answers null rather than guessing", () => {
    const presentations = presentPaths([snapshot()]);

    expect(findPathPresentation(presentations, "instance-1")?.instanceId).toBe("instance-1");
    expect(findPathPresentation(presentations, "instance-missing")).toBeNull();
    expect(findPathPresentation(presentations, null)).toBeNull();
    expect(findPathPresentation(presentations, undefined)).toBeNull();
  });
});
