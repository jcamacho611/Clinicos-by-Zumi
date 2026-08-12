export type TrustedPathEventRule = {
  pathId: string;
  nodeId: string;
};

export const trustedPathEventRules: Readonly<Record<string, readonly TrustedPathEventRule[]>> = {
  "grid.demand.created": [{ pathId: "fill-staffing-need", nodeId: "need" }],
  "grid.offer.sent": [{ pathId: "fill-staffing-need", nodeId: "matches" }],
  "grid.reservation.created": [{ pathId: "fill-staffing-need", nodeId: "availability" }],
  "grid.fulfillment.fulfilled": [
    { pathId: "fill-staffing-need", nodeId: "confirm" },
    { pathId: "find-extra-work", nodeId: "transaction" },
  ],
  "grid.availability.updated": [{ pathId: "find-extra-work", nodeId: "availability" }],
  "grid.offer.accepted": [
    { pathId: "find-extra-work", nodeId: "matches" },
    { pathId: "become-grid-ready", nodeId: "grid" },
  ],
  "provider.credentials.reviewed": [
    { pathId: "find-extra-work", nodeId: "credentials" },
    { pathId: "become-grid-ready", nodeId: "readiness" },
  ],
  "edu.learning.completed": [{ pathId: "become-grid-ready", nodeId: "learning" }],
  "edu.competency.approved": [{ pathId: "become-grid-ready", nodeId: "competency" }],
  "referral.reviewed": [{ pathId: "fix-referral-leakage", nodeId: "diagnose" }],
  "task.assigned": [{ pathId: "fix-referral-leakage", nodeId: "ownership" }],
  "patient.followup.completed": [{ pathId: "fix-referral-leakage", nodeId: "followup" }],
  "network.destination.confirmed": [{ pathId: "fix-referral-leakage", nodeId: "network" }],
  "referral.closed": [{ pathId: "fix-referral-leakage", nodeId: "closure" }],
};

export function listTrustedPathEventRules() {
  return Object.entries(trustedPathEventRules).flatMap(([eventType, rules]) =>
    rules.map((rule) => ({ eventType, ...rule })),
  );
}

export function trustedRulesForEvent(eventType: string) {
  return trustedPathEventRules[eventType] ?? [];
}
