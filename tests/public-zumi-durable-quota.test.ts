import { describe, expect, it } from "vitest";
import {
  PUBLIC_ZUMI_QUOTA_ATTESTATION_HEADER,
  publicZumiDurableQuotaAttested,
} from "@/features/zumi/public-quota-attestation";

const secret = "0123456789abcdef0123456789abcdef";

function request(headers: Record<string, string> = {}) {
  return new Request("https://www.klinikos.io/api/zumi/public", { headers });
}

describe("public Zumi durable quota attestation", () => {
  it("fails closed when durable quota mode is not explicitly verified", () => {
    expect(publicZumiDurableQuotaAttested(request({
      [PUBLIC_ZUMI_QUOTA_ATTESTATION_HEADER]: secret,
    }), {
      PUBLIC_ZUMI_DURABLE_QUOTA_ATTESTATION_SECRET: secret,
    })).toBe(false);
  });

  it("fails closed when the attestation secret is missing, short, or wrong", () => {
    expect(publicZumiDurableQuotaAttested(request(), {
      PUBLIC_ZUMI_DURABLE_QUOTA_MODE: "verified_edge",
      PUBLIC_ZUMI_DURABLE_QUOTA_ATTESTATION_SECRET: secret,
    })).toBe(false);

    expect(publicZumiDurableQuotaAttested(request({
      [PUBLIC_ZUMI_QUOTA_ATTESTATION_HEADER]: "too-short",
    }), {
      PUBLIC_ZUMI_DURABLE_QUOTA_MODE: "verified_edge",
      PUBLIC_ZUMI_DURABLE_QUOTA_ATTESTATION_SECRET: "too-short",
    })).toBe(false);

    expect(publicZumiDurableQuotaAttested(request({
      [PUBLIC_ZUMI_QUOTA_ATTESTATION_HEADER]: "fedcba9876543210fedcba9876543210",
    }), {
      PUBLIC_ZUMI_DURABLE_QUOTA_MODE: "verified_edge",
      PUBLIC_ZUMI_DURABLE_QUOTA_ATTESTATION_SECRET: secret,
    })).toBe(false);
  });

  it("accepts only the exact server-secret attestation after verified edge quota admission", () => {
    expect(publicZumiDurableQuotaAttested(request({
      [PUBLIC_ZUMI_QUOTA_ATTESTATION_HEADER]: secret,
    }), {
      PUBLIC_ZUMI_DURABLE_QUOTA_MODE: "verified_edge",
      PUBLIC_ZUMI_DURABLE_QUOTA_ATTESTATION_SECRET: secret,
    })).toBe(true);
  });

  it("does not treat spoofed forwarded-IP headers as paid-inference authority", () => {
    expect(publicZumiDurableQuotaAttested(request({
      "x-forwarded-for": "203.0.113.44",
      "x-real-ip": "203.0.113.44",
    }), {
      PUBLIC_ZUMI_DURABLE_QUOTA_MODE: "verified_edge",
      PUBLIC_ZUMI_DURABLE_QUOTA_ATTESTATION_SECRET: secret,
    })).toBe(false);
  });
});
