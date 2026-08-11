import type { KlinikosRoleKey } from "@/lib/identity/types";
import { routeForIdentity, type KlinikosWorkspaceKey, type WorkspaceRoute } from "@/lib/identity/workspace-routing";

export type IntentKind =
  | "receive_care"
  | "manage_clinic"
  | "work_as_provider"
  | "find_work"
  | "learn"
  | "teach"
  | "manage_network"
  | "offer_space_or_services"
  | "unknown";

export type IntentResolution = {
  intent: IntentKind;
  confidence: "high" | "medium" | "low";
  route: WorkspaceRoute;
  matchedTerms: string[];
};

const INTENT_RULES: Array<{
  intent: IntentKind;
  workspace: KlinikosWorkspaceKey;
  terms: string[];
}> = [
  { intent: "receive_care", workspace: "patient", terms: ["appointment", "doctor", "care", "patient", "treatment", "results", "records"] },
  { intent: "manage_clinic", workspace: "clinic", terms: ["clinic", "practice", "schedule", "billing", "patients", "staff", "revenue"] },
  { intent: "work_as_provider", workspace: "provider", terms: ["my patients", "provider", "clinical", "chart", "notes", "referrals"] },
  { intent: "find_work", workspace: "grid", terms: ["shift", "work", "contract", "opportunity", "room", "chair", "gig"] },
  { intent: "learn", workspace: "education", terms: ["student", "class", "course", "learn", "training", "school"] },
  { intent: "teach", workspace: "education", terms: ["teach", "educator", "professor", "students", "curriculum"] },
  { intent: "manage_network", workspace: "network", terms: ["network", "multiple clinics", "locations", "enterprise", "portfolio"] },
  { intent: "offer_space_or_services", workspace: "partner", terms: ["rent room", "rent chair", "facility", "partner", "service provider", "offer space"] },
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function classifyIntent(message: string): { intent: IntentKind; workspace?: KlinikosWorkspaceKey; matchedTerms: string[] } {
  const normalized = normalize(message);
  let best: { intent: IntentKind; workspace?: KlinikosWorkspaceKey; matchedTerms: string[] } = { intent: "unknown", matchedTerms: [] };
  for (const rule of INTENT_RULES) {
    const matchedTerms = rule.terms.filter((term) => normalized.includes(term));
    if (matchedTerms.length > best.matchedTerms.length) {
      best = { intent: rule.intent, workspace: rule.workspace, matchedTerms };
    }
  }
  return best;
}

export function resolveIntent(input: { message: string; roles: readonly KlinikosRoleKey[] }): IntentResolution {
  const classified = classifyIntent(input.message);
  const requestedWorkspace = classified.workspace;
  const route = routeForIdentity({ roles: input.roles, requestedWorkspace });
  const exactWorkspaceAllowed = requestedWorkspace ? route.workspace === requestedWorkspace : false;

  return {
    intent: exactWorkspaceAllowed ? classified.intent : "unknown",
    confidence: classified.matchedTerms.length >= 2 && exactWorkspaceAllowed ? "high" : classified.matchedTerms.length === 1 && exactWorkspaceAllowed ? "medium" : "low",
    route,
    matchedTerms: classified.matchedTerms,
  };
}
