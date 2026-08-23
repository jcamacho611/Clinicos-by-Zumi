import type { ClinicRole } from "@/lib/auth/rbac";
import { safeReturnTo } from "@/lib/auth/return-to";

export interface PostLoginRoutingInput {
  role: ClinicRole;
  requestedReturnTo: unknown;
  legalGateEnabled: boolean;
  legalConfigurationReady: boolean;
  agreementAccepted: boolean;
}

function defaultProtectedPath(role: ClinicRole) {
  return role === "contractor" ? "/grid/opportunities" : "/dashboard";
}

/**
 * Resolve the first protected destination after authentication for the legacy/global
 * authenticated agreement path. Universal protected entry is a separate pre-auth gate.
 *
 * `safeReturnTo` is the only source of a requested target, preventing external origins,
 * malformed targets and agreement loops from entering the redirect chain.
 */
export function resolvePostLoginRedirect(input: PostLoginRoutingInput) {
  const fallback = defaultProtectedPath(input.role);
  const requestedTarget = safeReturnTo(input.requestedReturnTo);
  const target = requestedTarget && !requestedTarget.startsWith("/legal/") ? requestedTarget : fallback;

  if (!input.legalGateEnabled || input.agreementAccepted) return target;

  const query = new URLSearchParams();
  if (!input.legalConfigurationReady) query.set("blocked", "configuration");
  query.set("returnTo", target);
  return `/legal/accept?${query.toString()}`;
}
