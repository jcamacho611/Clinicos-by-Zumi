export type KlinikosRoutePresentationOwner =
  | "living-home"
  | "public-experience"
  | "authenticated-app"
  | "workflow";

export type KlinikosRoutePresentationPolicy = {
  owner: KlinikosRoutePresentationOwner;
  referenceLocked: boolean;
  publicZumiVisible: boolean;
  appearanceControllerVisible: boolean;
  utilityDockVisible: boolean;
};

/**
 * Public routes where the root-level utility dock is part of the product experience.
 *
 * Keep this browser-safe: it contains presentation metadata only. It does not grant
 * authentication, authorization, entitlement, Grid eligibility, clinical authority,
 * or any other consequential capability.
 */
export const publicExperiencePaths = new Set([
  "/about",
  "/capabilities",
  "/ecosystem",
  "/founding-clinic",
  "/how-it-works",
  "/operational-audit",
  "/pricing",
  "/sales",
  "/start",
  "/trust",
  "/grid",
  "/grid/browse",
  "/grid/pricing",
  "/edu",
]);

/**
 * Authenticated workspace prefixes that are already owned by AppShell. The exact
 * public Grid gateway/browse routes above are checked first so the same Grid product
 * can have a public discovery entrance and authenticated operating workspaces without
 * becoming two products or two presentation authorities.
 */
export const authenticatedAppPathPrefixes = [
  "/dashboard",
  "/patients",
  "/settings",
  "/zumi",
  "/admin",
  "/billing",
  "/cases",
  "/encounters",
  "/front-desk",
  "/luxe-medi",
  "/network",
  "/owner",
  "/paths",
  "/provider",
  "/grid/availability",
  "/grid/founding-network",
  "/grid/handoffs",
  "/grid/locations",
  "/grid/needs",
  "/grid/opportunities",
  "/grid/payouts",
  "/grid/providers",
  "/grid/requests",
  "/grid/resources",
  "/grid/services",
  "/grid/transactions",
  "/grid/trust",
  "/grid/workspace",
] as const;

function pathMatchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Single browser-side authority for route presentation ownership.
 *
 * This policy decides only which already-existing shell/utility presentation owns a
 * route. It deliberately fails closed for unknown/workflow routes: the root public
 * utility dock must not silently become a second chrome/theme/Zumi authority on a
 * route that has not explicitly opted into the public experience.
 */
export function routePresentationPolicy(pathname: string): KlinikosRoutePresentationPolicy {
  if (pathname === "/") {
    return {
      owner: "living-home",
      referenceLocked: true,
      publicZumiVisible: false,
      appearanceControllerVisible: false,
      utilityDockVisible: false,
    };
  }

  if (publicExperiencePaths.has(pathname)) {
    return {
      owner: "public-experience",
      referenceLocked: false,
      publicZumiVisible: true,
      appearanceControllerVisible: true,
      utilityDockVisible: true,
    };
  }

  if (authenticatedAppPathPrefixes.some((prefix) => pathMatchesPrefix(pathname, prefix))) {
    return {
      owner: "authenticated-app",
      referenceLocked: false,
      publicZumiVisible: false,
      appearanceControllerVisible: false,
      utilityDockVisible: false,
    };
  }

  return {
    owner: "workflow",
    referenceLocked: false,
    publicZumiVisible: false,
    appearanceControllerVisible: false,
    utilityDockVisible: false,
  };
}
