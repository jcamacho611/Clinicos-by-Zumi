import "server-only";

import { resolveIdentityContextForSession } from "@/lib/identity/context";
import { workspaceChoices, routeIntent } from "@/lib/identity/workspace-routing";
import { resolveIntelligenceConnection } from "@/lib/intelligence/connections";
import type { ClinicSession } from "@/lib/auth/types";

export async function loadKlinikosOnboardingState(session: ClinicSession) {
  const context = await resolveIdentityContextForSession(session);
  const intelligence = await resolveIntelligenceConnection({
    identityId: context.identityId.startsWith("legacy:") ? undefined : context.identityId,
    organizationId: context.activeOrganizationId,
  });

  return {
    identity: {
      identityId: context.identityId,
      email: context.email,
      activeMembershipId: context.activeMembershipId ?? null,
      activeOrganizationId: context.activeOrganizationId ?? null,
      activeRoles: context.activeRoles,
    },
    memberships: context.memberships,
    workspaces: workspaceChoices(context.activeRoles),
    intelligence: intelligence
      ? {
          connected: true as const,
          providerKey: intelligence.providerKey,
          scopeType: intelligence.scopeType,
          modelPreference: intelligence.modelPreference,
          phiEligible: intelligence.phiEligible,
          paysUsage: intelligence.paysUsage,
          status: intelligence.status,
        }
      : {
          connected: false as const,
          providerKey: null,
          scopeType: null,
          modelPreference: null,
          phiEligible: false,
          paysUsage: null,
          status: "not_connected" as const,
        },
  };
}

export async function routeKlinikosIntent(session: ClinicSession, intent: string) {
  const state = await loadKlinikosOnboardingState(session);
  const destination = routeIntent(intent, state.identity.activeRoles);

  return {
    ...state,
    intent,
    destination,
  };
}
