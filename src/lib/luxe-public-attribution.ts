export type LuxeFirstTouchAttribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  landingPage?: string;
  referrer?: string;
};

export function boundedAttributionText(value: string | null | undefined, max: number) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

export function sanitizeAttributionUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return undefined;
  }
}

export function sourceFromReferrer(referrer: string | null | undefined) {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("facebook.com") || host.includes("fb.com")) return "facebook";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("google.")) return "google";
    if (host.includes("luxe-medi.com")) return "luxe_website";
    return host || "referral";
  } catch {
    return "referral";
  }
}

export function captureLuxeFirstTouch(params: URLSearchParams, referrer: string, landingPage: string): LuxeFirstTouchAttribution {
  return {
    source: boundedAttributionText(params.get("utm_source") ?? params.get("source"), 120) ?? sourceFromReferrer(referrer),
    medium: boundedAttributionText(params.get("utm_medium"), 120),
    campaign: boundedAttributionText(params.get("utm_campaign"), 160),
    term: boundedAttributionText(params.get("utm_term"), 160),
    content: boundedAttributionText(params.get("utm_content"), 160),
    landingPage: sanitizeAttributionUrl(landingPage),
    referrer: sanitizeAttributionUrl(referrer),
  };
}
