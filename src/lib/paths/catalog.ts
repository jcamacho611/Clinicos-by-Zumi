import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";

export type KlinikosPathNodeState = "complete" | "current" | "upcoming" | "blocked";

export type KlinikosPathNode = {
  id: string;
  label: string;
  description: string;
  href?: string;
  capabilityKey?: string;
  state: KlinikosPathNodeState;
};

export type KlinikosPathDefinition = {
  id: string;
  title: string;
  summary: string;
  audience: "professional" | "learner" | "clinic" | "operations" | "patient";
  intentExamples: string[];
  nodes: KlinikosPathNode[];
};

export const klinikosPathCatalog: KlinikosPathDefinition[] = [
  {
    id: "find-extra-work",
    title: "Find extra healthcare work",
    summary: "Move from professional readiness to availability, matching, and Grid opportunity.",
    audience: "professional",
    intentExamples: ["I want extra work Friday", "Find me weekend healthcare work", "I want to pick up shifts"],
    nodes: [
      { id: "profile", label: "Professional profile", description: "Confirm the professional context Klinikos already knows.", href: "/provider", state: "complete" },
      { id: "credentials", label: "Credential readiness", description: "Review the credentials and requirements that affect eligibility.", href: "/provider-network", capabilityKey: "network.provider.review", state: "current" },
      { id: "availability", label: "Availability", description: "Set when you are open to work.", href: "/grid/availability", capabilityKey: "grid.availability.manage", state: "upcoming" },
      { id: "matches", label: "Grid matches", description: "See opportunities that fit your profile and availability.", href: "/grid/providers", capabilityKey: "grid.match.review", state: "upcoming" },
      { id: "transaction", label: "Work and payment", description: "Track accepted work through completion and transaction state.", href: "/grid/transactions", capabilityKey: "grid.transaction.manage", state: "upcoming" },
    ],
  },
  {
    id: "become-grid-ready",
    title: "Become Grid-ready",
    summary: "Connect learning, competency, professional readiness, and Grid eligibility in one journey.",
    audience: "learner",
    intentExamples: ["I want to become an injector", "Help me qualify for Grid opportunities", "What do I need to learn next"],
    nodes: [
      { id: "goal", label: "Goal", description: "Define the professional capability you want to build.", href: "/edu", capabilityKey: "edu.learning.open", state: "complete" },
      { id: "learning", label: "Learning pathway", description: "Find the relevant Klinikos EDU courses and scenarios.", href: "/edu/courses", capabilityKey: "edu.learning.open", state: "current" },
      { id: "competency", label: "Competency", description: "Track demonstrated skills and remaining milestones.", href: "/edu/competencies", capabilityKey: "edu.competency.review", state: "upcoming" },
      { id: "readiness", label: "Professional readiness", description: "Review requirements that affect Grid eligibility.", href: "/provider-network", capabilityKey: "network.provider.review", state: "upcoming" },
      { id: "grid", label: "Grid opportunities", description: "Move into the healthcare network when requirements are satisfied.", href: "/grid/workspace", capabilityKey: "grid.match.review", state: "upcoming" },
    ],
  },
  {
    id: "fill-staffing-need",
    title: "Fill an open staffing need",
    summary: "Turn a clinic staffing gap into qualified Grid matches and a confirmed work flow.",
    audience: "clinic",
    intentExamples: ["I need an injector Saturday", "Find coverage for Friday", "I need a nurse this weekend"],
    nodes: [
      { id: "need", label: "Define the need", description: "Capture role, timing, location, and requirements.", href: "/grid/requests", capabilityKey: "grid.request.create", state: "current" },
      { id: "matches", label: "Qualified matches", description: "Review professionals and capacity that fit the need.", href: "/grid/providers", capabilityKey: "grid.match.review", state: "upcoming" },
      { id: "availability", label: "Availability", description: "Confirm that the selected match can cover the requested window.", href: "/grid/availability", capabilityKey: "grid.availability.manage", state: "upcoming" },
      { id: "confirm", label: "Confirm", description: "Move the selected match into the current transaction or handoff flow.", href: "/grid/transactions", capabilityKey: "grid.transaction.manage", state: "upcoming" },
    ],
  },
  {
    id: "fix-referral-leakage",
    title: "Fix referral leakage",
    summary: "Find broken referral loops, assign ownership, follow patients, and close the care gap.",
    audience: "operations",
    intentExamples: ["We're losing patients after referrals", "Show me stuck referrals", "Find referral gaps"],
    nodes: [
      { id: "diagnose", label: "Find open loops", description: "Review referral activity that still needs closure.", href: "/referrals", capabilityKey: "care.referral.manage", state: "current" },
      { id: "ownership", label: "Assign ownership", description: "Move unresolved work into a clear owner queue.", href: "/tasks", capabilityKey: "work.task.manage", state: "upcoming" },
      { id: "followup", label: "Patient follow-up", description: "Coordinate outreach and next actions.", href: "/patient-navigation", capabilityKey: "care.patient.navigate", state: "upcoming" },
      { id: "network", label: "Network resolution", description: "Use the care network when capacity or destination is the blocker.", href: "/network", capabilityKey: "network.provider.review", state: "upcoming" },
      { id: "closure", label: "Close the loop", description: "Return to referral state and confirm the care loop is resolved.", href: "/referrals", capabilityKey: "care.referral.manage", state: "upcoming" },
    ],
  },
];

export function getKlinikosPath(pathId: string) {
  return klinikosPathCatalog.find((path) => path.id === pathId);
}

export function findKlinikosPathFromIntent(input: string) {
  const result = resolveIntentDeterministically(input);
  const pathId = result.candidatePathIds[0];
  return pathId ? getKlinikosPath(pathId) ?? null : null;
}
