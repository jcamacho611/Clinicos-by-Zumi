import { describe, expect, it } from "vitest";
import { deriveAcceptedRelationshipGaps } from "@/lib/network-invitation-continuity";

const acceptedInvitation = {
  id: "invitation-1",
  status: "accepted",
  invitingOrganizationId: "org-a",
  targetOrganizationId: "org-b",
  invitingOrganizationName: "Organization A",
  targetOrganizationName: "Organization B",
  inviteeName: "Organization B",
  inviteeType: "clinic",
  specialty: "Imaging",
};

describe("network invitation relationship continuity", () => {
  it("projects accepted participation as relationship setup work, never as authority", () => {
    const gaps = deriveAcceptedRelationshipGaps({
      currentOrganizationId: "org-a",
      invitations: [acceptedInvitation],
      connections: [],
    });

    expect(gaps).toEqual([{
      invitationId: "invitation-1",
      counterpartOrganizationId: "org-b",
      counterpartName: "Organization B",
      inviteeType: "clinic",
      specialty: "Imaging",
      state: "relationship_setup_needed",
      nextStep: "request_relationship",
    }]);
    expect(gaps[0]).not.toHaveProperty("trustLevel");
    expect(gaps[0]).not.toHaveProperty("chartAccess");
    expect(gaps[0]).not.toHaveProperty("disclosureAuthority");
    expect(gaps[0]).not.toHaveProperty("paymentAuthority");
  });

  it("derives the inviting organization as counterpart for the invited organization", () => {
    expect(deriveAcceptedRelationshipGaps({
      currentOrganizationId: "org-b",
      invitations: [acceptedInvitation],
      connections: [],
    })).toEqual([expect.objectContaining({
      invitationId: "invitation-1",
      counterpartOrganizationId: "org-a",
      counterpartName: "Organization A",
    })]);
  });

  it("does not invent setup work for an unaccepted, external, unrelated, or self invitation", () => {
    const invitations = [
      { ...acceptedInvitation, id: "sent", status: "sent" },
      { ...acceptedInvitation, id: "external", targetOrganizationId: null, targetOrganizationName: null },
      { ...acceptedInvitation, id: "unrelated", invitingOrganizationId: "org-c", targetOrganizationId: "org-d" },
      { ...acceptedInvitation, id: "self", targetOrganizationId: "org-a" },
    ];

    expect(deriveAcceptedRelationshipGaps({
      currentOrganizationId: "org-a",
      invitations,
      connections: [],
    })).toEqual([]);
  });

  it("suppresses duplicate setup work for either connection direction and repeated invitations", () => {
    for (const status of ["pending", "active", "suspended"]) {
      for (const connection of [
        { sourceOrganizationId: "org-a", targetOrganizationId: "org-b", status },
        { sourceOrganizationId: "org-b", targetOrganizationId: "org-a", status },
      ]) {
        expect(deriveAcceptedRelationshipGaps({
          currentOrganizationId: "org-a",
          invitations: [acceptedInvitation],
          connections: [connection],
        })).toEqual([]);
      }
    }

    expect(deriveAcceptedRelationshipGaps({
      currentOrganizationId: "org-a",
      invitations: [acceptedInvitation, { ...acceptedInvitation, id: "invitation-2" }],
      connections: [],
    })).toHaveLength(1);
  });
});
