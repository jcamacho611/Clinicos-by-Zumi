import { describe, expect, it } from "vitest";
import { composeGridOpportunity, getGridCompositionTemplate } from "@/lib/orchestration/grid-composition-engine";
import { canDiscoverSupply, needFromIntent, type GridNeed, type GridSupply } from "@/lib/orchestration/grid-demand-engine";

describe("Grid universal composition", () => {
  it("does not complete a regulated staffing composition when the professional is ineligible", () => {
    const template = getGridCompositionTemplate("staffing-shift");
    expect(template).not.toBeNull();

    const result = composeGridOpportunity({
      template: template!,
      candidates: [
        { id: "rn-1", slotKey: "professional", eligible: false, available: true, score: 1, blockers: ["New York RN license not verified"] },
        { id: "shift-1", slotKey: "shift", eligible: true, available: true, score: 1, blockers: [] },
        { id: "clinic-1", slotKey: "organization", eligible: true, available: true, score: 1, blockers: [] },
      ],
    });

    expect(result.complete).toBe(false);
    expect(result.blockers).toContain("New York RN license not verified");
  });

  it("assembles every required slot before declaring an aesthetic service complete", () => {
    const template = getGridCompositionTemplate("aesthetic-service");
    expect(template).not.toBeNull();

    const result = composeGridOpportunity({
      template: template!,
      candidates: template!.slots.map((slot, index) => ({
        id: `candidate-${index}`,
        slotKey: slot.key,
        eligible: true,
        available: true,
        score: 1,
        blockers: [],
      })),
    });

    expect(result.complete).toBe(true);
    expect(result.assignments.every((assignment) => assignment.satisfied)).toBe(true);
  });

  it("does not let a high score outrank hard ineligibility inside a slot", () => {
    const template = getGridCompositionTemplate("staffing-shift")!;
    const result = composeGridOpportunity({
      template,
      candidates: [
        { id: "blocked-star", slotKey: "professional", eligible: false, available: true, score: 999, blockers: ["Credential expired"] },
        { id: "eligible-rn", slotKey: "professional", eligible: true, available: true, score: 0.1, blockers: [] },
        { id: "shift", slotKey: "shift", eligible: true, available: true, score: 1, blockers: [] },
        { id: "clinic", slotKey: "organization", eligible: true, available: true, score: 1, blockers: [] },
      ],
    });

    expect(result.complete).toBe(true);
    expect(result.assignments.find((assignment) => assignment.slotKey === "professional")?.candidateIds).toEqual(["eligible-rn"]);
  });

  it("turns staffing intent into universal Grid demand", () => {
    const need = needFromIntent({
      id: "need-1",
      requesterId: "clinic-user",
      organizationId: "org-a",
      goal: "I need an RN tomorrow in Brooklyn",
      candidatePathId: "fill-staffing-need",
      timing: "tomorrow",
      location: "Brooklyn",
    });

    expect(need?.needType).toBe("staffing");
    expect(need?.urgency).toBe("urgent");
    expect(need?.requiredSlotKeys).toEqual(["professional", "shift", "organization"]);
  });

  it("prevents private and cross-organization supply from leaking into discovery", () => {
    const need: GridNeed = {
      id: "n1",
      requesterId: "u1",
      organizationId: "org-a",
      needType: "space",
      title: "Need a room",
      requiredSlotKeys: ["location"],
      urgency: "routine",
      visibility: "network_only",
      requirements: [],
      status: "open",
    };

    const privateSupply: GridSupply = {
      id: "s1",
      ownerId: "u2",
      organizationId: "org-b",
      resourceType: "room",
      title: "Private room",
      capabilityKeys: [],
      visibility: "private",
      status: "active",
    };

    const orgOnlySupply: GridSupply = { ...privateSupply, id: "s2", visibility: "organization_only" };
    const publicSupply: GridSupply = { ...privateSupply, id: "s3", visibility: "public" };

    expect(canDiscoverSupply({ need, supply: privateSupply, requesterOrganizationIds: ["org-a"] })).toBe(false);
    expect(canDiscoverSupply({ need, supply: orgOnlySupply, requesterOrganizationIds: ["org-a"] })).toBe(false);
    expect(canDiscoverSupply({ need, supply: publicSupply, requesterOrganizationIds: ["org-a"] })).toBe(true);
  });
});
