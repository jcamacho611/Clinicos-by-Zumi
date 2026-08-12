import type { ActorContext, KlinikosContextKind } from "@/lib/orchestration/contracts";

export type ContextMembership = {
  actorId: string;
  userId?: string | null;
  patientId?: string | null;
  providerId?: string | null;
  organizationId?: string | null;
  contextKind: KlinikosContextKind;
  roleKeys: string[];
  permissionKeys: string[];
  status: "active" | "inactive" | "pending";
};

export function resolveAvailableContexts(memberships: readonly ContextMembership[]) {
  return memberships.filter((membership) => membership.status === "active");
}

export function switchActorContext(input: {
  memberships: readonly ContextMembership[];
  actorId: string;
  contextKind: KlinikosContextKind;
  organizationId?: string | null;
}): ActorContext | null {
  const match = input.memberships.find((membership) =>
    membership.actorId === input.actorId &&
    membership.contextKind === input.contextKind &&
    (input.organizationId == null || membership.organizationId === input.organizationId) &&
    membership.status === "active",
  );

  if (!match) return null;

  return {
    actorId: match.actorId,
    actorKind: match.patientId ? "patient" : match.providerId ? "provider" : "user",
    userId: match.userId ?? null,
    patientId: match.patientId ?? null,
    providerId: match.providerId ?? null,
    organizationId: match.organizationId ?? null,
    contextKind: match.contextKind,
    roleKeys: [...match.roleKeys],
    permissionKeys: [...match.permissionKeys],
  };
}

export function contextsAreDataIsolated(a: ActorContext, b: ActorContext) {
  if (a.contextKind === "patient" || b.contextKind === "patient") {
    return a.contextKind !== b.contextKind || a.patientId !== b.patientId || a.organizationId !== b.organizationId;
  }
  if (a.organizationId && b.organizationId && a.organizationId !== b.organizationId) return true;
  return false;
}
