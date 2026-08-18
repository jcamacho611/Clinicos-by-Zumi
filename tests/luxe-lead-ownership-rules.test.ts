import { describe, expect, it } from "vitest";
import { luxeLeadClaimDecision } from "@/lib/luxe-lead-ownership-rules";

describe("Luxe lead claim rules", () => {
  it("allows an unassigned lead to be claimed", () => {
    expect(luxeLeadClaimDecision(null, "user-1")).toBe("claim");
  });

  it("is idempotent for the current owner", () => {
    expect(luxeLeadClaimDecision("user-1", "user-1")).toBe("already_owned");
  });

  it("blocks a different user from stealing an assigned lead", () => {
    expect(luxeLeadClaimDecision("user-2", "user-1")).toBe("owned_by_other");
  });
});
