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
export type ClinicResource = "patients" | "appointments" | "encounters" | "billing" | "settings" | "users" | "registry" | "network" | "identity" | "consents" | "referrals" | "labs" | "imaging" | "documents" | "voice";
export type ClinicAction = "read" | "create" | "update" | "sign" | "manage";

const permissions: Record<ClinicRole, Partial<Record<ClinicResource, ClinicAction[]>>> = {
  clinic_owner: {
    patients: ["read", "create", "update"], appointments: ["read", "create", "update"], encounters: ["read", "create", "update", "sign"],
    billing: ["read", "create", "update"], settings: ["read", "update", "manage"], users: ["read", "create", "update", "manage"],
    registry: ["read", "manage"], network: ["read", "create", "update", "manage"], identity: ["read", "create", "update", "manage"], consents: ["read", "create", "update", "manage"], referrals: ["read", "create", "update", "manage"], labs: ["read", "create", "update", "sign", "manage"], imaging: ["read", "create", "update", "sign", "manage"], documents: ["read", "create", "update", "sign", "manage"], voice: ["read", "create", "update", "manage"],
  },
  administrator: {
    patients: ["read", "create", "update"], appointments: ["read", "create", "update"], encounters: ["read", "create", "update"],
    billing: ["read", "create", "update"], settings: ["read", "update"], users: ["read", "create", "update"],
    registry: ["read"], network: ["read", "create", "update"], identity: ["read", "create", "update"], consents: ["read", "create", "update"], referrals: ["read", "create", "update"], labs: ["read", "create", "update"], imaging: ["read", "create", "update"], documents: ["read", "create", "update", "manage"], voice: ["read", "create", "update"],
  },
  provider: { patients: ["read", "update"], appointments: ["read", "update"], encounters: ["read", "create", "update", "sign"], billing: ["read"], registry: ["read"], network: ["read", "create"], identity: ["read", "update"], consents: ["read"], referrals: ["read", "create", "update"], labs: ["read", "create", "update", "sign"], imaging: ["read", "create", "update", "sign"], documents: ["read", "create", "update", "sign", "manage"], voice: ["read", "create", "update"] },
  clinical_staff: { patients: ["read", "update"], appointments: ["read", "update"], encounters: ["read", "create", "update"], registry: ["read"], network: ["read"], identity: ["read"], consents: ["read", "create"], referrals: ["read", "create", "update"], labs: ["read", "create", "update"], imaging: ["read", "create", "update"], documents: ["read", "create", "update"], voice: ["read", "create", "update"] },
  front_desk: { patients: ["read", "create", "update"], appointments: ["read", "create", "update"], encounters: ["read"], billing: ["read"], registry: ["read"], network: ["read"], identity: ["read", "create", "update"], consents: ["read", "create", "update"], referrals: ["read", "update"], labs: ["read", "create", "update"], imaging: ["read", "create", "update"], documents: ["read", "create", "update"], voice: ["read", "create", "update"] },
  biller: { patients: ["read"], appointments: ["read"], encounters: ["read"], billing: ["read", "create", "update"], registry: ["read"], network: ["read"], identity: ["read"], consents: ["read"], referrals: ["read"], labs: ["read"], imaging: ["read"], documents: ["read", "create", "update"], voice: ["read", "create"] },
  quality: { patients: ["read"], appointments: ["read"], encounters: ["read"], billing: ["read"], registry: ["read"], network: ["read"], identity: ["read"], consents: ["read"], referrals: ["read"], labs: ["read"], imaging: ["read"], documents: ["read"], voice: ["read", "create"] },
  case_manager: { patients: ["read", "update"], appointments: ["read"], encounters: ["read"], registry: ["read"], network: ["read", "create", "update"], identity: ["read", "update"], consents: ["read", "create", "update"], referrals: ["read", "create", "update"], labs: ["read", "create", "update"], imaging: ["read", "create", "update"], documents: ["read", "create", "update", "manage"], voice: ["read", "create", "update"] },
  viewer: { patients: ["read"], appointments: ["read"], encounters: ["read"], billing: ["read"], registry: ["read"], labs: ["read"], imaging: ["read"], documents: ["read"] },
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
