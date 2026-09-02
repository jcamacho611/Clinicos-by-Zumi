import { describe, expect, it } from "vitest";
import { canonicalEcosystemGraph } from "@/lib/ecosystem/canonical-ecosystem-graph";
import { memberStatusLabel, memberViewForPlane } from "@/lib/design/member-view-language";

const forbidden = /plane|projection|orchestration|tenant|state machine|governed/i;

describe("member view language", () => {
  it("maps all five canonical plane IDs to ordinary customer-facing views", () => {
    const labels = canonicalEcosystemGraph.planes.map((plane) => memberViewForPlane(plane.id).label);
    expect(labels).toEqual(["Connections", "Opportunities", "Journey", "Activity", "Growth"]);
  });

  it("keeps architecture jargon out of first-order descriptions", () => {
    for (const plane of canonicalEcosystemGraph.planes) {
      const view = memberViewForPlane(plane.id);
      expect(view.description).not.toMatch(forbidden);
    }
  });

  it("translates internal member statuses into calm customer language", () => {
    expect(memberStatusLabel("person_present")).toBe("Available");
    expect(memberStatusLabel("discovery_available")).toBe("Available");
    expect(memberStatusLabel("profile_started")).toBe("In progress");
    expect(memberStatusLabel("claims_present")).toBe("In progress");
    expect(memberStatusLabel("context_claimed")).toBe("In progress");
    expect(memberStatusLabel("account_connected")).toBe("Ready");
    expect(memberStatusLabel("not_projected")).toBe("Not available yet");
  });
});
