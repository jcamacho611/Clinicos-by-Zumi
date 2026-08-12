import { can, clinicActions, clinicResources, type ClinicRole } from "@/lib/auth/rbac";

/**
 * Convert the canonical RBAC matrix into the orchestration engine's string-key
 * vocabulary without duplicating authorization policy. This is descriptive context
 * for deterministic capability evaluation; it does not grant anything beyond `can`.
 */
export function permissionKeysForRole(role: ClinicRole) {
  const keys: string[] = [];
  for (const resource of clinicResources) {
    for (const action of clinicActions) {
      if (can(role, resource, action)) keys.push(`${resource}:${action}`);
    }
  }
  return keys;
}

/** The newer orchestration catalog uses generic owner/admin aliases in a few paths. */
export function orchestrationRoleKeys(role: ClinicRole) {
  if (role === "clinic_owner") return [role, "owner"];
  if (role === "administrator") return [role, "admin"];
  return [role];
}
