import { describe, expect, it } from "vitest";
import { canManageNetworkConnections, connectionTransition, createNetworkConnectionSchema, transitionNetworkConnectionSchema } from "../src/lib/network-directory-rules";

describe("connected clinic directory rules", () => {
  it("requires a different active organization and explicit purposes for connection requests", () => {
    expect(createNetworkConnectionSchema.safeParse({ targetOrganizationId: "org-luxe", allowedPurposes: ["treatment", "operations"] }).success).toBe(true);
    expect(createNetworkConnectionSchema.safeParse({ targetOrganizationId: "org-luxe", allowedPurposes: [] }).success).toBe(false);
    expect(createNetworkConnectionSchema.safeParse({ targetOrganizationId: "org-luxe", allowedPurposes: ["treatment", "treatment"] }).success).toBe(false);
  });

  it("keeps relationship transitions explicit and sequential", () => {
    expect(connectionTransition("pending", "approve")).toBe("active");
    expect(connectionTransition("active", "suspend")).toBe("suspended");
    expect(connectionTransition("suspended", "restore")).toBe("active");
    expect(connectionTransition("active", "approve")).toBeNull();
    expect(transitionNetworkConnectionSchema.safeParse({ action: "suspend", reason: "Vendor relationship review is overdue." }).success).toBe(true);
    expect(transitionNetworkConnectionSchema.safeParse({ action: "suspend", reason: "short" }).success).toBe(false);
  });

  it("keeps relationship management limited to organization administrators", () => {
    expect(canManageNetworkConnections("clinic_owner")).toBe(true);
    expect(canManageNetworkConnections("administrator")).toBe(true);
    expect(canManageNetworkConnections("provider")).toBe(false);
    expect(canManageNetworkConnections("front_desk")).toBe(false);
  });
});
