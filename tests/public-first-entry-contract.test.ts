import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("public first-entry experience", () => {
  it("gates interactive Klinikos before the Zumi living home", () => {
    const page = read("src/app/page.tsx");
    expect(page).toContain("PublicPlatformShell");
    expect(page).toContain("PublicLivingGateway");
  });

  it("does not stack marketing-document sections beneath the living home", () => {
    const page = read("src/app/page.tsx");
    expect(page).not.toContain("ProductEvidenceSection");
    expect(page).not.toContain("EcosystemHierarchy");
    expect(page).not.toContain("PublicTrustFooter");
  });

  it("records public assent through the existing server access API", () => {
    const gatePath = "src/components/public/public-access-gate.tsx";
    expect(existsSync(gatePath)).toBe(true);
    if (!existsSync(gatePath)) return;
    const gate = read(gatePath);
    expect(gate).toContain('/api/access/accept');
    expect(gate).toContain("Access, Confidentiality");
    expect(gate).toContain("accepted: true");
    expect(gate).toContain('role="dialog"');
    expect(gate).toContain('aria-modal="true"');
  });

  it("makes Zumi the point of entry instead of opening with a sales document", () => {
    const gateway = read("src/components/marketing/public-living-gateway.tsx");
    expect(gateway).toContain("What needs to happen?");
    expect(gateway).not.toContain("KLINIKOS_ECONOMIC_THESIS");
    expect(gateway).not.toContain("KLINIKOS_SUPPORTING");
    expect(gateway).not.toContain("See what Klinikos would replace");
  });

  it("contains the rose artwork inside the living-home viewport instead of fixing it to the browser", () => {
    const gateway = read("src/components/marketing/public-living-gateway.tsx");
    expect(gateway).toContain("rose-vignette pointer-events-none absolute inset-0");
    expect(gateway).toContain("rose-atmosphere pointer-events-none absolute inset-0");
    expect(gateway).not.toContain("rose-vignette pointer-events-none fixed inset-0");
    expect(gateway).not.toContain("rose-atmosphere pointer-events-none fixed inset-0");
  });
});
