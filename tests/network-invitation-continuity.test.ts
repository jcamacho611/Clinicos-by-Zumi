import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { deriveAcceptedRelationshipGaps } from "@/lib/network-growth-continuity";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("network invitation continuity", () => {
  it("turns an accepted known-organization invitation with no relationship into explicit unfinished work", () => {
    const gaps = deriveAcceptedRelationshipGaps({
      currentOrganizationId: "org-a",
      invitations: [{
        id: "invite-1",
        status: "accepted",
        invitingOrganizationId: "org-a",
        targetOrganizationId: "org-b",
        invitingOrganizationName: "Clinic A",
        targetOrganizationName: "Clinic B",
        inviteeName: "Clinic B",
        inviteeType: "clinic",
        specialty: "Imaging",
      }],
      connections: [],
    });

    expect(gaps).toEqual([{
      invitationId: "invite-1",
      counterpartOrganizationId: "org-b",
      counterpartName: "Clinic B",
      inviteeType: "clinic",
      specialty: "Imaging",
      nextStep: "request_relationship",
    }]);
  });

  it("does not duplicate work when a pending, active, or suspended relationship already exists", () => {
    for (const status of ["pending", "active", "suspended"]) {
      const gaps = deriveAcceptedRelationshipGaps({
        currentOrganizationId: "org-a",
        invitations: [{
          id: `invite-${status}`,
          status: "accepted",
          invitingOrganizationId: "org-a",
          targetOrganizationId: "org-b",
          invitingOrganizationName: "Clinic A",
          targetOrganizationName: "Clinic B",
          inviteeName: "Clinic B",
          inviteeType: "clinic",
          specialty: null,
        }],
        connections: [{ sourceOrganizationId: "org-a", targetOrganizationId: "org-b", status }],
      });
      expect(gaps).toEqual([]);
    }
  });

  it("does not invent a relationship target for external invitations that have not become a known organization", () => {
    const gaps = deriveAcceptedRelationshipGaps({
      currentOrganizationId: "org-a",
      invitations: [{
        id: "invite-external",
        status: "accepted",
        invitingOrganizationId: "org-a",
        targetOrganizationId: null,
        invitingOrganizationName: "Clinic A",
        targetOrganizationName: null,
        inviteeName: "External partner",
        inviteeType: "referral_partner",
        specialty: null,
      }],
      connections: [],
    });

    expect(gaps).toEqual([]);
  });

  it("handles accepted invitations where the current organization is the invited target", () => {
    const gaps = deriveAcceptedRelationshipGaps({
      currentOrganizationId: "org-b",
      invitations: [{
        id: "invite-inbound",
        status: "accepted",
        invitingOrganizationId: "org-a",
        targetOrganizationId: "org-b",
        invitingOrganizationName: "Clinic A",
        targetOrganizationName: "Clinic B",
        inviteeName: "Clinic B",
        inviteeType: "clinic",
        specialty: null,
      }],
      connections: [],
    });

    expect(gaps[0]?.counterpartOrganizationId).toBe("org-a");
    expect(gaps[0]?.counterpartName).toBe("Clinic A");
  });

  it("wires accepted relationship gaps to the existing purpose-scoped connection form", () => {
    const repository = read("src/lib/repositories/network-growth-repository.ts");
    const growthPanel = read("src/components/clinic/network-growth-panel.tsx");
    const directoryPage = read("src/app/(platform)/network/directory/page.tsx");
    const directoryRoute = read("src/components/clinic/network/network-directory-route.tsx");
    const directoryPanel = read("src/components/clinic/network-directory-panel.tsx");

    expect(repository).toContain("deriveAcceptedRelationshipGaps");
    expect(repository).toContain("relationshipGaps");
    expect(growthPanel).toContain("Relationship setup still needed");
    expect(growthPanel).toContain("/network/directory?connect=");
    expect(directoryPage).toContain("searchParams");
    expect(directoryRoute).toContain("initialTargetOrganizationId");
    expect(directoryPanel).toContain("initialTargetOrganizationId");
    expect(directoryPanel).toContain("Requested purposes");
    expect(directoryPanel).toContain("Request clinic connection");
  });

  it("never turns invitation acceptance into chart access or an automatically active connection", () => {
    const repository = read("src/lib/repositories/network-growth-repository.ts");
    const continuity = read("src/lib/network-growth-continuity.ts");

    expect(repository).not.toContain("networkConnection.create");
    expect(continuity).not.toMatch(/chart access granted|status:\s*["']active["']/i);
  });
});