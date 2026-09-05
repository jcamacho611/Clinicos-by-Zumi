import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";

export type MemberViewPresentation = {
  label: "Connections" | "Opportunities" | "Journey" | "Activity" | "Growth";
  description: string;
};

const views: Record<CanonicalPlaneId, MemberViewPresentation> = {
  healthcare_universe: {
    label: "Connections",
    description: "See the people and organizations connected to what you are trying to do.",
  },
  economic_resource: {
    label: "Opportunities",
    description: "See relevant work, services, learning, space, and other available resources.",
  },
  lifecycle: {
    label: "Journey",
    description: "See where you are now and the next useful step toward your goal.",
  },
  operating_infrastructure: {
    label: "Activity",
    description: "See the account activity and systems supporting your current next step.",
  },
  compounding_business: {
    label: "Growth",
    description: "See completed progress that can support future opportunities and outcomes.",
  },
};

const statuses: Record<string, string> = {
  person_present: "Available",
  discovery_available: "Available",
  profile_started: "In progress",
  claims_present: "In progress",
  context_claimed: "In progress",
  account_connected: "Ready",
  not_projected: "Not available yet",
};

export function memberViewForPlane(id: CanonicalPlaneId) {
  return views[id];
}

export function memberStatusLabel(status: string) {
  return statuses[status] ?? "Available";
}
