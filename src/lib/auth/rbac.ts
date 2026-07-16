import { z } from "zod";

export const clinicRoleSchema = z.enum([
  "clinic_owner",
  "administrator",
  "provider",
  "clinical_staff",
  "front_desk",
  "biller",
  "quality",
  "case_manager",
  "viewer",
]);

export type ClinicRole = z.infer<typeof clinicRoleSchema>;
export type ClinicResource = "patients" | "appointments" | "encounters" | "billing" | "settings" | "users" | "registry" | "network" | "identity" | "consents" | "referrals" | "labs" | "imaging" | "medications" | "documents" | "forms" | "voice" | "tasks" | "escalations" | "messages" | "knowledge" | "remote_monitoring";
export type ClinicAction = "read" | "create" | "update" | "sign" | "manage";

const permissions: Record<ClinicRole, Partial<Record<ClinicResource, ClinicAction[]>>> = {
  clinic_owner: {
    patients: ["read", "create", "update"], appointments: ["read", "create", "update"], encounters: ["read", "create", "update", "sign"],
    billing: ["read", "create", "update"], settings: ["read", "update", "manage"], users: ["read", "create", "update", "manage"], tasks: ["read", "create", "update", "manage"], escalations: ["read", "create", "update", "manage"], messages: ["read", "create", "update", "manage"],
    registry: ["read", "manage"], knowledge: ["read", "create", "update", "manage"], remote_monitoring: ["read", "create", "update", "manage"], network: ["read", "create", "update", "manage"], identity: ["read", "create", "update", "manage"], consents: ["read", "create", "update", "manage"], referrals: ["read", "create", "update", "manage"], labs: ["read", "create", "update", "sign", "manage"], imaging: ["read", "create", "update", "sign", "manage"], medications: ["read", "create", "update", "sign", "manage"], documents: ["read", "create", "update", "sign", "manage"], forms: ["read", "create", "update", "sign", "manage"], voice: ["read", "create", "update", "manage"],
  },
  administrator: {
    patients: ["read", "create", "update"], appointments: ["read", "create", "update"], encounters: ["read", "create", "update"],
    billing: ["read", "create", "update"], settings: ["read", "update"], users: ["read", "create", "update"],
    registry: ["read"], knowledge: ["read", "create", "update", "manage"], remote_monitoring: ["read", "create", "update", "manage"], network: ["read", "create", "update"], identity: ["read", "create", "update"], consents: ["read", "create", "update"], referrals: ["read", "create", "update"], labs: ["read", "create", "update"], imaging: ["read", "create", "update"], medications: ["read", "create", "update", "manage"], documents: ["read", "create", "update", "manage"], forms: ["read", "create", "update", "manage"], voice: ["read", "create", "update"], tasks: ["read", "create", "update"], escalations: ["read", "create", "update"], messages: ["read", "create", "update"],
  },
  provider: { patients: ["read", "update"], appointments: ["read", "update"], encounters: ["read", "create", "update", "sign"], billing: ["read"], registry: ["read"], knowledge: ["read", "create", "update"], remote_monitoring: ["read", "create", "update"], network: ["read", "create"], identity: ["read", "update"], consents: ["read"], referrals: ["read", "create", "update"], labs: ["read", "create", "update", "sign"], imaging: ["read", "create", "update", "sign"], medications: ["read", "create", "update", "sign", "manage"], documents: ["read", "create", "update", "sign", "manage"], forms: ["read", "create", "update", "sign", "manage"], voice: ["read", "create", "update"], tasks: ["read", "create", "update"], escalations: ["read", "create", "update"], messages: ["read", "create", "update"] },
  clinical_staff: { patients: ["read", "update"], appointments: ["read", "update"], encounters: ["read", "create", "update"], registry: ["read"], knowledge: ["read"], remote_monitoring: ["read", "create", "update"], network: ["read"], identity: ["read"], consents: ["read", "create"], referrals: ["read", "create", "update"], labs: ["read", "create", "update"], imaging: ["read", "create", "update"], medications: ["read", "create", "update"], documents: ["read", "create", "update"], forms: ["read", "create", "update"], voice: ["read", "create", "update"], tasks: ["read", "create", "update"], escalations: ["read", "create", "update"], messages: ["read", "create", "update"] },
  front_desk: { patients: ["read", "create", "update"], appointments: ["read", "create", "update"], encounters: ["read"], billing: ["read"], registry: ["read"], knowledge: ["read"], remote_monitoring: ["read", "create"], network: ["read"], identity: ["read", "create", "update"], consents: ["read", "create", "update"], referrals: ["read", "update"], labs: ["read", "create", "update"], imaging: ["read", "create", "update"], medications: ["read", "create", "update"], documents: ["read", "create", "update"], forms: ["read", "create", "update"], voice: ["read", "create", "update"], tasks: ["read", "create", "update"], escalations: ["read", "create", "update"], messages: ["read", "create", "update"] },
  biller: { patients: ["read"], appointments: ["read"], encounters: ["read"], billing: ["read", "create", "update"], registry: ["read"], knowledge: ["read"], remote_monitoring: ["read"], network: ["read"], identity: ["read"], consents: ["read"], referrals: ["read"], labs: ["read"], imaging: ["read"], medications: ["read"], documents: ["read", "create", "update"], forms: ["read"], voice: ["read", "create"], tasks: ["read", "create", "update"], escalations: ["read"], messages: ["read", "create", "update"] },
  quality: { patients: ["read"], appointments: ["read"], encounters: ["read"], billing: ["read"], registry: ["read"], knowledge: ["read"], remote_monitoring: ["read"], network: ["read"], identity: ["read"], consents: ["read"], referrals: ["read"], labs: ["read"], imaging: ["read"], medications: ["read"], documents: ["read"], forms: ["read"], voice: ["read", "create"], tasks: ["read", "create", "update"], escalations: ["read"], messages: ["read", "create", "update"] },
  case_manager: { patients: ["read", "update"], appointments: ["read"], encounters: ["read"], registry: ["read"], knowledge: ["read"], remote_monitoring: ["read", "create", "update"], network: ["read", "create", "update"], identity: ["read", "update"], consents: ["read", "create", "update"], referrals: ["read", "create", "update"], labs: ["read", "create", "update"], imaging: ["read", "create", "update"], medications: ["read", "create", "update"], documents: ["read", "create", "update", "manage"], forms: ["read", "create", "update", "manage"], voice: ["read", "create", "update"], tasks: ["read", "create", "update"], escalations: ["read", "create", "update"], messages: ["read", "create", "update"] },
  viewer: { patients: ["read"], appointments: ["read"], encounters: ["read"], billing: ["read"], registry: ["read"], knowledge: ["read"], remote_monitoring: ["read"], labs: ["read"], imaging: ["read"], medications: ["read"], documents: ["read"], forms: ["read"], tasks: ["read"], escalations: ["read"], messages: ["read"] },
};

export function normalizeClinicRole(value: string): ClinicRole {
  return clinicRoleSchema.safeParse(value).data ?? "viewer";
}

export function can(role: ClinicRole, resource: ClinicResource, action: ClinicAction) {
  return permissions[role][resource]?.includes(action) ?? false;
}

export function roleLabel(role: ClinicRole) {
  return role.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}
