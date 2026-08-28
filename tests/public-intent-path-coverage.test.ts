import { describe, expect, it } from "vitest";
import { resolveIntentDeterministically } from "@/lib/orchestration/intent-engine";
import { resolvePublicLivingIntent } from "@/lib/orchestration/public-living-intent";

const cases = [
  ["I want extra work Friday", "find-extra-work", "grid", "/grid"],
  ["I want to become an injector", "become-grid-ready", "edu", "/edu"],
  ["I need a clinical placement", "student-clinical-placement", "edu", "/edu"],
  ["I need a preceptor", "student-clinical-placement", "edu", "/edu"],
  ["I want to work independently", "clinician-independent-practice", "clinic", "/dashboard"],
  ["I want to own a clinic", "provider-to-clinic-owner", "clinic", "/dashboard"],
  ["I need a nurse this weekend", "fill-staffing-need", "staffing", "/grid"],
  ["We have unused capacity", "clinic-monetize-capacity", "grid", "/grid"],
  ["Our clinic is disorganized", "clinic-operational-optimization", "clinic", "/dashboard"],
  ["I want to add a service", "clinic-add-service", "clinic", "/dashboard"],
  ["We are losing money", "clinic-improve-revenue", "revenue", "/crm"],
  ["I want a second location", "clinic-expand-locations", "clinic", "/dashboard"],
  ["We have stuck referrals", "fix-referral-leakage", "referrals", "/referrals"],
  ["We want students", "organization-education-partner", "edu", "/edu"],
  ["Our students need clinical sites", "school-placement-network", "edu", "/edu"],
  ["I want to be a preceptor", "educator-preceptor-opportunity", "edu", "/edu"],
  ["I need better opportunities", "grid-higher-value-opportunity", "grid", "/grid"],
  ["I need an appointment", "patient-find-care", "patient", "/portal"],
  ["I want to start another clinic", "launch-another-organization", "clinic", "/dashboard"],
] as const;

describe("Public Zumi deterministic Path coverage", () => {
  it.each(cases)("maps %s through %s to the intended public destination", (prompt, pathId, key, href) => {
    const deterministic = resolveIntentDeterministically(prompt);
    expect(deterministic.candidatePathIds[0]).toBe(pathId);

    const publicResolution = resolvePublicLivingIntent(prompt);
    expect(publicResolution.kind).toBe("route");
    expect(publicResolution.destination).toMatchObject({ key, href });
  });
});
