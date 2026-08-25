import { describe, expect, it } from "vitest";
import { publicCapabilityRegistry } from "@/lib/public-capability-registry";

describe("public capability discovery registry", () => {
  it("keeps public capability ids and canonical routes unique", () => {
    const ids = publicCapabilityRegistry.map((item) => item.id);
    const routes = publicCapabilityRegistry.map((item) => item.canonicalRoute);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("requires every public capability to have a real discovery intent and CTA", () => {
    for (const item of publicCapabilityRegistry) {
      if (item.exposure !== "PUBLIC_REQUIRED") continue;

      expect(item.canonicalRoute.startsWith("/")).toBe(true);
      expect(item.label.length).toBeGreaterThan(2);
      expect(item.primaryIntent.length).toBeGreaterThan(15);
      expect(item.primaryCta.length).toBeGreaterThan(2);
      expect(item.personas.length).toBeGreaterThan(0);
      expect(item.connectedDomains.length).toBeGreaterThan(0);
    }
  });

  it("treats telemedicine as a cross-cutting capability rather than buried video", () => {
    const telemedicine = publicCapabilityRegistry.find((item) => item.id === "telemedicine");

    expect(telemedicine).toBeDefined();
    expect(telemedicine?.canonicalRoute).toBe("/telemedicine");
    expect(telemedicine?.exposure).toBe("PUBLIC_REQUIRED");
    expect(telemedicine?.connectedDomains).toEqual(
      expect.arrayContaining([
        "scheduling",
        "patient",
        "identity",
        "consent",
        "insurance",
        "care",
        "coding",
        "revenue",
        "communications",
      ]),
    );
  });

  it("covers the major ecosystem acquisition families", () => {
    const ids = new Set(publicCapabilityRegistry.map((item) => item.id));

    for (const id of [
      "ehr-emr",
      "telemedicine",
      "medical-scheduling",
      "patient-portal",
      "front-desk-automation",
      "healthcare-crm",
      "insurance-eligibility",
      "prior-authorization",
      "medical-coding",
      "medical-billing",
      "revenue-cycle",
      "lab-results",
      "medical-imaging",
      "referrals",
      "medications",
      "population-health",
      "value-based-care",
      "grid",
      "provider-credentialing",
      "edu",
      "no-fault",
      "med-spa",
      "inventory",
      "practice-launch",
      "enterprise",
      "interoperability",
      "developer-platform",
      "remote-monitoring",
      "research",
      "public-health",
    ]) {
      expect(ids.has(id), `missing capability ${id}`).toBe(true);
    }
  });
});
