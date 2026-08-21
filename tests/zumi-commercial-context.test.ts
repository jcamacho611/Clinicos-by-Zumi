import { describe, expect, it } from "vitest";
import { canonicalContextManifest } from "@/features/zumi/canonical-context";

describe("Zumi commercial canonical context", () => {
  it("includes the current commercial canon in the founder-only retrieval allowlist", () => {
    const document = canonicalContextManifest().find((entry) => entry.path === "docs/KLINIKOS_COMMERCIAL_CANON.md");
    expect(document).toBeDefined();
    expect(document).toMatchObject({ visibility: "founder", priority: 100 });
    expect(document?.domains).toEqual(expect.arrayContaining(["canon", "commercial", "sales", "grid", "clinic_operations", "product_status"]));
  });

  it("does not accidentally make internal commercial strategy customer-safe", () => {
    const customerSafe = canonicalContextManifest().filter((entry) => entry.visibility === "customer_safe").map((entry) => entry.path);
    expect(customerSafe).toContain("docs/ZUMI_CUSTOMER_PRODUCT_CONTEXT.md");
    expect(customerSafe).not.toContain("docs/KLINIKOS_COMMERCIAL_CANON.md");
    expect(customerSafe).not.toContain("docs/CUSTOMER_FUNDED_ACCESS_MODEL.md");
  });
});
