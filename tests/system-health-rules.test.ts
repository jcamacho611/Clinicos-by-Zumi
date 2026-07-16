import { describe, expect, it } from "vitest";
import { integrationRetrySchema, reliabilityEventSchema, reliabilityEventTransitionSchema } from "@/lib/system-health-rules";

describe("system health and recovery rules", () => {
  it("accepts persisted operational event categories and severity", () => {
    expect(reliabilityEventSchema.parse({ category: "incident", title: "Interface review" }).severity).toBe("normal");
    expect(reliabilityEventSchema.safeParse({ category: "unknown", title: "Bad event" }).success).toBe(false);
    expect(reliabilityEventSchema.safeParse({ category: "backup", title: "x" }).success).toBe(false);
  });

  it("requires a human note for event recovery transitions", () => {
    expect(reliabilityEventTransitionSchema.safeParse({ action: "acknowledge", note: "Operator reviewed the queue." }).success).toBe(true);
    expect(reliabilityEventTransitionSchema.safeParse({ action: "resolve", note: "short" }).success).toBe(false);
    expect(reliabilityEventTransitionSchema.safeParse({ action: "reopen", note: "The issue returned after deployment." }).success).toBe(true);
  });

  it("requires a human note before an integration retry is queued", () => {
    expect(integrationRetrySchema.safeParse({ note: "Adapter retry reviewed by operations." }).success).toBe(true);
    expect(integrationRetrySchema.safeParse({ note: "retry" }).success).toBe(false);
  });
});
