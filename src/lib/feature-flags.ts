/**
 * Feature Flag Utility
 * Controls gating behavior during staged rollout
 * Usage: if (isFeatureEnabled('ENABLE_EMAIL_VERIFICATION')) { ... }
 */

export type FeatureFlagKey =
  | 'ENABLE_ACCESS_GATE'
  | 'ENABLE_EMAIL_VERIFICATION'
  | 'ENABLE_APPLICATION_REVIEW'
  | 'ENABLE_RATE_LIMITING'
  | 'ENABLE_CAPTCHA'
  | 'FORCE_HTTPS'
  | 'ENCRYPT_AUDIT_LOGS';

interface FeatureFlagConfig {
  name: FeatureFlagKey;
  default: boolean;
  description: string;
}

const featureFlagDefaults: Record<FeatureFlagKey, FeatureFlagConfig> = {
  ENABLE_ACCESS_GATE: {
    name: 'ENABLE_ACCESS_GATE',
    default: false,
    description: 'Enable access gating flow requiring approval',
  },
  ENABLE_EMAIL_VERIFICATION: {
    name: 'ENABLE_EMAIL_VERIFICATION',
    default: false,
    description: 'Require email verification on signup',
  },
  ENABLE_APPLICATION_REVIEW: {
    name: 'ENABLE_APPLICATION_REVIEW',
    default: false,
    description: 'Require admin approval of clinic applications',
  },
  ENABLE_RATE_LIMITING: {
    name: 'ENABLE_RATE_LIMITING',
    default: false,
    description: 'Enable rate limiting on auth endpoints',
  },
  ENABLE_CAPTCHA: {
    name: 'ENABLE_CAPTCHA',
    default: false,
    description: 'Require CAPTCHA on signup/login forms',
  },
  FORCE_HTTPS: {
    name: 'FORCE_HTTPS',
    default: true,
    description: 'Force all traffic to HTTPS (TLS)',
  },
  ENCRYPT_AUDIT_LOGS: {
    name: 'ENCRYPT_AUDIT_LOGS',
    default: true,
    description: 'Encrypt audit logs at rest',
  },
};

/**
 * Check if a feature flag is enabled
 * @param flag - Feature flag key
 * @returns boolean - True if enabled
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  const envValue = process.env[flag];
  
  // If env var exists, parse it as boolean
  if (envValue !== undefined) {
    return envValue.toLowerCase() === 'true' || envValue === '1';
  }
  
  // Fall back to default
  const config = featureFlagDefaults[flag];
  return config?.default ?? false;
}

/**
 * Get all feature flag values (for debugging/admin panel)
 */
export function getAllFeatureFlags(): Record<FeatureFlagKey, boolean> {
  const flags: Record<string, boolean> = {};
  
  Object.keys(featureFlagDefaults).forEach((key) => {
    flags[key] = isFeatureEnabled(key as FeatureFlagKey);
  });
  
  return flags as Record<FeatureFlagKey, boolean>;
}

/**
 * Get feature flag metadata (for admin UI)
 */
export function getFeatureFlagMetadata() {
  return Object.entries(featureFlagDefaults).map(([key, config]) => ({
    key,
    name: config.name,
    enabled: isFeatureEnabled(config.name),
    default: config.default,
    description: config.description,
  }));
}

export default {
  isFeatureEnabled,
  getAllFeatureFlags,
  getFeatureFlagMetadata,
};
