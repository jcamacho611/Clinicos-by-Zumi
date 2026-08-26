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

  destination.searchParams.set("from", "public-zumi");
  if (PUBLIC_CONTINUATION_INTENT_KEYS.has(intentKey)) {
    destination.searchParams.set("intent", intentKey);
  }

  const returnTo = `${destination.pathname}${destination.search}${destination.hash}`;
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
