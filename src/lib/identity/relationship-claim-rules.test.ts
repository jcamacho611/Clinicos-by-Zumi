import { describe, expect, it, vi } from "vitest";

async function loadRules() {
  return vi.importActual<Record<string, unknown>>("@/lib/identity/relationship-claim-rules");
}

describe("relationship claim rules", () => {
  it("exposes a small allowlisted claim vocabulary", async () => {
    const rules = await loadRules();
    expect(rules.relationshipClaimTypes).toEqual([
      "organization_owner",
      "organization_admin",
      "organization_staff",
      "professional_identity",
      "organization_partner",
    ]);
    expect(rules.relationshipClaimTargetTypes).toEqual([
      "existing_organization",
      "new_organization_presence",
      "professional_profile",
    ]);
    expect(rules.relationshipClaimVerificationStatuses).toEqual([
      "submitted",
      "evidence_required",
      "in_review",
      "verified",
      "rejected",
    ]);
  });

  it("requires an existing organization target to be identified server-safely", async () => {
    const rules = await loadRules();
    const schema = rules.relationshipClaimSubmissionSchema as { parse(input: unknown): unknown };

    expect(schema.parse({
      claimType: "organization_owner",
      targetType: "existing_organization",
      targetOrganizationId: "org_123",
      claimedRoleKey: "clinic_owner",
    })).toMatchObject({ claimType: "organization_owner", targetOrganizationId: "org_123" });

    expect(() => schema.parse({
      claimType: "organization_owner",
      targetType: "existing_organization",
      claimedOrganizationName: "Not enough",
    })).toThrow();
  });

  it("requires new-presence and professional targets to match their bounded claim semantics", async () => {
    const rules = await loadRules();
    const schema = rules.relationshipClaimSubmissionSchema as { parse(input: unknown): unknown };

    expect(schema.parse({
      claimType: "organization_owner",
      targetType: "new_organization_presence",
      claimedOrganizationName: "Queens Family Medicine",
    })).toMatchObject({ targetType: "new_organization_presence" });

    expect(() => schema.parse({
      claimType: "professional_identity",
      targetType: "new_organization_presence",
      claimedOrganizationName: "Wrong target",
      targetProviderId: "provider_123",
    })).toThrow();

    expect(schema.parse({
      claimType: "professional_identity",
      targetType: "professional_profile",
      targetProviderId: "provider_123",
    })).toMatchObject({ targetType: "professional_profile", targetProviderId: "provider_123" });
  });

  it("rejects client attempts to manufacture identity, verification, reviewer, entitlement, or authority state", async () => {
    const rules = await loadRules();
    const schema = rules.relationshipClaimSubmissionSchema as { parse(input: unknown): unknown };

    for (const forbidden of [
      { personId: "person_forged" },
      { legacyUserId: "user_forged" },
      { lifecycleStatus: "active" },
      { verificationStatus: "verified" },
      { reviewedBy: "user_forged" },
      { sourceReference: "forged" },
      { entitlement: "all" },
      { authority: "owner" },
    ]) {
      expect(() => schema.parse({
        claimType: "organization_staff",
        targetType: "existing_organization",
        targetOrganizationId: "org_123",
        ...forbidden,
      })).toThrow();
    }
  });

  it("allows only deterministic review-state transitions", async () => {
    const rules = await loadRules();
    const transition = rules.assertRelationshipClaimReviewTransition as (current: string, action: string) => string;

    expect(transition("submitted", "start_review")).toBe("in_review");
    expect(transition("submitted", "request_evidence")).toBe("evidence_required");
    expect(transition("evidence_required", "start_review")).toBe("in_review");
    expect(transition("in_review", "verify")).toBe("verified");
    expect(transition("in_review", "reject")).toBe("rejected");
    expect(transition("in_review", "request_evidence")).toBe("evidence_required");
    expect(() => transition("verified", "verify")).toThrow();
    expect(() => transition("rejected", "start_review")).toThrow();
  });
});
