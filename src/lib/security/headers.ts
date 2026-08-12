export type SecurityHeader = { key: string; value: string };

/**
 * Conservative global browser hardening that does not assume a nonce-enabled render
 * pipeline yet. We deliberately avoid script/style source restrictions here because a
 * broken CSP that gets disabled is weaker than a smaller policy that stays enforced.
 */
export function klinikosSecurityHeaders(env: NodeJS.ProcessEnv = process.env): SecurityHeader[] {
  const production = env.NODE_ENV === "production";
  const headers: SecurityHeader[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
    {
      key: "Permissions-Policy",
      value: "accelerometer=(), autoplay=(), camera=(self), geolocation=(self), gyroscope=(), magnetometer=(), microphone=(self), payment=(self), usb=()",
    },
    {
      key: "Content-Security-Policy",
      value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests",
    },
  ];

  if (production) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" });
  }

  return headers;
}

export const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
} as const;
