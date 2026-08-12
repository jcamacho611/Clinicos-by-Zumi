import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { clinicActivationDraftFieldsSchema, clinicActivationSchema, clinicCheckoutRequestSchema } from "@/lib/commercial/clinic-activation-rules";
import { clinicPlans } from "@/lib/commercial/klinikos-commercial";
import { getCommercialProduct } from "@/lib/commercial/product-catalog";
import { findBannedPublicCopy } from "@/lib/design/command-system";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

function publicPageFiles(root = path.join(process.cwd(), "src", "app")): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "api" || entry.name === "(platform)") return [];
      return publicPageFiles(absolute);
    }
    return entry.name === "page.tsx" ? [absolute] : [];
  });
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

  it("persists only non-secret resumable onboarding fields", () => {
    const parsed = clinicActivationDraftFieldsSchema.parse({
      ownerName: "Jordan Ellis",
      clinicType: "Primary care",
      locationName: "Main clinic",
      city: "Brooklyn",
      state: "ny",
      timezone: "America/New_York",
      teamSize: "1-5",
      primaryGoal: "Coordinate clinic operations",
      currentSystems: "Existing EHR",
      migrationExpectation: "needs_review",
      communicationsState: "existing_vendor",
      password: "must-not-survive",
      acceptTerms: true,
      organizationId: "must-not-survive",
      role: "clinic_owner",
      productKey: "clinic_scale",
    });
    expect(parsed.state).toBe("NY");
    expect(parsed).not.toHaveProperty("password");
    expect(parsed).not.toHaveProperty("acceptTerms");
    expect(parsed).not.toHaveProperty("organizationId");
    expect(parsed).not.toHaveProperty("role");
    expect(parsed).not.toHaveProperty("productKey");

    const repository = read("src/lib/commercial/clinic-activation-draft.ts");
    const route = read("src/app/api/onboarding/activate/route.ts");
    expect(repository).toContain("activationDraft");
    expect(repository).toContain("verifyClinicActivationToken");
    expect(route).toContain("export async function PATCH");
    expect(route).toContain("clinicActivationDraftSchema");
  });

  it("does not expose the legacy public organization endpoint as a production free-access path", () => {
    const source = read("src/app/api/onboarding/organizations/route.ts");
    expect(source).toContain('process.env.NODE_ENV !== "production"');
    expect(source).toContain("KLINIKOS_SYNTHETIC_WORKSPACE_CREATION");
    expect(source).toContain("productionAccessActivated: false");
  });

  it("requires exact-value GoDaddy paylinks for Core, Growth, and Scale instead of falling back to the audit link", () => {
    const source = read("src/lib/commercial/payment-connectors/godaddy.ts");
    const env = read(".env.example");
    expect(source).toContain('clinic_core: "KLINIKOS_GODADDY_CORE_PAYLINK"');
    expect(source).toContain('clinic_growth: "KLINIKOS_GODADDY_GROWTH_PAYLINK"');
    expect(source).toContain('clinic_scale: "KLINIKOS_GODADDY_SCALE_PAYLINK"');
    expect(source).toContain('if (product.key === "operational_audit") return KLINIKOS_GODADDY_PAYLINK || null;');
    expect(source).toContain("const variable = clinicPlanPaylinkEnv[product.key]");
    expect(env).toContain('KLINIKOS_GODADDY_CORE_PAYLINK=""');
    expect(env).toContain('KLINIKOS_GODADDY_GROWTH_PAYLINK=""');
    expect(env).toContain('KLINIKOS_GODADDY_SCALE_PAYLINK=""');
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

  it("keeps banned commercial and legacy-brand language out of every public App Router page", () => {
    const violations = publicPageFiles().flatMap((absolute) => {
      const relative = path.relative(process.cwd(), absolute).replaceAll(path.sep, "/");
      return findBannedPublicCopy(fs.readFileSync(absolute, "utf8")).map((phrase) => `${relative}: ${phrase}`);
    });
    expect(violations).toEqual([]);
  });
});
