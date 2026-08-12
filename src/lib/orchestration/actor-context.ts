import type { ClinicSession } from "@/lib/auth/types";
import type { ActorContext, KlinikosContextKind } from "@/lib/orchestration/contracts";

function roleAliases(role: ClinicSession["role"]) {
  if (role === "clinic_owner") return ["clinic_owner", "owner"];
  if (role === "administrator") return ["administrator", "admin"];
  return [role];
}

export function actorContextFromSession(
  session: ClinicSession,
  contextKind: KlinikosContextKind = "clinic",
): ActorContext {
  return {
    actorId: session.userId,
    actorKind: "user",
    userId: session.userId,
    organizationId: session.organizationId,
    contextKind,
    roleKeys: roleAliases(session.role),
    permissionKeys: [],
  };
}
