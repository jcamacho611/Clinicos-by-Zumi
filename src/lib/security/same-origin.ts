import "server-only";

export type SameOriginDecision =
  | { allowed: true }
  | { allowed: false; reason: "cross_site" | "origin_missing" | "origin_mismatch" | "canonical_origin_invalid" };

function canonicalOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  try {
    return new URL(configured || request.url).origin;
  } catch {
    return null;
  }
}

/**
 * Defense-in-depth for cookie-authenticated browser mutations.
 *
 * SameSite cookies remain useful, but sensitive mutations also require the browser's
 * Origin to match the canonical Klinikos origin. Sec-Fetch-Site is an additional signal,
 * never the sole authority. Server-to-server integrations need their own authenticated
 * boundary instead of silently bypassing this browser contract.
 */
export function evaluateSameOriginMutation(request: Request): SameOriginDecision {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite === "cross-site") return { allowed: false, reason: "cross_site" };

  const expectedOrigin = canonicalOrigin(request);
  if (!expectedOrigin) return { allowed: false, reason: "canonical_origin_invalid" };

  const origin = request.headers.get("origin")?.trim();
  if (!origin) return { allowed: false, reason: "origin_missing" };

  try {
    return new URL(origin).origin === expectedOrigin
      ? { allowed: true }
      : { allowed: false, reason: "origin_mismatch" };
  } catch {
    return { allowed: false, reason: "origin_mismatch" };
  }
}
