interface AttemptWindow {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, AttemptWindow>();
const onboardingAttempts = new Map<string, AttemptWindow>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const ONBOARDING_WINDOW_MS = 60 * 60 * 1000;
const MAX_ONBOARDING_ATTEMPTS = 5;

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

export function checkOnboardingRateLimit(key: string) {
  const now = Date.now();
  const current = onboardingAttempts.get(key);
  if (!current || current.resetAt <= now) {
    onboardingAttempts.set(key, { count: 0, resetAt: now + ONBOARDING_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return {
    allowed: current.count < MAX_ONBOARDING_ATTEMPTS,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function recordOnboardingAttempt(key: string) {
  const now = Date.now();
  const current = onboardingAttempts.get(key);
  onboardingAttempts.set(key, !current || current.resetAt <= now
    ? { count: 1, resetAt: now + ONBOARDING_WINDOW_MS }
    : { ...current, count: current.count + 1 });
}
