import { describe, expect, it } from "vitest";
import { createTaskSchema } from "@/lib/task-create-rules";

describe("native task creation rules", () => {
  it("accepts an organization task with a valid owner and priority", () => {
    expect(createTaskSchema.safeParse({
      patientId: null,
      ownerId: "user-1",
      category: "follow_up",
      title: "Call patient about paperwork",
      details: "Confirm the intake packet was received.",
      priority: "high",
      dueAt: "2026-08-18T14:00:00.000Z",
    }).success).toBe(true);
  });

  it("allows patient and due time to remain optional", () => {
    expect(createTaskSchema.safeParse({
      category: "operations",
      title: "Review front desk queue",
      priority: "normal",
    }).success).toBe(true);
  });

  it("rejects invalid titles, categories, priorities, and due timestamps", () => {
    expect(createTaskSchema.safeParse({ category: "x", title: "ok", priority: "normal" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ category: "operations", title: "Valid title", priority: "critical" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ category: "operations", title: "Valid title", priority: "normal", dueAt: "tomorrow" }).success).toBe(false);
  });
});
