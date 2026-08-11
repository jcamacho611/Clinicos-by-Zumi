/**
 * In-process rate limiting for unauthenticated public endpoints.
 *
 * The Growth Engine's write endpoints accept traffic from anyone on the internet with
 * no session to attribute it to, so they need a limit that does not depend on knowing
 * who the caller is.
 *
 * **Known limitation, stated rather than hidden:** this is per-process memory. Across
 * several instances each gets its own counter, so the effective limit is the stated
 * limit times the instance count, and a restart clears it. That is a real weakening
 * under horizontal scale. It is deliberate for now — a shared store is the correct
 * fix and needs Redis or equivalent, which is a deployment decision. Until then this
 * stops casual abuse and script-level flooding, which is most of it, and the
 * endpoints behind it write only non-sensitive marketing records.
 *
 * Pure module. No database, no network.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Stop the map growing without bound in a long-lived process. */
const MAX_TRACKED_KEYS = 10_000;

export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) evictExpired(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

function evictExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // If everything is still live, drop the oldest-resetting entries rather than
  // refusing to track anything new.
  if (buckets.size >= MAX_TRACKED_KEYS) {
    const sorted = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    for (const [key] of sorted.slice(0, Math.floor(MAX_TRACKED_KEYS / 4))) buckets.delete(key);
  }
}

/** Test seam. */
export function resetRateLimits() {
  buckets.clear();
}

/**
 * Client key for an unauthenticated request.
 *
 * `x-forwarded-for` is spoofable by a direct caller, so this is not an identity — it
 * is a cheap partition that makes casual abuse cost more than it is worth. It is
 * never used for authorization.
 */
export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return `${scope}:${forwarded || real || "unknown"}`;
}

export const RATE_LIMIT_LIMITATION =
  "Rate limiting is per-process and in-memory. Under horizontal scale the effective limit multiplies by instance count, and it resets on deploy. A shared store is required before this can be relied on as a security control.";
