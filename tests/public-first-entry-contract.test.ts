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
  });

  it("records public assent through the existing server access API", () => {
    const gatePath = "src/components/public/public-access-gate.tsx";
    expect(existsSync(gatePath)).toBe(true);
    if (!existsSync(gatePath)) return;
    const gate = read(gatePath);
    expect(gate).toContain('/api/access/accept');
    expect(gate).toContain("Access, Confidentiality");
    expect(gate).toContain("accepted: true");
  });
});
