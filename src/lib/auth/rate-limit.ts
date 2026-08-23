interface AttemptWindow {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, AttemptWindow>();
const onboardingAttempts = new Map<string, AttemptWindow>();
const salesIntakeAttempts = new Map<string, AttemptWindow>();
const gridEnrollmentAttempts = new Map<string, AttemptWindow>();
const luxeLeadIntakeAttempts = new Map<string, AttemptWindow>();
const memberSignupAttempts = new Map<string, AttemptWindow>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const ONBOARDING_WINDOW_MS = 60 * 60 * 1000;
const MAX_ONBOARDING_ATTEMPTS = 5;
const SALES_INTAKE_WINDOW_MS = 60 * 60 * 1000;
const MAX_SALES_INTAKE_ATTEMPTS = 8;
const GRID_ENROLLMENT_WINDOW_MS = 60 * 60 * 1000;
const MAX_GRID_ENROLLMENT_ATTEMPTS = 5;
const LUXE_LEAD_INTAKE_WINDOW_MS = 15 * 60 * 1000;
const MAX_LUXE_LEAD_INTAKE_ATTEMPTS = 12;
const MEMBER_SIGNUP_WINDOW_MS = 60 * 60 * 1000;
const MAX_MEMBER_SIGNUP_ATTEMPTS = 5;

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

export function checkSalesIntakeRateLimit(key: string) {
  const now = Date.now();
  const current = salesIntakeAttempts.get(key);
  if (!current || current.resetAt <= now) {
    salesIntakeAttempts.set(key, { count: 0, resetAt: now + SALES_INTAKE_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return {
    allowed: current.count < MAX_SALES_INTAKE_ATTEMPTS,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function recordSalesIntakeAttempt(key: string) {
  const now = Date.now();
  const current = salesIntakeAttempts.get(key);
  salesIntakeAttempts.set(key, !current || current.resetAt <= now
    ? { count: 1, resetAt: now + SALES_INTAKE_WINDOW_MS }
    : { ...current, count: current.count + 1 });
}

export function checkGridEnrollmentRateLimit(key: string) {
  const now = Date.now();
  const current = gridEnrollmentAttempts.get(key);
  if (!current || current.resetAt <= now) {
    gridEnrollmentAttempts.set(key, { count: 0, resetAt: now + GRID_ENROLLMENT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return {
    allowed: current.count < MAX_GRID_ENROLLMENT_ATTEMPTS,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function recordGridEnrollmentAttempt(key: string) {
  const now = Date.now();
  const current = gridEnrollmentAttempts.get(key);
  gridEnrollmentAttempts.set(key, !current || current.resetAt <= now
    ? { count: 1, resetAt: now + GRID_ENROLLMENT_WINDOW_MS }
    : { ...current, count: current.count + 1 });
}

export function checkLuxeLeadIntakeRateLimit(key: string) {
  const now = Date.now();
  const current = luxeLeadIntakeAttempts.get(key);
  if (!current || current.resetAt <= now) {
    luxeLeadIntakeAttempts.set(key, { count: 0, resetAt: now + LUXE_LEAD_INTAKE_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return {
    allowed: current.count < MAX_LUXE_LEAD_INTAKE_ATTEMPTS,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function recordLuxeLeadIntakeAttempt(key: string) {
  const now = Date.now();
  const current = luxeLeadIntakeAttempts.get(key);
  luxeLeadIntakeAttempts.set(key, !current || current.resetAt <= now
    ? { count: 1, resetAt: now + LUXE_LEAD_INTAKE_WINDOW_MS }
    : { ...current, count: current.count + 1 });
}

export function checkMemberSignupRateLimit(key: string) {
  const now = Date.now();
  const current = memberSignupAttempts.get(key);
  if (!current || current.resetAt <= now) {
    memberSignupAttempts.set(key, { count: 0, resetAt: now + MEMBER_SIGNUP_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return {
    allowed: current.count < MAX_MEMBER_SIGNUP_ATTEMPTS,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function recordMemberSignupAttempt(key: string) {
  const now = Date.now();
  const current = memberSignupAttempts.get(key);
  memberSignupAttempts.set(key, !current || current.resetAt <= now
    ? { count: 1, resetAt: now + MEMBER_SIGNUP_WINDOW_MS }
    : { ...current, count: current.count + 1 });
}
