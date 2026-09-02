/**
 * Client-safe presentation projection of the Screen Experience Registry.
 *
 * This table does not grant route access, identity, eligibility, or authority. It
 * only prevents public route presentation from being independently reclassified by
 * navigation, Zumi, appearance, sitemap, and design consumers.
 */

export type PublicProjection =
  | "living-home"
  | "public-discovery"
  | "grid-entry"
  | "grid-discovery"
  | "grid-enrollment"
  | "edu-entry"
  | "auth-entry"
  | "payment-return";

export type PublicChromeMode = "reference" | "shared-public" | "route-owned";
export type PublicZumiMode = "embedded-command" | "floating-public" | "none";
export type PublicAppearanceMode =
  | "reference-obsidian"
  | "adaptive"
  | "fixed-obsidian"
  | "fixed-marble";

export type PublicRoutePresentation = {
  id: string;
  pathname: string;
  match: "exact" | "prefix" | "children";
  projection: PublicProjection;
  chromeMode: PublicChromeMode;
  zumiMode: PublicZumiMode;
  appearanceMode: PublicAppearanceMode;
  directContinuation: boolean;
  publicZumiPrompt?: string;
  sitemap?: {
    changeFrequency: "daily" | "weekly" | "monthly";
    priority: number;
  };
  navigation?: {
    order: number;
    label: string;
    href: string;
  };
};

const commonPublic = {
  projection: "public-discovery",
  chromeMode: "route-owned",
  zumiMode: "floating-public",
  appearanceMode: "fixed-obsidian",
  directContinuation: true,
} as const;

export const PUBLIC_ROUTE_PRESENTATION_POLICIES: readonly PublicRoutePresentation[] = [
  {
    id: "living-home",
    pathname: "/",
    match: "exact",
    projection: "living-home",
    chromeMode: "reference",
    zumiMode: "embedded-command",
    appearanceMode: "reference-obsidian",
    directContinuation: true,
    sitemap: { changeFrequency: "weekly", priority: 1 },
  },
  {
    ...commonPublic,
    id: "about",
    pathname: "/about",
    match: "exact",
    chromeMode: "shared-public",
    appearanceMode: "adaptive",
    sitemap: { changeFrequency: "monthly", priority: 0.7 },
  },
  {
    ...commonPublic,
    id: "how-it-works",
    pathname: "/how-it-works",
    match: "exact",
    chromeMode: "shared-public",
    appearanceMode: "adaptive",
    sitemap: { changeFrequency: "monthly", priority: 0.9 },
    navigation: { order: 1, label: "How Klinikos helps", href: "/how-it-works" },
  },
  {
    ...commonPublic,
    id: "capabilities",
    pathname: "/capabilities",
    match: "exact",
    sitemap: { changeFrequency: "monthly", priority: 0.8 },
  },
  {
    ...commonPublic,
    id: "ecosystem",
    pathname: "/ecosystem",
    match: "exact",
    sitemap: { changeFrequency: "monthly", priority: 0.8 },
  },
  {
    ...commonPublic,
    id: "pricing",
    pathname: "/pricing",
    match: "exact",
    appearanceMode: "fixed-marble",
    publicZumiPrompt: "Help me understand Klinikos pricing and what it replaces.",
    sitemap: { changeFrequency: "weekly", priority: 0.9 },
  },
  {
    ...commonPublic,
    id: "trust",
    pathname: "/trust",
    match: "exact",
    publicZumiPrompt: "What should I know about Klinikos trust, privacy and authority boundaries?",
    sitemap: { changeFrequency: "weekly", priority: 0.9 },
  },
  {
    ...commonPublic,
    id: "founding-clinic",
    pathname: "/founding-clinic",
    match: "exact",
    publicZumiPrompt: "What does the founding clinic path mean for a clinic?",
    sitemap: { changeFrequency: "weekly", priority: 0.9 },
    navigation: { order: 5, label: "For clinics", href: "/founding-clinic" },
  },
  {
    ...commonPublic,
    id: "operational-audit",
    pathname: "/operational-audit",
    match: "exact",
    publicZumiPrompt: "How does the operating analysis help a clinic?",
    sitemap: { changeFrequency: "weekly", priority: 0.8 },
  },
  {
    ...commonPublic,
    id: "sales",
    pathname: "/sales",
    match: "exact",
    sitemap: { changeFrequency: "weekly", priority: 0.7 },
  },
  {
    ...commonPublic,
    id: "start",
    pathname: "/start",
    match: "exact",
    sitemap: { changeFrequency: "weekly", priority: 0.8 },
  },
  {
    id: "access",
    pathname: "/access",
    match: "exact",
    projection: "auth-entry",
    chromeMode: "route-owned",
    zumiMode: "none",
    appearanceMode: "fixed-obsidian",
    directContinuation: true,
  },
  {
    id: "grid-entry",
    pathname: "/grid",
    match: "exact",
    projection: "grid-entry",
    chromeMode: "route-owned",
    zumiMode: "floating-public",
    appearanceMode: "fixed-obsidian",
    directContinuation: true,
    publicZumiPrompt: "What is Grid and what can I do here?",
    sitemap: { changeFrequency: "daily", priority: 0.8 },
    navigation: { order: 2, label: "Explore Grid", href: "/grid" },
  },
  {
    id: "grid-browse",
    pathname: "/grid/browse",
    match: "exact",
    projection: "grid-discovery",
    chromeMode: "shared-public",
    zumiMode: "floating-public",
    appearanceMode: "adaptive",
    directContinuation: true,
    publicZumiPrompt: "What is Grid and what can I do here?",
    sitemap: { changeFrequency: "daily", priority: 0.7 },
    navigation: { order: 3, label: "Find care", href: "/grid/browse?intent=provider" },
  },
  {
    id: "grid-browse-detail",
    pathname: "/grid/browse",
    match: "children",
    projection: "grid-discovery",
    chromeMode: "route-owned",
    zumiMode: "floating-public",
    appearanceMode: "fixed-marble",
    directContinuation: true,
    publicZumiPrompt: "What is Grid and what can I do here?",
  },
  {
    id: "grid-resource-detail",
    pathname: "/grid/resource",
    match: "children",
    projection: "grid-discovery",
    chromeMode: "route-owned",
    zumiMode: "floating-public",
    appearanceMode: "fixed-marble",
    directContinuation: true,
    publicZumiPrompt: "What is Grid and what can I do here?",
  },
  {
    id: "grid-resource-browse",
    pathname: "/grid/resources/browse",
    match: "exact",
    projection: "grid-discovery",
    chromeMode: "route-owned",
    zumiMode: "floating-public",
    appearanceMode: "fixed-marble",
    directContinuation: true,
    publicZumiPrompt: "What is Grid and what can I do here?",
  },
  {
    id: "grid-pricing",
    pathname: "/grid/pricing",
    match: "exact",
    projection: "grid-entry",
    chromeMode: "route-owned",
    zumiMode: "floating-public",
    appearanceMode: "fixed-marble",
    directContinuation: true,
    publicZumiPrompt: "What is Grid and what can I do here?",
    sitemap: { changeFrequency: "weekly", priority: 0.7 },
  },
  {
    id: "grid-enrollment",
    pathname: "/grid/join",
    match: "prefix",
    projection: "grid-enrollment",
    chromeMode: "route-owned",
    zumiMode: "floating-public",
    appearanceMode: "fixed-marble",
    directContinuation: true,
    publicZumiPrompt: "What is Grid and what can I do here?",
  },
  {
    id: "edu-entry",
    pathname: "/edu",
    match: "exact",
    projection: "edu-entry",
    chromeMode: "route-owned",
    zumiMode: "floating-public",
    appearanceMode: "fixed-marble",
    directContinuation: true,
    publicZumiPrompt: "What can Klinikos EDU help with?",
    sitemap: { changeFrequency: "weekly", priority: 0.7 },
    navigation: { order: 4, label: "Learn", href: "/edu" },
  },
  {
    id: "legal-acceptance",
    pathname: "/legal/accept",
    match: "exact",
    projection: "auth-entry",
    chromeMode: "route-owned",
    zumiMode: "none",
    appearanceMode: "fixed-marble",
    directContinuation: false,
  },
  {
    id: "legal-public",
    pathname: "/legal",
    match: "prefix",
    projection: "public-discovery",
    chromeMode: "route-owned",
    zumiMode: "none",
    appearanceMode: "fixed-marble",
    directContinuation: false,
  },
  {
    id: "luxe-consult",
    pathname: "/luxe",
    match: "prefix",
    projection: "public-discovery",
    chromeMode: "route-owned",
    zumiMode: "none",
    appearanceMode: "fixed-obsidian",
    directContinuation: false,
  },
  ...["/demo", "/private-demo", "/klinikos"].map((pathname) => ({
    id: pathname.slice(1),
    pathname,
    match: "exact" as const,
    projection: "public-discovery" as const,
    chromeMode: "route-owned" as const,
    zumiMode: "none" as const,
    appearanceMode: "fixed-obsidian" as const,
    directContinuation: false,
  })),
  {
    id: "payment-return",
    pathname: "/payments/success",
    match: "exact",
    projection: "payment-return",
    chromeMode: "route-owned",
    zumiMode: "none",
    appearanceMode: "fixed-marble",
    directContinuation: false,
  },
];

const PUBLIC_ROUTE_BASE = "https://klinikos.invalid";

function normalizePathname(value: string): string | null {
  if (!value.startsWith("/") || value.includes("\\")) return null;

  try {
    const url = new URL(value, PUBLIC_ROUTE_BASE);
    if (url.origin !== PUBLIC_ROUTE_BASE) return null;
    const pathname = url.pathname.replace(/\/{2,}/g, "/");
    if (!pathname) return "/";
    return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  } catch {
    return null;
  }
}

function matches(policy: PublicRoutePresentation, pathname: string) {
  if (policy.match === "exact") return pathname === policy.pathname;
  if (policy.match === "children") return pathname.startsWith(`${policy.pathname}/`);
  return pathname === policy.pathname || pathname.startsWith(`${policy.pathname}/`);
}

export function resolvePublicRoutePresentation(value: string): PublicRoutePresentation | null {
  const pathname = normalizePathname(value);
  if (!pathname) return null;
  return PUBLIC_ROUTE_PRESENTATION_POLICIES.find((policy) => matches(policy, pathname)) ?? null;
}

export function isPublicDirectDestination(href: string) {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  return resolvePublicRoutePresentation(href)?.directContinuation === true;
}

export const PUBLIC_PRIMARY_NAVIGATION = PUBLIC_ROUTE_PRESENTATION_POLICIES
  .flatMap((policy) => policy.navigation ? [policy.navigation] : [])
  .sort((left, right) => left.order - right.order)
  .map(({ label, href }) => ({ label, href }));

export const publicSitemapEntries = PUBLIC_ROUTE_PRESENTATION_POLICIES
  .flatMap((policy) => policy.sitemap ? [{ path: policy.pathname, ...policy.sitemap }] : []);

export const publicAppearanceBootstrapRules = PUBLIC_ROUTE_PRESENTATION_POLICIES.map((policy) => ({
  pathname: policy.pathname,
  match: policy.match,
  appearanceMode: policy.appearanceMode,
}));
