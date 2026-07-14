import { describe, expect, it } from "vitest";
import {
  breakGlassRequestSchema,
  canUseBreakGlass,
  getAccessGrantState,
  grantAllowsAccess,
  isActiveNetworkRelationship,
  isActiveSharingAgreement,
  roleAllowsSharedCategories,
  reviewRecordRequestSchema,
} from "@/lib/network-access-rules";

const now = new Date("2026-07-14T12:00:00.000Z");

describe("connected-care access rules", () => {
  it("requires an active relationship and approved purpose", () => {
    const connection = {
      sourceOrganizationId: "org-bfm",
      targetOrganizationId: "org-luxe",
      status: "active",
      allowedPurposes: ["treatment"],
      activatedAt: new Date("2026-07-01T12:00:00.000Z"),
      suspendedAt: null,
    };

    expect(isActiveNetworkRelationship(connection, "org-bfm", "org-luxe", "treatment")).toBe(true);
    expect(isActiveNetworkRelationship(connection, "org-bfm", "org-luxe", "payment")).toBe(false);
    expect(isActiveNetworkRelationship({ ...connection, suspendedAt: now }, "org-bfm", "org-luxe", "treatment")).toBe(false);
  });

  it("enforces directional, time-bound, category-limited sharing agreements", () => {
    const agreement = {
      sourceOrganizationId: "org-bfm",
      targetOrganizationId: "org-luxe",
      status: "active",
      allowedPurposes: ["treatment"],
      dataCategories: ["demographics", "allergies"],
      effectiveAt: new Date("2026-07-01T00:00:00.000Z"),
      expiresAt: new Date("2026-08-01T00:00:00.000Z"),
    };

    expect(isActiveSharingAgreement(agreement, "org-bfm", "org-luxe", "treatment", ["demographics"], now)).toBe(true);
    expect(isActiveSharingAgreement(agreement, "org-bfm", "org-luxe", "treatment", ["medications"], now)).toBe(false);
    expect(isActiveSharingAgreement(agreement, "org-luxe", "org-bfm", "treatment", ["demographics"], now)).toBe(false);
  });

  it("rejects expired, revoked, wrong-tenant, and over-broad grants", () => {
    const grant = {
      organizationId: "org-bfm",
      patientId: "pt-1001",
      granteeOrganizationId: "org-luxe",
      granteeUserId: null,
      purposeOfUse: "treatment",
      dataCategories: ["demographics", "allergies"],
      accessLevel: "read_only",
      startsAt: new Date("2026-07-01T00:00:00.000Z"),
      expiresAt: new Date("2026-08-01T00:00:00.000Z"),
      revokedAt: null,
    };
    const request = {
      sourceOrganizationId: "org-bfm",
      requestingOrganizationId: "org-luxe",
      requestingUserId: "user-luxe",
      patientId: "pt-1001",
      purpose: "treatment" as const,
      categories: ["demographics", "allergies"] as const,
      now,
    };

    expect(grantAllowsAccess(grant, request)).toBe(true);
    expect(grantAllowsAccess(grant, { ...request, requestingOrganizationId: "org-other" })).toBe(false);
    expect(grantAllowsAccess(grant, { ...request, categories: ["medications"] })).toBe(false);
    expect(getAccessGrantState({ ...grant, expiresAt: now }, now)).toBe("expired");
    expect(getAccessGrantState({ ...grant, revokedAt: now }, now)).toBe("revoked");
  });

  it("requires explicit, meaningful emergency reasons and privileged roles", () => {
    expect(breakGlassRequestSchema.safeParse({ sourceOrganizationId: "org-bfm", patientId: "pt-1", reason: "urgent" }).success).toBe(false);
    expect(breakGlassRequestSchema.safeParse({ sourceOrganizationId: "org-bfm", patientId: "pt-1", reason: "Emergency treatment while patient is unresponsive." }).success).toBe(true);
    expect(canUseBreakGlass("provider")).toBe(true);
    expect(canUseBreakGlass("front_desk")).toBe(false);
    expect(reviewRecordRequestSchema.safeParse({ decision: "approve", reason: "okay" }).success).toBe(false);
  });

  it("applies role boundaries after organization and grant checks", () => {
    expect(roleAllowsSharedCategories("provider", "treatment", ["medications", "allergies"])).toBe(true);
    expect(roleAllowsSharedCategories("front_desk", "treatment", ["demographics"])).toBe(true);
    expect(roleAllowsSharedCategories("front_desk", "treatment", ["medications"])).toBe(false);
    expect(roleAllowsSharedCategories("biller", "payment", ["demographics"])).toBe(true);
    expect(roleAllowsSharedCategories("biller", "treatment", ["demographics"])).toBe(false);
    expect(roleAllowsSharedCategories("viewer", "treatment", ["demographics"])).toBe(false);
  });
});
