const PUBLIC_ACTION_PATHS = new Set([
  "/grid",
  "/edu",
  "/pricing",
  "/trust",
  "/ecosystem",
  "/how-it-works",
  "/founding-clinic",
  "/sales",
  "/operational-audit",
  "/start",
  "/access",
]);

const PUBLIC_CONTINUATION_INTENT_KEYS = new Set([
  "clinic",
  "grid",
  "edu",
  "referrals",
  "staffing",
  "priorities",
  "revenue",
  "billing",
  "insights",
  "care",
]);

function safeInternalDestination(value: string) {
  const candidate = value.trim();
  if (
    !candidate.startsWith("/")
    || candidate.startsWith("//")
    || candidate.length > 500
    || /[\r\n\\]/.test(candidate)
  ) {
    return null;
  }

  try {
    const parsed = new URL(candidate, "https://klinikos.local");
    if (parsed.origin !== "https://klinikos.local") return null;
    return parsed;
  } catch {
    return null;
  }
}

function decoratePublicDestination(destination: URL, intentKey: string) {
  destination.searchParams.set("from", "public-zumi");
  if (PUBLIC_CONTINUATION_INTENT_KEYS.has(intentKey)) {
    destination.searchParams.set("intent", intentKey);
  }
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

/**
 * Carry only low-sensitivity structured continuation metadata into an already-public
 * value surface. This preserves the intent Zumi resolved without serializing the raw
 * public conversation into URLs, analytics, referrers, screenshots, or logs.
 */
export function publicContinuationHref(href: string, intentKey: string) {
  const destination = safeInternalDestination(href);
  if (!destination) return "/";
  return decoratePublicDestination(destination, intentKey);
}

/**
 * Resolve the CTA produced by Public Zumi while preserving the value-first journey.
 *
 * Public surfaces stay public and receive only bounded structured continuation state.
 * Patient access uses the separate patient login. Protected clinic work continues
 * through the canonical staff sign-in return gate.
 */
export function publicLivingDestinationHref(destination: { href: string; key: string }) {
  const parsed = safeInternalDestination(destination.href);
  if (!parsed) return "/login";
  if (parsed.pathname === "/portal") return "/portal/login";
  if (PUBLIC_ACTION_PATHS.has(parsed.pathname)) {
    return publicContinuationHref(destination.href, destination.key);
  }
  return protectedPublicContinuationHref(destination.href, destination.key);
}

/**
 * Carry only low-sensitivity structured continuation metadata across sign-in.
 *
 * The raw Public Zumi prompt never belongs in the URL. It may contain healthcare,
 * employment, financial, or other private context that browsers, proxies, analytics,
 * logs, referrers, and screenshots can retain. The destination itself remains subject
 * to the existing same-origin login return gate and all server-side authorization.
 */
export function protectedPublicContinuationHref(href: string, intentKey: string) {
  const destination = safeInternalDestination(href);
  if (!destination) return "/login";

  const returnTo = decoratePublicDestination(destination, intentKey);
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
