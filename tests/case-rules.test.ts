import { describe, expect, it } from "vitest";
import {
  assertCasePacketTransition,
  buildCaseChecklist,
  canMarkCasePacketReady,
  casePacketReadiness,
  createCaseSchema,
  nextCaseTaskStatus,
  parseCaseChecklist,
} from "@/lib/case-rules";

describe("no-fault and workers compensation case rules", () => {
  it("requires core injury facts and an employer for workers compensation", () => {
    const common = {
      patientId: "pt-1001",
      accidentDate: "2026-07-01",
      claimNumber: "CLAIM-100",
      carrier: "Demo Carrier",
      injuredBodyParts: ["Lumbar spine"],
      diagnosisCodes: ["m54.50"],
    };
    expect(createCaseSchema.safeParse({ ...common, caseType: "nofault" }).success).toBe(true);
    expect(createCaseSchema.safeParse({ ...common, caseType: "workers_comp" }).success).toBe(false);
    const parsed = createCaseSchema.parse({ ...common, caseType: "workers_comp", employer: { name: "Demo Employer" } });
    expect(parsed.diagnosisCodes).toEqual(["M54.50"]);
  });

  it("calculates readiness from required items only", () => {
    const checklist = buildCaseChecklist("nofault", "attorney_packet");
    expect(casePacketReadiness(checklist)).toBe(0);
    const required = checklist.filter((item) => item.required);
    const half = checklist.map((item, index) => ({ ...item, complete: index < Math.ceil(required.length / 2) }));
    expect(casePacketReadiness(half)).toBeGreaterThan(0);
    const complete = checklist.map((item) => ({ ...item, complete: item.required }));
    expect(casePacketReadiness(complete)).toBe(100);
    expect(canMarkCasePacketReady(complete)).toBe(true);
  });

  it("prevents generation and approval from bypassing human review states", () => {
    const incomplete = buildCaseChecklist("workers_comp", "carrier_submission");
    expect(() => assertCasePacketTransition("draft", "mark_ready", incomplete)).toThrow();
    expect(() => assertCasePacketTransition("draft", "generate_manual", incomplete)).toThrow();
    const complete = incomplete.map((item) => ({ ...item, complete: item.required }));
    expect(() => assertCasePacketTransition("draft", "mark_ready", complete)).not.toThrow();
    expect(() => assertCasePacketTransition("ready", "generate_manual", complete)).not.toThrow();
    expect(() => assertCasePacketTransition("generated_manual", "approve", complete)).not.toThrow();
    expect(() => assertCasePacketTransition("approved", "mark_item", complete)).toThrow();
  });

  it("uses explicit task completion and reopening transitions", () => {
    expect(nextCaseTaskStatus("open", "complete")).toBe("completed");
    expect(nextCaseTaskStatus("open", "cancel")).toBe("cancelled");
    expect(nextCaseTaskStatus("completed", "reopen")).toBe("open");
    expect(() => nextCaseTaskStatus("completed", "complete")).toThrow();
  });

  it("rejects malformed persisted checklists rather than assuming readiness", () => {
    expect(parseCaseChecklist({ complete: true })).toEqual([]);
    expect(casePacketReadiness(parseCaseChecklist(null))).toBe(0);
  });
});
