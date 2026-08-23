import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

const supreme = read("docs/KLINIKOS_SUPREME_ARCHITECTURE_CANON.md");
const source = read("docs/SOURCE_OF_TRUTH.md");
const index = read("docs/KLINIKOS_ARCHITECTURE_INDEX.md");
const agents = read("AGENTS.md");

describe("Klinikos Supreme Architecture Canon", () => {
  it("keeps one shared substrate and one lifelong identity fabric", () => {
    expect(supreme).toContain("ONE REPO · ONE SHARED SUBSTRATE · ONE IDENTITY FABRIC");
    expect(supreme).toContain("One real person must be capable of remaining one Klinikos person for decades");
    expect(supreme).toContain("Healthcare Relationship Graph Law");
  });

  it("keeps deterministic authority above profiles, AI, payment, and education evidence", () => {
    expect(supreme).toContain("Authority Law");
    expect(supreme).toContain("No UI state, public profile, Grid listing, EDU completion, AI recommendation, owner title, payment status or uploaded credential may bypass server authority");
    expect(supreme).toContain("Zumi may never become authority for identity, tenant isolation, RBAC, credential validity, privileges, eligibility, clinical signing, medication authority, payment, settlement, legal acceptance or security policy");
  });

  it("keeps Current Visit and evidence-based longitudinal change canonical", () => {
    expect(supreme).toContain("Current Visit is the primary clinician convergence experience");
    expect(supreme).toContain("Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit");
    expect(supreme).toContain("INITIAL → PRIOR → CURRENT");
  });

  it("keeps Grid and Commerce on one shared transaction substrate", () => {
    expect(supreme).toContain("Grid is the universal healthcare relationship, resource, capacity, opportunity, matching and transaction network");
    expect(supreme).toContain("Commerce OS is not a second marketplace");
    expect(supreme).toContain("Do not create separate parallel transaction engines for space, workforce, education, services and products");
  });

  it("keeps financial, pricing and integration truth evidence-based", () => {
    expect(supreme).toContain("Financial OS is the single economic-truth substrate");
    expect(supreme).toContain("Klinikos must not have one universal take rate");
    expect(supreme).toContain("Never call an integration live because code, credentials, an adapter or a sandbox exists");
  });

  it("keeps frontend simplicity and server confidentiality permanent", () => {
    expect(supreme).toContain("BACKEND COMPLEXITY MAY INCREASE. FRONTEND PERCEIVED COMPLEXITY MUST DECREASE");
    expect(supreme).toContain("Anything that must remain confidential remains server-side");
    expect(supreme).toContain("No-Customer-Fork Law");
  });

  it("is wired into repository precedence and agent read order", () => {
    expect(source).toContain("KLINIKOS_SUPREME_ARCHITECTURE_CANON.md");
    expect(index).toContain("KLINIKOS_SUPREME_ARCHITECTURE_CANON.md");
    expect(agents).toContain("KLINIKOS_SUPREME_ARCHITECTURE_CANON.md");
  });
});