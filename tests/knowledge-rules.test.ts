import { describe, expect, it } from "vitest";
import { correctKnowledgeItemSchema, createKnowledgeItemSchema, reviewKnowledgeItemSchema } from "@/lib/knowledge-rules";

describe("governed knowledge rules", () => {
  it("requires substantive source content", () => {
    expect(() => createKnowledgeItemSchema.parse({ layer: "organization", title: "Too short", content: "short", sourceName: "Clinic" })).toThrow();
    expect(createKnowledgeItemSchema.parse({ layer: "organization", title: "Emergency routing policy", content: "This source contains enough reviewed policy language to remain governed.", sourceName: "Clinic policy team" }).title).toBe("Emergency routing policy");
  });

  it("requires a reviewer note for every decision", () => {
    expect(() => reviewKnowledgeItemSchema.parse({ action: "approve", notes: "short" })).toThrow();
    expect(reviewKnowledgeItemSchema.parse({ action: "reject", notes: "Needs a source date and reviewer confirmation." }).action).toBe("reject");
  });

  it("requires a correction to remain substantive and auditable", () => {
    expect(() => correctKnowledgeItemSchema.parse({ title: "Emergency routing policy", content: "short", sourceName: "Clinic", notes: "Needs review." })).toThrow();
    expect(correctKnowledgeItemSchema.parse({ title: "Emergency routing policy", content: "Updated source content with a human interpretation boundary.", sourceName: "Clinic policy team", notes: "Corrected source language for reviewer validation." }).notes).toContain("reviewer");
  });
});
