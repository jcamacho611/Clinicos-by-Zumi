import { can, type ClinicAction, type ClinicResource, type ClinicRole } from "@/lib/auth/rbac";

type Requirement = readonly [ClinicResource, ClinicAction];

interface WorkspaceRule {
  all?: readonly Requirement[];
  any?: readonly Requirement[];
}

export const workspaceAccessRules: Readonly<Record<string, WorkspaceRule>> = {
  dashboard: { any: [["patients", "read"], ["appointments", "read"], ["encounters", "read"], ["sales", "read"], ["reliability", "read"], ["network", "read"]] },
  "front-desk": { all: [["patients", "read"], ["appointments", "read"]] },
  provider: { all: [["patients", "read"], ["encounters", "read"]] },
  patients: { all: [["patients", "read"]] },
  schedule: { all: [["appointments", "read"]] },
  encounters: { all: [["encounters", "read"]] },
  telemedicine: { all: [["telemedicine", "read"]] },
  labs: { all: [["labs", "read"]] },
  imaging: { all: [["imaging", "read"]] },
  medications: { all: [["medications", "read"]] },
  documents: { all: [["documents", "read"]] },
  forms: { all: [["forms", "read"]] },
  knowledge: { all: [["knowledge", "read"]] },
  "remote-monitoring": { all: [["remote_monitoring", "read"]] },
  inventory: { all: [["inventory", "read"]] },
  grid: { any: [["grid", "read"], ["network", "read"], ["credentialing", "read"]] },
  network: { all: [["network", "read"]] },
  referrals: { all: [["referrals", "read"]] },
  "access-controls": { all: [["network", "read"]] },
  "identity-resolution": { all: [["identity", "read"]] },
  "care-teams": { all: [["care_teams", "read"]] },
  "capacity-exchange": { all: [["appointments", "read"]] },
  "provider-network": { any: [["tasks", "read"], ["credentialing", "read"]] },
  "injury-episodes": { all: [["cases", "read"]] },
  "health-passport": { all: [["identity", "read"]] },
  "intake-passport": { all: [["consents", "read"]] },
  billing: { all: [["billing", "read"]] },
  "claim-readiness": { all: [["coding", "read"]] },
  "luxe-medi": { all: [["luxe_medi", "read"]] },
  insurance: { all: [["insurance", "read"]] },
  cases: { all: [["cases", "read"]] },
  quality: { all: [["quality", "read"]] },
  crm: { all: [["crm", "read"]] },
  "admin/sales": { all: [["sales", "read"]] },
  "owner/founding-program": { all: [["sales", "read"]] },
  messages: { all: [["messages", "read"]] },
  tasks: { all: [["tasks", "read"]] },
  escalations: { all: [["escalations", "read"]] },
  "ai-assistants": { all: [["ai", "read"]] },
  "patient-navigation": { all: [["tasks", "read"]] },
  "voice-assistant": { all: [["voice", "read"]] },
  "portal-admin": { all: [["portal", "read"]] },
  integrations: { all: [["integrations", "read"]] },
  settings: { all: [["settings", "read"]] },
  "system-health": { all: [["reliability", "read"]] },
  "feature-registry": { all: [["registry", "read"]] },
};

export function canAccessWorkspace(role: ClinicRole, workspace: string) {
  const rule = workspaceAccessRules[workspace];
  if (!rule) return false;
  const allAllowed = (rule.all ?? []).every(([resource, action]) => can(role, resource, action));
  const anyAllowed = !rule.any?.length || rule.any.some(([resource, action]) => can(role, resource, action));
  return allAllowed && anyAllowed;
}
