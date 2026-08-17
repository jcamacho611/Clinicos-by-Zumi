import { describe, expect, it } from "vitest";
import { createInternalMessageSchema, createInternalThreadSchema } from "@/lib/internal-message-rules";

describe("native internal messaging rules", () => {
  it("accepts a patient-linked internal coordination thread", () => {
    expect(createInternalThreadSchema.safeParse({
      patientId: "patient-1",
      subject: "Paperwork follow-up",
      category: "front_desk",
      assignedTeam: "front_desk",
      body: "Please confirm the intake packet before tomorrow's visit.",
    }).success).toBe(true);
  });

  it("allows an organization-only thread", () => {
    expect(createInternalThreadSchema.safeParse({
      patientId: null,
      subject: "Morning huddle",
      body: "Review today's operating blockers.",
    }).success).toBe(true);
  });

  it("rejects empty or oversized message content", () => {
    expect(createInternalMessageSchema.safeParse({ body: "" }).success).toBe(false);
    expect(createInternalMessageSchema.safeParse({ body: "x".repeat(5001) }).success).toBe(false);
  });
});
