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
