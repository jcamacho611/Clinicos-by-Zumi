import { describe, expect, it } from "vitest";
import { evaluateProductionReadiness } from "@/lib/security/production-readiness";

const base = {
  environment: "production",
  dataClass: "PHI" as const,
  capability: "zumi_phi",
  provider: "provider-a",
};

describe("production readiness", () => {
  it("blocks when no applicable evidence exists", () => {
    expect(evaluateProductionReadiness({ ...base, controls: [] })).toEqual({
      state: "BLOCKED",
      blockers: ["NO_APPLICABLE_EVIDENCE"],
    });
  });

  it("does not let technical evidence alone authorize an external PHI rail", () => {
    const decision = evaluateProductionReadiness({
      ...base,
      controls: [
        { controlId: "egress", applicable: true, state: "TECHNICAL_EVIDENCE_GREEN" },
        { controlId: "legal", applicable: true, state: "LEGAL_REVIEW_REQUIRED" },
      ],
    });
    expect(decision.state).toBe("PARTIAL");
    expect(decision.blockers).toEqual(["egress", "legal"]);
  });

  it("blocks when evidence for another scope is not applicable", () => {
    const decision = evaluateProductionReadiness({
      ...base,
      controls: [
        { controlId: "staging-provider-b", applicable: false, state: "PRODUCTION_VERIFIED" },
      ],
    });
    expect(decision).toEqual({
      state: "BLOCKED",
      blockers: ["NO_APPLICABLE_EVIDENCE"],
    });
  });

  it("returns degraded when any applicable evidence has been revoked", () => {
    const decision = evaluateProductionReadiness({
      ...base,
      controls: [
        { controlId: "tenant-isolation", applicable: true, state: "PRODUCTION_VERIFIED" },
        { controlId: "vendor-authorization", applicable: true, state: "DEGRADED_OR_REVOKED" },
      ],
    });
    expect(decision).toEqual({
      state: "DEGRADED_OR_REVOKED",
      blockers: ["vendor-authorization"],
    });
  });

  it("returns production verified only when every applicable control is verified", () => {
    const decision = evaluateProductionReadiness({
      ...base,
      controls: [
        { controlId: "tenant-isolation", applicable: true, state: "PRODUCTION_VERIFIED" },
        { controlId: "vendor-authorization", applicable: true, state: "PRODUCTION_VERIFIED" },
      ],
    });
    expect(decision).toEqual({ state: "PRODUCTION_VERIFIED", blockers: [] });
  });

  it("returns partial when technical evidence exists but production approval remains pending", () => {
    const decision = evaluateProductionReadiness({
      ...base,
      controls: [
        { controlId: "technical", applicable: true, state: "TECHNICAL_EVIDENCE_GREEN" },
        { controlId: "approval", applicable: true, state: "PRODUCTION_APPROVAL_REQUIRED" },
      ],
    });
    expect(decision.state).toBe("PARTIAL");
    expect(decision.blockers).toEqual(["technical", "approval"]);
  });
});
