import "server-only";

import { timingSafeEqual } from "node:crypto";

export const PUBLIC_ZUMI_QUOTA_ATTESTATION_HEADER = "x-klinikos-public-zumi-quota-attestation";

export type PublicZumiQuotaEnv = Record<string, string | undefined>;

function configured(env: PublicZumiQuotaEnv, name: string) {
  const value = env[name];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Paid anonymous inference is allowed only after a shared/durable edge or data-layer
 * quota has already admitted the request and attached an unforgeable server-secret
 * attestation. Browser-controlled forwarded-IP headers are deliberately irrelevant.
 *
 * This function does not implement the quota itself. It verifies evidence that the
 * configured durable authority already did. Missing configuration fails closed.
 */
export function publicZumiDurableQuotaAttested(
  request: Request,
  env: PublicZumiQuotaEnv = process.env,
) {
  if (configured(env, "PUBLIC_ZUMI_DURABLE_QUOTA_MODE") !== "verified_edge") return false;

  const expected = configured(env, "PUBLIC_ZUMI_DURABLE_QUOTA_ATTESTATION_SECRET");
  const provided = request.headers.get(PUBLIC_ZUMI_QUOTA_ATTESTATION_HEADER)?.trim() ?? "";

  // A short shared secret is too easy to guess and should never authorize paid usage.
  if (expected.length < 32 || !provided) return false;

  const expectedBytes = Buffer.from(expected, "utf8");
  const providedBytes = Buffer.from(provided, "utf8");
  if (expectedBytes.length !== providedBytes.length) return false;

  return timingSafeEqual(expectedBytes, providedBytes);
}
