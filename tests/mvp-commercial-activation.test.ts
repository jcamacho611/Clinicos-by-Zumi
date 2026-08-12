import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { clinicActivationSchema, clinicCheckoutRequestSchema } from "@/lib/commercial/clinic-activation-rules";
import { clinicPlans } from "@/lib/commercial/klinikos-commercial";
import { getCommercialProduct } from "@/lib/commercial/product-catalog";
import { findBannedPublicCopy } from "@/lib/design/command-system";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("Klinikos MVP commercial activation", () => {
  it("keeps public clinic plan prices server-owned and aligned with approved pricing", () => {
    expect(getCommercialProduct("clinic_core")?.priceCents).toBe(clinicPlans.core.monthlyPriceCents);
    expect(getCommercialProduct("clinic_growth")?.priceCents).toBe(clinicPlans.growth.monthlyPriceCents);
    expect(getCommercialProduct("clinic_scale")?.priceCents).toBe(clinicPlans.scale.monthlyPriceCents);
    expect(getCommercialProduct("clinic_core")?.publicPurchasable).toBe(true);
    expect(getCommercialProduct("clinic_operator")?.publicPurchasable).toBe(false);
  });

  it("accepts only the named purchasable clinic plans at the activation desk boundary", () => {
    expect(clinicCheckoutRequestSchema.safeParse({ clinicName: "Northstar Clinic", email: "owner@example.com", productKey: "clinic_core" }).success).toBe(true);
    expect(clinicCheckoutRequestSchema.safeParse({ clinicName: "Northstar Clinic", email: "owner@example.com", productKey: "clinic_operator" }).success).toBe(false);
    expect(clinicCheckoutRequestSchema.safeParse({ clinicName: "Northstar Clinic", email: "owner@example.com", productKey: "grid_professional" }).success).toBe(false);
  });

  it("requires a strong password, explicit terms, and synthetic-data boundary during owner activation", () => {
    const base = {
      token: "signed-token-placeholder-with-more-than-twenty-characters",
      ownerName: "Jordan Ellis",
      password: "Strong-Clinic-2026",
      clinicType: "Primary care",
      locationName: "Main clinic",
      city: "Brooklyn",
      state: "ny",
      timezone: "America/New_York",
      teamSize: "1-5",
      primaryGoal: "Coordinate clinic operations",
      currentSystems: "Existing EHR and billing vendor",
      migrationExpectation: "needs_review",
      communicationsState: "existing_vendor",
      acceptTerms: true,
      syntheticDataOnly: true,
    } as const;
    expect(clinicActivationSchema.safeParse(base).success).toBe(true);
    expect(clinicActivationSchema.safeParse({ ...base, password: "weakpassword" }).success).toBe(false);
    expect(clinicActivationSchema.safeParse({ ...base, acceptTerms: false }).success).toBe(false);
    expect(clinicActivationSchema.safeParse({ ...base, syntheticDataOnly: false }).success).toBe(false);
  });

  it("does not expose the legacy public organization endpoint as a production free-access path", () => {
    const source = read("src/app/api/onboarding/organizations/route.ts");
    expect(source).toContain('process.env.NODE_ENV !== "production"');
    expect(source).toContain("KLINIKOS_SYNTHETIC_WORKSPACE_CREATION");
    expect(source).toContain("productionAccessActivated: false");
  });

  it("redirects the old capability encyclopedia into the plain-English product explanation", () => {
    const source = read("src/app/capabilities/page.tsx");
    expect(source).toContain('permanentRedirect("/how-it-works")');
    expect(source.toLowerCase()).not.toContain("capability registry");
  });

  it("treats legacy master-brand phrases as public copy violations", () => {
    expect(findBannedPublicCopy("Klinikos by Zumi")).toContain("klinikos by zumi");
    expect(findBannedPublicCopy("Clinicos OS")).toContain("clinicos os");
  });
});
