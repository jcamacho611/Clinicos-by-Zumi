import { describe, expect, it } from "vitest";
import { pathSignalKind, pathSignalLabel } from "@/lib/orchestration/path-signal-repository";

describe("Living Home Path signals", () => {
  it("distinguishes Path start, advancement, and completion", () => {
    expect(pathSignalKind("path.started")).toBe("started");
    expect(pathSignalKind("path.node_completed_from_domain_event")).toBe("advanced");
    expect(pathSignalKind("path.completed_from_domain_event")).toBe("completed");
  });

  it("produces concise non-PHI labels", () => {
    expect(pathSignalLabel({ kind: "started", pathTitle: "Become Grid-ready", nodeLabel: "Learning pathway" })).toBe("Become Grid-ready started");
    expect(pathSignalLabel({ kind: "advanced", pathTitle: "Become Grid-ready", nodeLabel: "Competency" })).toBe("Competency completed");
    expect(pathSignalLabel({ kind: "completed", pathTitle: "Fill an open staffing need", nodeLabel: "Confirm" })).toBe("Fill an open staffing need completed");
  });
});
