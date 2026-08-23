import { describe, expect, it } from "vitest";
import { buildEffectiveRelationshipWhere } from "./relationship-repository";

describe("relationship repository effective-date semantics", () => {
  it("requires active status and a relationship that has started but not ended", () => {
    const at = new Date("2026-08-22T12:00:00.000Z");

    expect(buildEffectiveRelationshipWhere(at)).toEqual({
      status: "active",
      effectiveFrom: { lte: at },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gt: at } },
      ],
    });
  });
});
