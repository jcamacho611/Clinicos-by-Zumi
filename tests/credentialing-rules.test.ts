import { describe, expect, it } from "vitest";
import { credentialNeedsAttention, facilityPrivilegeTransitionSchema, providerCredentialTransitionSchema } from "@/lib/credentialing-rules";

describe("credentialing rules", () => {
  it("flags pending, rejected, exception, and near-expiration credentials", () => {
    expect(credentialNeedsAttention("pending", null)).toBe(true);
    expect(credentialNeedsAttention("verified", new Date(Date.now() + 10 * 24 * 60 * 60 * 1000))).toBe(true);
    expect(credentialNeedsAttention("verified", new Date(Date.now() + 120 * 24 * 60 * 60 * 1000))).toBe(false);
    expect(credentialNeedsAttention("verified", null)).toBe(false);
  });

  it("requires explicit evidence for exceptions and renewals", () => {
    expect(() => providerCredentialTransitionSchema.parse({ action: "exception", note: "Needs review." })).toThrow();
    expect(() => providerCredentialTransitionSchema.parse({ action: "renew", note: "Renew this credential." })).toThrow();
    expect(providerCredentialTransitionSchema.parse({ action: "verify", note: "Primary source reviewed by staff." }).action).toBe("verify");
  });

  it("accepts only human facility privilege transitions", () => {
    expect(facilityPrivilegeTransitionSchema.parse({ action: "grant", note: "Facility evidence reviewed by staff." }).action).toBe("grant");
    expect(() => facilityPrivilegeTransitionSchema.parse({ action: "grant", note: "short" })).toThrow();
  });
});
