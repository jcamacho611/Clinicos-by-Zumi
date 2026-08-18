import "server-only";

import type { ClinicSession } from "@/lib/auth/types";
import type { ZumiPresence } from "@/features/zumi/presence";
import {
  exploreNavigationForRole,
  klinikosPromptForWorkspace,
  primaryNavigationForRole,
} from "@/lib/navigation-experience";

export type ZumiWorkspaceDestination = {
  label: string;
  href: string;
  description: string;
  relationship: "primary" | "related";
};

export type ZumiWorkspaceIntelligence = {
  surfaceKey: string;
  title: string;
  purpose: string;
  prompt: string;
  suggestedQuestions: string[];
  primaryDestinations: ZumiWorkspaceDestination[];
  relatedDestinations: ZumiWorkspaceDestination[];
};

type WorkspaceDefinition = {
  title: string;
  purpose: string;
  suggestions: readonly string[];
  relatedTerms: readonly string[];
};

const WORKSPACES: Record<string, WorkspaceDefinition> = {
  dashboard: {
    title: "Home",
    purpose: "Understand what matters now, what Klinikos already has under control, and the highest-value next action.",
    suggestions: [
      "What needs me right now?",
      "What is blocked and why?",
      "Where are we losing time or money?",
      "What can Klinikos help me handle next?",
    ],
    relatedTerms: ["today", "tasks", "money", "grid", "quality"],
  },
  "front-desk": {
    title: "Today",
    purpose: "Run today's clinic work with the smallest useful view of arrivals, readiness, follow-up, and unresolved operational work.",
    suggestions: [
      "What needs attention before the next appointment?",
      "Which visits are not ready?",
      "What follow-up is overdue?",
      "What can I clear quickly right now?",
    ],
    relatedTerms: ["patients", "schedule", "tasks", "follow-up", "messages"],
  },
  provider: {
    title: "Provider work",
    purpose: "Surface clinical work that needs the provider's judgment while keeping AI assistance separate from clinical authority.",
    suggestions: [
      "What needs my review today?",
      "Which results or referrals are waiting on me?",
      "What documentation is incomplete?",
      "What can be prepared for my review?",
    ],
    relatedTerms: ["patients", "care", "results", "labs", "referrals"],
  },
  patients: {
    title: "Patients",
    purpose: "Find authorized patient work and explain what requires attention without exposing more information than the user needs.",
    suggestions: [
      "Who needs attention today?",
      "Which patient work is blocked?",
      "What follow-up is overdue?",
      "What should I review next?",
    ],
    relatedTerms: ["patients", "care", "follow-up", "referrals", "documents"],
  },
  billing: {
    title: "Money",
    purpose: "Explain what revenue-cycle work needs action while keeping payment, claim, obligation, and settlement truth separate.",
    suggestions: [
      "What money needs attention?",
      "What is blocking revenue?",
      "Which items are ready for human review?",
      "Where are the best recovery opportunities?",
    ],
    relatedTerms: ["billing", "money", "claims", "payments", "follow-up", "revenue"],
  },
  crm: {
    title: "Follow-up",
    purpose: "Turn real unresolved leads, callbacks, patient follow-up, and recovery opportunities into owned next actions.",
    suggestions: [
      "What follow-up matters most?",
      "Who has been waiting too long?",
      "What revenue may be recoverable?",
      "Prepare the next follow-up action for me.",
    ],
    relatedTerms: ["follow-up", "messages", "tasks", "billing", "patients"],
  },
  grid: {
    title: "Grid",
    purpose: "Translate I NEED / I HAVE intent into eligible healthcare people, work, space, services, equipment, education capacity, and opportunities.",
    suggestions: [
      "I need someone Friday 9 to 5.",
      "I have unused capacity this week.",
      "What Grid opportunities fit us right now?",
      "What is blocking this offer or booking?",
    ],
    relatedTerms: ["grid", "offers", "bookings", "availability", "resources", "network"],
  },
  quality: {
    title: "Quality",
    purpose: "Explain evidence-backed quality work, missing evidence, human-review needs, and governed escalation without claiming blanket compliance.",
    suggestions: [
      "What quality items need review?",
      "What evidence is missing?",
      "Which items are overdue or due soon?",
      "Do we need outside expertise for anything?",
    ],
    relatedTerms: ["quality", "tasks", "patients", "referrals", "grid"],
  },
  edu: {
    title: "Learning",
    purpose: "Guide learning, simulation, competency evidence, human review, placement, and opportunity progression without implying training grants legal authority.",
    suggestions: [
      "What should I work on next?",
      "What is blocking my next step?",
      "What evidence is ready for human review?",
      "What opportunities could unlock after this?",
    ],
    relatedTerms: ["learning", "edu", "progress", "placements", "grid", "credentials"],
  },
  referrals: {
    title: "Referrals",
    purpose: "Follow referrals until the next accountable state is confirmed instead of treating creation as completion.",
    suggestions: [
      "Which referrals are stalled?",
      "What is missing for closure?",
      "Who needs follow-up?",
      "Find an appropriate network option if we are missing one.",
    ],
    relatedTerms: ["referrals", "network", "patients", "tasks", "grid"],
  },
  network: {
    title: "Network",
    purpose: "Understand relationships, handoffs, missing partners, and reachable healthcare capacity across the connected network.",
    suggestions: [
      "Where are our network gaps?",
      "What handoffs are waiting?",
      "Which relationships need attention?",
      "Find options for a missing partner.",
    ],
    relatedTerms: ["network", "referrals", "handoffs", "grid", "care"],
  },
  tasks: {
    title: "Tasks",
    purpose: "Prioritize real owned work, explain blockers, and route each item to the safest next action.",
    suggestions: [
      "What should I do first?",
      "What is overdue?",
      "What is blocked?",
      "What can Klinikos prepare for me?",
    ],
    relatedTerms: ["tasks", "today", "patients", "follow-up", "quality"],
  },
  settings: {
    title: "Settings",
    purpose: "Guide deliberate organization configuration without confusing configuration, provider verification, authorization, and production proof.",
    suggestions: [
      "What still needs configuration?",
      "Which connections are actually verified?",
      "What is safe to enable now?",
      "What settings affect this workflow?",
    ],
    relatedTerms: ["settings", "connections", "security", "legal", "payments"],
  },
  connections: {
    title: "Connections",
    purpose: "Explain external-system readiness truthfully: available, configured, provider-verified, authorized for workload, or production-proven.",
    suggestions: [
      "Which connections need action?",
      "What is configured but not verified?",
      "What still needs production proof?",
      "What can we safely activate next?",
    ],
    relatedTerms: ["connections", "integrations", "communications", "payments", "security"],
  },
  legal: {
    title: "Agreements",
    purpose: "Guide agreement and evidence workflows while keeping signatures separate from authority, access, payment, eligibility, and fulfillment truth.",
    suggestions: [
      "What agreement needs attention?",
      "What is signed versus still pending?",
      "What does this agreement actually unlock?",
      "What evidence would still be required?",
    ],
    relatedTerms: ["legal", "agreements", "security", "settings", "grid"],
  },
};

function surfaceKey(pathname: string | null | undefined) {
  const segment = (pathname ?? "").split("/").filter(Boolean)[0] ?? "dashboard";
  if (segment === "claim-readiness" || segment === "payments") return "billing";
  if (segment === "schedule") return "front-desk";
  if (segment === "encounters" || segment === "labs" || segment === "imaging") return "provider";
  if (segment === "integrations") return "connections";
  if (segment === "agreements") return "legal";
  return WORKSPACES[segment] ? segment : "dashboard";
}

function scoreDestination(label: string, description: string, relatedTerms: readonly string[]) {
  const haystack = `${label} ${description}`.toLowerCase();
  return relatedTerms.reduce((score, term) => score + (haystack.includes(term.toLowerCase()) ? 1 : 0), 0);
}

export function resolveZumiWorkspaceIntelligence(
  session: ClinicSession,
  presence: ZumiPresence,
): ZumiWorkspaceIntelligence {
  const key = surfaceKey(presence.pathname);
  const definition = WORKSPACES[key] ?? WORKSPACES.dashboard;
  const primary = primaryNavigationForRole(session.role);
  const primaryHrefs = new Set(primary.map((item) => item.href));
  const explore = exploreNavigationForRole(session.role, primaryHrefs).flatMap((group) => group.items);

  const primaryDestinations: ZumiWorkspaceDestination[] = primary.map((item) => ({
    label: item.label,
    href: item.href,
    description: `Primary ${session.role.replaceAll("_", " ")} destination`,
    relationship: "primary",
  }));

  const relatedDestinations: ZumiWorkspaceDestination[] = explore
    .map((item) => ({
      item,
      score: scoreDestination(item.label, item.description, definition.relatedTerms),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.item.label.localeCompare(right.item.label))
    .slice(0, 8)
    .map(({ item }) => ({
      label: item.label,
      href: item.href,
      description: item.description,
      relationship: "related" as const,
    }));

  return {
    surfaceKey: key,
    title: definition.title,
    purpose: definition.purpose,
    prompt: klinikosPromptForWorkspace(key),
    suggestedQuestions: [...definition.suggestions],
    primaryDestinations,
    relatedDestinations,
  };
}

export function workspaceIntelligenceInstruction(workspace: ZumiWorkspaceIntelligence) {
  return [
    `Current Klinikos workspace: ${workspace.title} (${workspace.surfaceKey}).`,
    `Workspace purpose: ${workspace.purpose}`,
    `The user's role-authorized primary destinations include: ${workspace.primaryDestinations.map((item) => `${item.label}=${item.href}`).join("; ") || "none"}.`,
    workspace.relatedDestinations.length
      ? `Relevant deeper authorized destinations include: ${workspace.relatedDestinations.map((item) => `${item.label}=${item.href}`).join("; ")}.`
      : "No deeper destination is relevant enough to surface for this turn.",
    "Use this only to understand navigation and available product surfaces. It is not proof that any record exists, any external connector is live, any payment occurred, any credential is valid, or any action has executed.",
    "Prefer answering the user's outcome directly. When a destination materially helps, name the human-facing destination and let trusted orchestration provide the governed action link.",
  ].join("\n");
}
