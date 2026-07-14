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
export type ClinicResource = "patients" | "appointments" | "encounters" | "billing" | "settings" | "users";
export type ClinicAction = "read" | "create" | "update" | "sign" | "manage";

const permissions: Record<ClinicRole, Partial<Record<ClinicResource, ClinicAction[]>>> = {
  clinic_owner: {
    patients: ["read", "create", "update"], appointments: ["read", "create", "update"], encounters: ["read", "create", "update", "sign"],
    billing: ["read", "create", "update"], settings: ["read", "update", "manage"], users: ["read", "create", "update", "manage"],
  },
  administrator: {
    patients: ["read", "create", "update"], appointments: ["read", "create", "update"], encounters: ["read", "create", "update"],
    billing: ["read", "create", "update"], settings: ["read", "update"], users: ["read", "create", "update"],
  },
  provider: { patients: ["read", "update"], appointments: ["read", "update"], encounters: ["read", "create", "update", "sign"], billing: ["read"] },
  clinical_staff: { patients: ["read", "update"], appointments: ["read", "update"], encounters: ["read", "create", "update"] },
  front_desk: { patients: ["read", "create", "update"], appointments: ["read", "create", "update"], encounters: ["read"], billing: ["read"] },
  biller: { patients: ["read"], appointments: ["read"], encounters: ["read"], billing: ["read", "create", "update"] },
  quality: { patients: ["read"], appointments: ["read"], encounters: ["read"], billing: ["read"] },
  case_manager: { patients: ["read", "update"], appointments: ["read"], encounters: ["read"] },
  viewer: { patients: ["read"], appointments: ["read"], encounters: ["read"], billing: ["read"] },
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
