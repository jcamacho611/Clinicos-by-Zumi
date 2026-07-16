import { describe, expect, it } from "vitest";
import { networkInvitationSchema, networkInvitationTransitionSchema } from "@/lib/network-growth-rules";

describe("network growth rules", () => {
  it("accepts known and manual partner applications", () => {
    expect(networkInvitationSchema.parse({ inviteeType: "clinic", inviteeName: "Aster Clinic", targetOrganizationId: "org-aster" }).targetOrganizationId).toBe("org-aster");
    expect(networkInvitationSchema.parse({ inviteeType: "diagnostic_partner", inviteeName: "Aster Imaging", inviteeEmail: "imaging@example.test" }).inviteeType).toBe("diagnostic_partner");
  });

  it("rejects unsupported partner types and invalid email addresses", () => {
    expect(() => networkInvitationSchema.parse({ inviteeType: "unknown", inviteeName: "Aster" })).toThrow();
    expect(() => networkInvitationSchema.parse({ inviteeType: "clinic", inviteeName: "Aster", inviteeEmail: "not-an-email" })).toThrow();
  });

  it("requires a human note for every lifecycle decision", () => {
    expect(() => networkInvitationTransitionSchema.parse({ action: "accept" })).toThrow();
    expect(networkInvitationTransitionSchema.parse({ action: "verify", note: "Identity and participation evidence reviewed." }).action).toBe("verify");
    expect(networkInvitationTransitionSchema.parse({ action: "accept", note: "Invited clinic confirmed the participation scope." }).action).toBe("accept");
  });
});
