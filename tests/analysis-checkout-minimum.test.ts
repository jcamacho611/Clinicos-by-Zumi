import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { salesIntakeSchema, salesQualificationSchema } from "@/lib/sales-demo-rules";

/**
 * A ready buyer must not be made to do consulting homework before paying.
 *
 * The reservation demanded ten answers ahead of checkout — role, phone, provider count,
 * location count, current vendors, monthly software spend and a repeated pain-point
 * selection on top of clinic, name and email. Creating the reservation and the
 * server-owned checkout intent reads none of the first seven.
 */

const minimumPurchase = {
  clinicName: "Northstar Family Practice",
  contactName: "Jordan Rivera",
  contactEmail: "jordan@northstar.example",
  clinicType: "Primary care" as const,
  biggestPainPoint: "follow_ups" as const,
  acknowledgesSyntheticData: true as const,
};

describe("the analysis purchase asks only for what a purchase needs", () => {
  it("accepts a reservation with clinic, name, email, type, one pain point and the acknowledgment", () => {
    const parsed = salesIntakeSchema.parse(minimumPurchase);
    expect(parsed.clinicName).toBe("Northstar Family Practice");
    // The offer key is server-owned and defaulted; the browser never names a price.
    expect(parsed.selectedOffer).toBe("private_workflow_demo");
  });

  it("leaves uncollected qualification null rather than inventing an answer", () => {
    const parsed = salesIntakeSchema.parse(minimumPurchase);
    // `providerCount: 1` for a twelve-provider clinic is a fabricated fact that would
    // flow into proposals and any later ROI claim. Absent must stay absent.
    expect(parsed.providerCount).toBeNull();
    expect(parsed.locationCount).toBeNull();
    expect(parsed.contactRole).toBeNull();
    expect(parsed.contactPhone).toBeNull();
    expect(parsed.currentSystems).toBeNull();
    expect(parsed.estimatedSoftwareSpendDollars).toBeNull();
    expect(parsed.painPoints).toBeNull();
  });

  it("still refuses a purchase without the facts a purchase genuinely needs", () => {
    for (const missing of ["clinicName", "contactName", "contactEmail", "acknowledgesSyntheticData"] as const) {
      const candidate: Record<string, unknown> = { ...minimumPurchase };
      delete candidate[missing];
      expect(salesIntakeSchema.safeParse(candidate).success, `${missing} should be required`).toBe(false);
    }
    expect(salesIntakeSchema.safeParse({ ...minimumPurchase, contactEmail: "not-an-email" }).success).toBe(false);
    // The acknowledgment is a literal true, so an unchecked box cannot slip through.
    expect(salesIntakeSchema.safeParse({ ...minimumPurchase, acknowledgesSyntheticData: false }).success).toBe(false);
  });

  it("keeps the honeypot and rejects unknown fields", () => {
    expect(salesIntakeSchema.safeParse({ ...minimumPurchase, website: "spam" }).success).toBe(false);
    expect(salesIntakeSchema.safeParse({ ...minimumPurchase, priceCents: 1 }).success).toBe(false);
  });

  it("still accepts qualification when a buyer volunteers it", () => {
    const parsed = salesIntakeSchema.parse({ ...minimumPurchase, providerCount: 12, contactPhone: "212-555-0100" });
    expect(parsed.providerCount).toBe(12);
    expect(parsed.contactPhone).toBe("212-555-0100");
  });

  it("collects the same qualification after payment, every field optional", () => {
    const empty = salesQualificationSchema.parse({});
    expect(empty.providerCount).toBeNull();
    const answered = salesQualificationSchema.parse({ providerCount: 12, locationCount: 3 });
    expect(answered.providerCount).toBe(12);
    expect(answered.locationCount).toBe(3);
  });
});

describe("the pre-payment form matches the schema", () => {
  const form = fs.readFileSync(path.join(process.cwd(), "src/components/sales/sales-intake-form.tsx"), "utf8");
  const code = form.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("no longer asks for qualification before payment", () => {
    for (const field of ["Providers", "Locations", "Current EHR", "Monthly software estimate", "Phone"]) {
      expect(code, `the form still asks for "${field}" before payment`).not.toContain(`>${field}<`);
    }
  });

  it("sends no placeholder value for a question it did not ask", () => {
    // The failure this prevents: the field leaves the form but its default stays in
    // state and is posted anyway, so the server stores `1 provider` as though answered.
    for (const field of ["providerCount", "locationCount", "currentSystems", "estimatedSoftwareSpendDollars", "contactRole", "contactPhone"]) {
      expect(code, `the form still carries ${field}`).not.toContain(field);
    }
  });

  it("keeps the three things a buyer must actually type", () => {
    expect(code).toContain("Clinic name");
    expect(code).toContain("Contact name");
    expect(code).toContain("Email");
    expect(code).toContain("acknowledgesSyntheticData");
  });

  it("inherits clinic type and pain point from the Zumi interview instead of re-asking", () => {
    expect(code).toContain("initialContext?.clinicType");
    expect(code).toContain("initialContext?.biggestPainPoint");
  });
});
