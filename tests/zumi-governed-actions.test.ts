import { describe, expect, it } from "vitest";
import {
  governedActionIdSchema,
  prepareCreateTaskAction,
  verifyPreparedActionBinding,
} from "@/features/zumi/governed-actions";

const context = { userId: "user-1", organizationId: "org-1", role: "owner" };
const input = { category: "follow_up", title: "Call patient about intake", priority: "high" as const };
const now = new Date("2026-08-19T04:00:00.000Z");

describe("Zumi governed actions", () => {
  it("rejects model-supplied unknown action ids", () => {
    expect(governedActionIdSchema.safeParse("database.run_sql").success).toBe(false);
  });

  it("rejects invalid task arguments before any handler can run", () => {
    expect(() => prepareCreateTaskAction(context, { category: "x", title: "x" }, now)).toThrow();
  });

  it("binds a reviewed task to the exact user, organization, payload, and expiry", () => {
    const prepared = prepareCreateTaskAction(context, input, now);
    expect(prepared.risk).toBe("REVIEW");
    expect(prepared.requiresConfirmation).toBe(true);
    expect(verifyPreparedActionBinding(prepared, context, new Date("2026-08-19T04:05:00.000Z"))).toBe(true);
    expect(verifyPreparedActionBinding(prepared, { ...context, organizationId: "org-2" }, new Date("2026-08-19T04:05:00.000Z"))).toBe(false);
  });

  it("rejects a payload changed after review", () => {
    const prepared = prepareCreateTaskAction(context, input, now);
    const changed = { ...prepared, input: { ...prepared.input, title: "Different task" } };
    expect(verifyPreparedActionBinding(changed, context, new Date("2026-08-19T04:05:00.000Z"))).toBe(false);
  });

  it("rejects an expired prepared action", () => {
    const prepared = prepareCreateTaskAction(context, input, now);
    expect(verifyPreparedActionBinding(prepared, context, new Date("2026-08-19T04:11:00.000Z"))).toBe(false);
  });
});
