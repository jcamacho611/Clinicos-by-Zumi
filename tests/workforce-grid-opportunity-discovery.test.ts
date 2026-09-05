import { describe, expect, it } from "vitest";
import { notificationFromEvent } from "@/lib/orchestration/notification-engine";
import {
  createWorkforceGridMatchEvent,
  rankWorkforceGridOpportunities,
  type WorkforceGridOpportunity,
} from "@/lib/workforce/grid-opportunity-discovery";

const career = {
  skills: ["care coordination", "triage"],
  careerGoals: ["registered nurse", "outpatient care"],
  locationPreferences: ["Brooklyn", "New York"],
  availabilityPreferences: ["weekends"],
};

function opportunity(
  overrides: Partial<WorkforceGridOpportunity> = {},
): WorkforceGridOpportunity {
  return {
    id: "opp-1",
    organizationId: "org-1",
    title: "Weekend RN coverage",
    category: "nursing",
    serviceName: "Registered nurse",
    city: "Brooklyn",
    state: "NY",
    requiredSkills: ["triage"],
    availabilityLabels: ["weekends"],
    eligibility: { eligible: true, reasons: [] },
    ...overrides,
  };
}

describe("workforce → Grid opportunity discovery", () => {
  it("keeps deterministic eligibility above perfect resume/career fit", () => {
    const ranked = rankWorkforceGridOpportunities({
      career,
      opportunities: [
        opportunity({
          id: "blocked-perfect-fit",
          eligibility: { eligible: false, reasons: ["Credential missing"] },
        }),
        opportunity({
          id: "eligible-weaker-fit",
          city: "Queens",
          requiredSkills: [],
          availabilityLabels: [],
          eligibility: { eligible: true, reasons: [] },
        }),
      ],
    });

    expect(ranked[0]?.id).toBe("eligible-weaker-fit");
    expect(ranked[0]?.eligible).toBe(true);
    expect(ranked[1]?.id).toBe("blocked-perfect-fit");
    expect(ranked[1]?.eligible).toBe(false);
    expect(ranked[1]?.blockers).toContain("Credential missing");
  });

  it("uses career claims only as soft ranking signals", () => {
    const ranked = rankWorkforceGridOpportunities({
      career,
      opportunities: [
        opportunity({ id: "good-fit" }),
        opportunity({
          id: "poor-fit",
          title: "Weekday radiology role",
          category: "radiology",
          serviceName: "Radiology technician",
          city: "Albany",
          state: "NY",
          requiredSkills: ["radiology"],
          availabilityLabels: ["weekdays"],
        }),
      ],
    });

    expect(ranked[0]?.id).toBe("good-fit");
    expect(ranked[0]?.score).toBeGreaterThan(ranked[1]?.score ?? 0);
    expect(ranked.every((candidate) => candidate.eligible)).toBe(true);
  });

  it("does not treat unknown opportunity information as a positive match", () => {
    const ranked = rankWorkforceGridOpportunities({
      career,
      opportunities: [
        opportunity({
          id: "unknown-fields",
          title: "Open healthcare role",
          category: "healthcare",
          serviceName: null,
          city: null,
          state: null,
          requiredSkills: [],
          availabilityLabels: [],
        }),
        opportunity({ id: "known-fit" }),
      ],
    });

    expect(ranked[0]?.id).toBe("known-fit");
    expect(ranked[1]?.id).toBe("unknown-fields");
  });

  it("creates an alert only for an eligible ranked opportunity", () => {
    const [eligible] = rankWorkforceGridOpportunities({
      career,
      opportunities: [opportunity({ id: "opp-eligible" })],
    });
    expect(eligible?.eligible).toBe(true);

    const event = createWorkforceGridMatchEvent({
      personId: "person-1",
      match: eligible!,
      occurredAt: new Date("2026-09-02T12:00:00.000Z"),
    });
    const notification = notificationFromEvent({
      event,
      recipientId: "account-1",
      channel: "in_app",
      containsPhi: false,
    });

    expect(event.type).toBe("grid_match_available");
    expect(event.sourceType).toBe("grid");
    expect(event.sourceId).toBe("opp-eligible");
    expect(event.payload).toMatchObject({
      label: "New Grid opportunity",
      opportunityId: "opp-eligible",
      href: "/grid",
    });
    expect(notification.recipientId).toBe("account-1");
    expect(notification.requiresPhiApprovedChannel).toBe(false);
  });

  it("refuses to create an alert for an ineligible opportunity even with perfect soft fit", () => {
    const [blocked] = rankWorkforceGridOpportunities({
      career,
      opportunities: [
        opportunity({
          id: "opp-blocked",
          eligibility: { eligible: false, reasons: ["Malpractice not verified"] },
        }),
      ],
    });

    expect(blocked?.eligible).toBe(false);
    expect(() =>
      createWorkforceGridMatchEvent({
        personId: "person-1",
        match: blocked!,
        occurredAt: new Date("2026-09-02T12:00:00.000Z"),
      }),
    ).toThrow(/eligible/i);
  });

  it("keeps alert payload free of private resume provenance and credential internals", () => {
    const [match] = rankWorkforceGridOpportunities({
      career,
      opportunities: [opportunity({ id: "opp-safe" })],
    });

    const event = createWorkforceGridMatchEvent({
      personId: "person-1",
      match: match!,
      occurredAt: new Date("2026-09-02T12:00:00.000Z"),
    });
    const serialized = JSON.stringify(event.payload).toLowerCase();

    expect(serialized).not.toContain("sourcereference");
    expect(serialized).not.toContain("checksum");
    expect(serialized).not.toContain("credential");
    expect(serialized).not.toContain("malpractice");
    expect(serialized).not.toContain("privilege");
    expect(serialized).not.toContain("phi");
  });
});
