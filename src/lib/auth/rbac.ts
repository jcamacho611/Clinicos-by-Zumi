import { z } from "zod";

export const clinicRoles = [
  "clinic_owner",
  "administrator",
  "provider",
  "clinical_staff",
  "front_desk",
  "biller",
  "quality",
  "case_manager",
  "contractor",
  "viewer",
] as const;

export const clinicRoleSchema = z.enum(clinicRoles);

export type ClinicRole = z.infer<typeof clinicRoleSchema>;
export const clinicResources = [
  "patients", "appointments", "encounters", "billing", "coding", "luxe_medi", "sales", "settings", "users", "registry", "network", "grid", "identity", "consents", "referrals", "labs", "imaging", "medications", "documents", "forms", "voice", "tasks", "escalations", "messages", "knowledge", "remote_monitoring", "inventory", "credentialing", "crm", "reliability", "care_teams", "cases", "quality", "insurance", "telemedicine", "portal", "integrations", "ai",
] as const;
export const clinicActions = ["read", "create", "update", "sign", "manage"] as const;
export type ClinicResource = (typeof clinicResources)[number];
export type ClinicAction = (typeof clinicActions)[number];

const permissions: Record<ClinicRole, Partial<Record<ClinicResource, ClinicAction[]>>> = {
  clinic_owner: {
    patients: ["read", "create", "update"], appointments: ["read", "create", "update"], encounters: ["read", "create", "update", "sign"],
    billing: ["read", "create", "update"], settings: ["read", "update", "manage"], users: ["read", "create", "update", "manage"], tasks: ["read", "create", "update", "manage"], escalations: ["read", "create", "update", "manage"], messages: ["read", "create", "update", "manage"],
    registry: ["read", "manage"], knowledge: ["read", "create", "update", "manage"], remote_monitoring: ["read", "create", "update", "manage"], inventory: ["read", "create", "update", "manage"], credentialing: ["read", "create", "update", "manage"], crm: ["read", "create", "update", "manage"], sales: ["read", "create", "update", "manage"], reliability: ["read", "create", "update", "manage"], network: ["read", "create", "update", "manage"], grid: ["read", "create", "update", "manage"], identity: ["read", "create", "update", "manage"], consents: ["read", "create", "update", "manage"], referrals: ["read", "create", "update", "manage"], labs: ["read", "create", "update", "sign", "manage"], imaging: ["read", "create", "update", "sign", "manage"], medications: ["read", "create", "update", "sign", "manage"], documents: ["read", "create", "update", "sign", "manage"], forms: ["read", "create", "update", "sign", "manage"], voice: ["read", "create", "update", "manage"], cases: ["read", "create", "update", "manage"], quality: ["read", "create", "update", "manage"], insurance: ["read", "create", "update", "manage"], telemedicine: ["read", "create", "update", "manage"], portal: ["read", "create", "update", "manage"], integrations: ["read", "create", "update", "manage"], ai: ["read", "create", "update", "manage"],
  },
  administrator: {
    patients: ["read", "create", "update"], appointments: ["read", "create", "update"], encounters: ["read", "create", "update"],
    billing: ["read", "create", "update"], settings: ["read", "update"], users: ["read", "create", "update"],
    registry: ["read"], knowledge: ["read", "create", "update", "manage"], remote_monitoring: ["read", "create", "update", "manage"], inventory: ["read", "create", "update", "manage"], credentialing: ["read", "create", "update", "manage"], crm: ["read", "create", "update", "manage"], sales: ["read", "create", "update", "manage"], reliability: ["read", "create", "update", "manage"], network: ["read", "create", "update"], grid: ["read", "create", "update", "manage"], identity: ["read", "create", "update"], consents: ["read", "create", "update"], referrals: ["read", "create", "update"], labs: ["read", "create", "update"], imaging: ["read", "create", "update"], medications: ["read", "create", "update", "manage"], documents: ["read", "create", "update", "manage"], forms: ["read", "create", "update", "manage"], voice: ["read", "create", "update"], tasks: ["read", "create", "update"], escalations: ["read", "create", "update"], messages: ["read", "create", "update"], cases: ["read", "create", "update", "manage"], quality: ["read", "create", "update", "manage"], insurance: ["read", "create", "update", "manage"], telemedicine: ["read", "create", "update", "manage"], portal: ["read", "create", "update", "manage"], integrations: ["read", "create", "update"], ai: ["read", "create", "update", "manage"],
  },
  provider: { patients: ["read", "update"], appointments: ["read", "update"], encounters: ["read", "create", "update", "sign"], billing: ["read"], registry: ["read"], knowledge: ["read", "create", "update"], remote_monitoring: ["read", "create", "update"], inventory: ["read"], credentialing: ["read", "update"], crm: ["read", "create", "update"], network: ["read", "create", "update"], grid: ["read", "update"], identity: ["read", "update"], consents: ["read"], referrals: ["read", "create", "update"], labs: ["read", "create", "update", "sign"], imaging: ["read", "create", "update", "sign"], medications: ["read", "create", "update", "sign", "manage"], documents: ["read", "create", "update", "sign", "manage"], forms: ["read", "create", "update", "sign", "manage"], voice: ["read", "create", "update"], tasks: ["read", "create", "update"], escalations: ["read", "create", "update"], messages: ["read", "create", "update"], cases: ["read", "create", "update"], quality: ["read", "update"], insurance: ["read"], telemedicine: ["read", "create", "update"], portal: ["read"], ai: ["read", "create", "update"] },
  clinical_staff: { patients: ["read", "update"], appointments: ["read", "update"], encounters: ["read", "create", "update"], registry: ["read"], knowledge: ["read"], remote_monitoring: ["read", "create", "update"], inventory: ["read", "create", "update"], credentialing: ["read"], crm: ["read", "create", "update"], network: ["read", "create", "update"], identity: ["read"], consents: ["read", "create"], referrals: ["read", "create", "update"], labs: ["read", "create", "update"], imaging: ["read", "create", "update"], medications: ["read", "create", "update"], documents: ["read", "create", "update"], forms: ["read", "create", "update"], voice: ["read", "create", "update"], tasks: ["read", "create", "update"], escalations: ["read", "create", "update"], messages: ["read", "create", "update"], cases: ["read", "create", "update"], quality: ["read"], insurance: ["read", "update"], telemedicine: ["read", "create", "update"], portal: ["read", "update"], ai: ["read", "create", "update"] },
  front_desk: { patients: ["read", "create", "update"], appointments: ["read", "create", "update"], encounters: ["read"], billing: ["read"], registry: ["read"], knowledge: ["read"], remote_monitoring: ["read", "create"], inventory: ["read"], credentialing: ["read"], crm: ["read", "create", "update"], network: ["read", "create", "update"], identity: ["read", "create", "update"], consents: ["read", "create", "update"], referrals: ["read", "update"], labs: ["read", "create", "update"], imaging: ["read", "create", "update"], medications: ["read", "create", "update"], documents: ["read", "create", "update"], forms: ["read", "create", "update"], voice: ["read", "create", "update"], tasks: ["read", "create", "update"], escalations: ["read", "create", "update"], messages: ["read", "create", "update"], cases: ["read"], insurance: ["read", "create", "update"], telemedicine: ["read", "update"], portal: ["read", "create", "update"], ai: ["read", "create"] },
  biller: { patients: ["read"], appointments: ["read"], encounters: ["read"], billing: ["read", "create", "update"], registry: ["read"], knowledge: ["read"], remote_monitoring: ["read"], inventory: ["read"], credentialing: ["read"], crm: ["read", "update"], network: ["read"], identity: ["read"], consents: ["read"], referrals: ["read"], labs: ["read"], imaging: ["read"], medications: ["read"], documents: ["read", "create", "update"], forms: ["read"], voice: ["read", "create"], tasks: ["read", "create", "update"], escalations: ["read"], messages: ["read", "create", "update"], cases: ["read", "create", "update"], insurance: ["read", "create", "update"], telemedicine: ["read"], portal: ["read"], ai: ["read"] },
  quality: { patients: ["read"], appointments: ["read"], encounters: ["read"], billing: ["read"], registry: ["read"], knowledge: ["read"], remote_monitoring: ["read"], inventory: ["read"], credentialing: ["read"], crm: ["read"], network: ["read"], identity: ["read"], consents: ["read"], referrals: ["read"], labs: ["read"], imaging: ["read"], medications: ["read"], documents: ["read"], forms: ["read"], voice: ["read", "create"], tasks: ["read", "create", "update"], escalations: ["read"], messages: ["read", "create", "update"], cases: ["read"], quality: ["read", "create", "update", "manage"], insurance: ["read"], telemedicine: ["read"], portal: ["read"], ai: ["read", "create"] },
  case_manager: { patients: ["read", "update"], appointments: ["read"], encounters: ["read"], registry: ["read"], knowledge: ["read"], remote_monitoring: ["read", "create", "update"], inventory: ["read", "create", "update"], credentialing: ["read"], crm: ["read", "create", "update"], network: ["read", "create", "update"], identity: ["read", "update"], consents: ["read", "create", "update"], referrals: ["read", "create", "update"], labs: ["read", "create", "update"], imaging: ["read", "create", "update"], medications: ["read", "create", "update"], documents: ["read", "create", "update", "manage"], forms: ["read", "create", "update", "manage"], voice: ["read", "create", "update"], tasks: ["read", "create", "update"], escalations: ["read", "create", "update"], messages: ["read", "create", "update"], cases: ["read", "create", "update", "manage"], quality: ["read"], insurance: ["read", "create", "update"], telemedicine: ["read"], portal: ["read", "update"], ai: ["read", "create", "update"] },
  // A GRID contractor's pass buys the ability to list services, availability, and
  // capacity — all `create` on `grid`. Deliberately nothing else: `network` is the
  // clinical care-network workspace (grants, break-glass, shared patients), and a
  // marketplace participant has no business there.
  contractor: { grid: ["read", "create", "update"] },
  viewer: { patients: ["read"], appointments: ["read"], encounters: ["read"], billing: ["read"], registry: ["read"], knowledge: ["read"], remote_monitoring: ["read"], inventory: ["read"], credentialing: ["read"], crm: ["read"], labs: ["read"], imaging: ["read"], medications: ["read"], documents: ["read"], forms: ["read"], tasks: ["read"], escalations: ["read"], messages: ["read"], cases: ["read"], quality: ["read"], insurance: ["read"], telemedicine: ["read"], portal: ["read"], integrations: ["read"], ai: ["read"] },
};

const careTeamPermissions: Record<ClinicRole, ClinicAction[]> = {
  clinic_owner: ["read", "create", "update", "manage"],
  administrator: ["read", "create", "update", "manage"],
  provider: ["read", "create", "update"],
  clinical_staff: ["read", "create", "update"],
  front_desk: [],
  biller: [],
  quality: ["read"],
  case_manager: ["read", "create", "update", "manage"],
  contractor: [],
  viewer: ["read"],
};

const codingPermissions: Record<ClinicRole, ClinicAction[]> = {
  clinic_owner: ["read", "create", "update", "manage"],
  administrator: ["read", "create", "update", "manage"],
  provider: ["read", "update"],
  clinical_staff: ["read"],
  front_desk: [],
  biller: ["read", "create", "update"],
  quality: ["read"],
  case_manager: ["read"],
  contractor: [],
  viewer: ["read"],
};

const luxeMediPermissions: Record<ClinicRole, ClinicAction[]> = {
  clinic_owner: ["read", "create", "update", "manage"],
  administrator: ["read", "create", "update", "manage"],
  provider: ["read", "create", "update"],
  clinical_staff: ["read", "create", "update"],
  front_desk: ["read", "create", "update"],
  biller: ["read"],
  quality: ["read"],
  case_manager: ["read"],
  contractor: [],
  viewer: ["read"],
};

export function normalizeClinicRole(value: string): ClinicRole {
  return clinicRoleSchema.safeParse(value).data ?? "viewer";
}

export function can(role: ClinicRole, resource: ClinicResource, action: ClinicAction) {
  if (resource === "care_teams") return careTeamPermissions[role].includes(action);
  if (resource === "coding") return codingPermissions[role].includes(action);
  if (resource === "luxe_medi") return luxeMediPermissions[role].includes(action);
  return permissions[role][resource]?.includes(action) ?? false;
}

export function roleLabel(role: ClinicRole) {
  return role.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}
