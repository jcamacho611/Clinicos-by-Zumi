import { describe, expect, it } from "vitest";
import { addCareTeamMemberSchema, careTeamMemberTransitionSchema, careTeamMessageSchema, createCareTeamSchema } from "@/lib/care-team-rules";

describe("care team rules", () => {
  it("requires a patient-linked room and reviewable source", () => {
    expect(createCareTeamSchema.parse({ patientId: "pt-1", name: "Shared care room", sourceType: "referral" }).sourceType).toBe("referral");
    expect(() => createCareTeamSchema.parse({ patientId: "pt-1", name: "x", sourceType: "manual" })).toThrow();
  });

  it("validates minimum-necessary member invitations", () => {
    expect(addCareTeamMemberSchema.parse({ representedOrganizationId: "org-2", role: "specialist" }).accessLevel).toBe("minimum_necessary");
    expect(() => addCareTeamMemberSchema.parse({ representedOrganizationId: "org-2", role: "" })).toThrow();
  });

  it("requires human notes for membership decisions and bounds messages", () => {
    expect(careTeamMemberTransitionSchema.parse({ action: "accept", note: "The connected clinic confirmed participation." }).action).toBe("accept");
    expect(() => careTeamMemberTransitionSchema.parse({ action: "remove", note: "short" })).toThrow();
    expect(careTeamMessageSchema.parse({ body: "Provider review remains required before release." }).body).toContain("Provider");
  });
});
