export type GridVisibility = "public" | "network_only" | "organization_only" | "invite_only" | "match_only" | "private";

export type GridNeed = {
  id: string;
  requesterId: string;
  organizationId?: string | null;
  needType: string;
  title: string;
  requiredSlotKeys: string[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  location?: string | null;
  jurisdiction?: string | null;
  budgetCents?: number | null;
  urgency: "routine" | "soon" | "urgent";
  visibility: GridVisibility;
  requirements: string[];
  status: "draft" | "open" | "matching" | "filled" | "expired" | "cancelled" | "failed";
};

export type GridSupply = {
  id: string;
  ownerId: string;
  organizationId?: string | null;
  resourceType: string;
  title: string;
  capabilityKeys: string[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  location?: string | null;
  jurisdiction?: string | null;
  priceCents?: number | null;
  visibility: GridVisibility;
  policyClass?: string | null;
  status: "draft" | "pending_review" | "active" | "paused" | "reserved" | "booked" | "unavailable" | "expired" | "suspended" | "removed";
};

export function canDiscoverSupply(input: {
  need: GridNeed;
  supply: GridSupply;
  requesterOrganizationIds: readonly string[];
}) {
  const { need, supply, requesterOrganizationIds } = input;
  if (need.status !== "open" && need.status !== "matching") return false;
  if (supply.status !== "active") return false;

  if (supply.visibility === "private") return supply.ownerId === need.requesterId;
  if (supply.visibility === "organization_only") {
    return Boolean(supply.organizationId && requesterOrganizationIds.includes(supply.organizationId));
  }
  if (supply.visibility === "invite_only" || supply.visibility === "match_only") return false;

  if (need.jurisdiction && supply.jurisdiction && need.jurisdiction !== supply.jurisdiction) return false;
  if (need.startsAt && need.endsAt && supply.startsAt && supply.endsAt) {
    if (supply.endsAt <= need.startsAt || supply.startsAt >= need.endsAt) return false;
  }

  return true;
}

export function needFromIntent(input: {
  id: string;
  requesterId: string;
  organizationId?: string | null;
  goal: string;
  candidatePathId?: string | null;
  timing?: string | null;
  location?: string | null;
}): GridNeed | null {
  const goal = input.goal.toLowerCase();

  if (input.candidatePathId === "fill-staffing-need" || /need|cover|staff|shift|injector|nurse|provider/.test(goal)) {
    return {
      id: input.id,
      requesterId: input.requesterId,
      organizationId: input.organizationId ?? null,
      needType: "staffing",
      title: input.goal.trim() || "Staffing need",
      requiredSlotKeys: ["professional", "shift", "organization"],
      location: input.location ?? null,
      urgency: /today|tomorrow|urgent|asap/.test(goal) ? "urgent" : input.timing ? "soon" : "routine",
      visibility: "network_only",
      requirements: [],
      status: "open",
    };
  }

  if (/room|chair|space|capacity/.test(goal)) {
    return {
      id: input.id,
      requesterId: input.requesterId,
      organizationId: input.organizationId ?? null,
      needType: "space",
      title: input.goal.trim() || "Space need",
      requiredSlotKeys: ["location", "appointment-window"],
      location: input.location ?? null,
      urgency: input.timing ? "soon" : "routine",
      visibility: "network_only",
      requirements: [],
      status: "open",
    };
  }

  return null;
}
