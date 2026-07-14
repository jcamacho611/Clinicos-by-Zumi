interface AttemptWindow {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, AttemptWindow>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function checkLoginRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return {
    allowed: current.count < MAX_ATTEMPTS,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  attempts.set(key, !current || current.resetAt <= now
    ? { count: 1, resetAt: now + WINDOW_MS }
    : { ...current, count: current.count + 1 });
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
