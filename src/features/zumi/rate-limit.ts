interface WindowState {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowState>();

function envInt(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Per-process limiter for immediate abuse resistance. This is deliberately labeled as
 * defence-in-depth rather than a distributed production quota: multi-instance
 * deployments still need an external/shared limiter at the edge or data layer.
 */
export function checkZumiProcessRateLimit(key: string, now = Date.now()) {
  const windowMs = Math.min(envInt("ZUMI_RATE_LIMIT_WINDOW_MS", 60_000), 60 * 60 * 1000);
  const maxRequests = Math.min(envInt("ZUMI_RATE_LIMIT_MAX_REQUESTS", 30), 300);
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0, remaining: Math.max(0, maxRequests - 1) };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  existing.count += 1;
  windows.set(key, existing);
  return { allowed: true, retryAfterSeconds: 0, remaining: Math.max(0, maxRequests - existing.count) };
}

export function resetZumiProcessRateLimitForTests() {
  windows.clear();
}
