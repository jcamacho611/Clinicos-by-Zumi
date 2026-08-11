import type { KlinikosOrganizationType, KlinikosRoleKey } from "@/lib/identity/types";

export type KlinikosWorkspaceKey =
  | "clinic"
  | "patient"
  | "provider"
  | "grid"
  | "education"
  | "network"
  | "partner";

export type WorkspaceRoute = {
  workspace: KlinikosWorkspaceKey;
  href: string;
  reason: string;
};

const ROLE_PRIORITY: KlinikosRoleKey[] = [
  "network_admin",
  "clinic_owner",
  "administrator",
  "provider",
  "clinical_staff",
  "front_desk",
  "biller",
  "educator",
  "student",
  "contractor",
  "facility_partner",
  "service_partner",
  "patient",
  "client",
  "viewer",
];

function routeForRole(role: KlinikosRoleKey): WorkspaceRoute {
  switch (role) {
    case "network_admin":
      return { workspace: "network", href: "/network", reason: "network administration role" };
    case "clinic_owner":
    case "administrator":
    case "front_desk":
    case "biller":
    case "clinical_staff":
      return { workspace: "clinic", href: "/dashboard", reason: `${role} clinic role` };
    case "provider":
      return { workspace: "provider", href: "/provider", reason: "provider role" };
    case "educator":
    case "student":
      return { workspace: "education", href: "/edu", reason: `${role} education role` };
    case "contractor":
      return { workspace: "grid", href: "/grid/browse", reason: "independent contractor role" };
    case "facility_partner":
    case "service_partner":
      return { workspace: "partner", href: "/grid", reason: `${role} partner role` };
    case "patient":
    case "client":
      return { workspace: "patient", href: "/portal", reason: `${role} consumer role` };
    default:
      return { workspace: "clinic", href: "/dashboard", reason: "fallback workspace" };
  }
}

export function routeForIdentity(input: {
  roles: readonly KlinikosRoleKey[];
  organizationType?: KlinikosOrganizationType;
  requestedWorkspace?: KlinikosWorkspaceKey;
}): WorkspaceRoute {
  if (input.requestedWorkspace) {
    const permitted = input.roles.some((role) => routeForRole(role).workspace === input.requestedWorkspace);
    if (permitted) {
      const role = input.roles.find((candidate) => routeForRole(candidate).workspace === input.requestedWorkspace)!;
      return routeForRole(role);
    }
  }

  if (input.organizationType === "healthcare_network" && input.roles.includes("network_admin")) {
    return routeForRole("network_admin");
  }
  if (input.organizationType === "educational_institution") {
    if (input.roles.includes("educator")) return routeForRole("educator");
    if (input.roles.includes("student")) return routeForRole("student");
  }

  for (const role of ROLE_PRIORITY) {
    if (input.roles.includes(role)) return routeForRole(role);
  }

  return { workspace: "clinic", href: "/dashboard", reason: "no specialized role matched" };
}

export function workspaceChoices(roles: readonly KlinikosRoleKey[]): WorkspaceRoute[] {
  const seen = new Set<KlinikosWorkspaceKey>();
  const choices: WorkspaceRoute[] = [];
  for (const role of ROLE_PRIORITY) {
    if (!roles.includes(role)) continue;
    const route = routeForRole(role);
    if (seen.has(route.workspace)) continue;
    seen.add(route.workspace);
    choices.push(route);
  }
  return choices;
}

const INTENT_PATTERNS: Array<{ workspace: KlinikosWorkspaceKey; patterns: RegExp[]; reason: string }> = [
  {
    workspace: "grid",
    patterns: [/\bshift\b/i, /\bjob\b/i, /\bwork\b/i, /\bcontract(or|ing)?\b/i, /\broom\b/i, /\bchair\b/i, /\bspace\b/i, /\bopportunit(y|ies)\b/i],
    reason: "intent matched Grid opportunity or capacity language",
  },
  {
    workspace: "education",
    patterns: [/\bstudent\b/i, /\bclass\b/i, /\bcourse\b/i, /\blearn\b/i, /\btraining\b/i, /\beducat(or|ion)\b/i, /\bteach\b/i],
    reason: "intent matched education language",
  },
  {
    workspace: "patient",
    patterns: [/\bappointment\b/i, /\bdoctor\b/i, /\bprovider\b/i, /\bcare\b/i, /\bpatient\b/i, /\brecords?\b/i, /\bresults?\b/i],
    reason: "intent matched patient navigation language",
  },
  {
    workspace: "network",
    patterns: [/\bnetwork\b/i, /\bmultiple clinics?\b/i, /\ball locations?\b/i, /\benterprise\b/i],
    reason: "intent matched network administration language",
  },
  {
    workspace: "provider",
    patterns: [/\bmy patients?\b/i, /\bchart\b/i, /\bnote\b/i, /\bencounter\b/i, /\bclinical\b/i, /\bresults queue\b/i],
    reason: "intent matched provider workflow language",
  },
  {
    workspace: "partner",
    patterns: [/\bpartner\b/i, /\blisting\b/i, /\bfacility\b/i, /\bservice provider\b/i],
    reason: "intent matched partner language",
  },
  {
    workspace: "clinic",
    patterns: [/\bclinic\b/i, /\brevenue\b/i, /\bstaff\b/i, /\bschedule\b/i, /\bbilling\b/i, /\bclaims?\b/i, /\bfront desk\b/i, /\boperations?\b/i],
    reason: "intent matched clinic operations language",
  },
];

/**
 * Classify intent only among workspaces the authenticated identity is already allowed
 * to access. Natural language can suggest a destination; it can never grant one.
 */
export function routeIntent(intent: string, roles: readonly KlinikosRoleKey[]): WorkspaceRoute {
  const permitted = workspaceChoices(roles);
  const permittedByKey = new Map(permitted.map((choice) => [choice.workspace, choice]));

  for (const group of INTENT_PATTERNS) {
    if (!permittedByKey.has(group.workspace)) continue;
    if (group.patterns.some((pattern) => pattern.test(intent))) {
      const base = permittedByKey.get(group.workspace)!;
      return { ...base, reason: group.reason };
    }
  }

  return permitted[0] ?? routeForIdentity({ roles });
}
