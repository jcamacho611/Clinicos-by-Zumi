import "server-only";

import { db } from "@/lib/db";

export type IntelligenceConnectionScope =
  | { scopeType: "identity"; identityId: string; organizationId?: never }
  | { scopeType: "organization"; identityId?: never; organizationId: string };

export type IntelligenceConnectionInput = IntelligenceConnectionScope & {
  providerKey: string;
  authorizationMethod: "api_key" | "oauth" | "organization" | "enterprise" | "bring_your_own_key";
  secretReference: string;
  modelPreference?: string | null;
  paysUsage: "identity" | "organization" | "klinikos" | "provider";
  phiEligible?: boolean;
  status?: "active" | "pending" | "disabled" | "revoked";
};

export async function upsertIntelligenceConnection(input: IntelligenceConnectionInput) {
  const scopeKey = input.scopeType === "identity"
    ? { identityId_providerKey: { identityId: input.identityId, providerKey: input.providerKey } }
    : { organizationId_providerKey: { organizationId: input.organizationId, providerKey: input.providerKey } };

  const data = {
    scopeType: input.scopeType,
    identityId: input.scopeType === "identity" ? input.identityId : null,
    organizationId: input.scopeType === "organization" ? input.organizationId : null,
    providerKey: input.providerKey,
    authorizationMethod: input.authorizationMethod,
    secretReference: input.secretReference,
    modelPreference: input.modelPreference ?? null,
    paysUsage: input.paysUsage,
    phiEligible: input.phiEligible ?? false,
    status: input.status ?? "active",
  };

  return input.scopeType === "identity"
    ? db.aiConnection.upsert({ where: scopeKey as { identityId_providerKey: { identityId: string; providerKey: string } }, create: data, update: data })
    : db.aiConnection.upsert({ where: scopeKey as { organizationId_providerKey: { organizationId: string; providerKey: string } }, create: data, update: data });
}

export async function resolveIntelligenceConnection(input: { identityId?: string; organizationId?: string; providerKey?: string }) {
  const common = { status: "active", ...(input.providerKey ? { providerKey: input.providerKey } : {}) };

  if (input.identityId) {
    const personal = await db.aiConnection.findFirst({ where: { ...common, scopeType: "identity", identityId: input.identityId }, orderBy: { updatedAt: "desc" } });
    if (personal) return personal;
  }

  if (input.organizationId) {
    return db.aiConnection.findFirst({ where: { ...common, scopeType: "organization", organizationId: input.organizationId }, orderBy: { updatedAt: "desc" } });
  }

  return null;
}

export async function listIntelligenceConnections(input: { identityId?: string; organizationId?: string }) {
  return db.aiConnection.findMany({
    where: {
      OR: [
        ...(input.identityId ? [{ scopeType: "identity", identityId: input.identityId }] : []),
        ...(input.organizationId ? [{ scopeType: "organization", organizationId: input.organizationId }] : []),
      ],
    },
    orderBy: { updatedAt: "desc" },
  });
}
