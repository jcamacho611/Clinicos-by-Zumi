import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MASTER = "docs/KLINIKOS_MASTER_CANON.md";
const AUTHORITY = "docs/KLINIKOS_AUTHORITY_MAP.yaml";
const SOURCE_POINTER = "docs/SOURCE_OF_TRUTH.md";
const ARCHITECTURE_INDEX = "docs/KLINIKOS_ARCHITECTURE_INDEX.md";
const LEGACY_MASTER = "docs/CLINICOS_MASTER_CANON.md";
const OLD_MASTER_SPEC = "docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md";

const master = readFileSync(MASTER, "utf8");
const authority = readFileSync(AUTHORITY, "utf8");
const sourcePointer = readFileSync(SOURCE_POINTER, "utf8");
const architectureIndex = readFileSync(ARCHITECTURE_INDEX, "utf8");
const legacyMaster = readFileSync(LEGACY_MASTER, "utf8");
const oldMasterSpec = readFileSync(OLD_MASTER_SPEC, "utf8");

describe("unified Klinikos Master Canon authority", () => {
  it("has exactly one declared active product authority", () => {
    expect(existsSync(MASTER)).toBe(true);
    expect(master).toContain("SOLE PRODUCT / ARCHITECTURE / BUSINESS / EXPERIENCE AUTHORITY");
    expect(authority).toContain("file: docs/KLINIKOS_MASTER_CANON.md");
    expect(authority).toContain("status: ACTIVE");
    expect(authority).toContain("may_be_overridden_by_specialist_docs: false");
  });

  it("keeps implementation truth separate from product direction", () => {
    expect(master).toContain("Current verified implementation determines what exists today");
    expect(authority).toContain("question: what_exists_today");
    expect(authority).toContain("current_code");
    expect(authority).toContain("verified_runtime_evidence");
  });

  it("locks the protected-access airlock before Living Home and Zumi", () => {
    const airlock = master.indexOf("PROTECTED ACCESS TERMS + CONFIDENTIALITY / IP / RESTRICTED-USE AIRLOCK");
    const enter = master.indexOf("ENTER KLINIKOS", airlock);
    const living = master.indexOf("LIVING HOME - WHAT NEEDS TO HAPPEN?", enter);
    const zumi = master.indexOf("ZUMI CONVERSATION", living);
    const signup = master.indexOf("ACCOUNT VALUE TRIGGER", zumi);

    expect(airlock).toBeGreaterThanOrEqual(0);
    expect(enter).toBeGreaterThan(airlock);
    expect(living).toBeGreaterThan(enter);
    expect(zumi).toBeGreaterThan(living);
    expect(signup).toBeGreaterThan(zumi);
  });

  it("requires prototype statements to resolve into real business architecture", () => {
    expect(master).toContain("KLINIKOS-PROTOTYPE-001");
    expect(master).toContain("What real identity, relationship, authority, workflow, evidence, financial, network, and data infrastructure would make this statement true?");
    expect(master).toContain("EDU");
    expect(master).toContain("COMPETENCY EVIDENCE");
    expect(master).toContain("WORK");
    expect(master).toContain("EXPERIENCE EVIDENCE");
  });

  it("locks the OpenAI/Zumi direction without making the model authority", () => {
    expect(master).toContain("KLINIKOS-OPENAI-001");
    expect(master).toContain("primary production intelligence platform for Zumi");
    expect(master).toContain("OpenAI supplies intelligence where appropriate. Klinikos supplies");
    expect(master).toContain("Provider abstraction remains intact");
  });

  it("demotes the prior source/index/master documents instead of keeping competing authorities", () => {
    expect(sourcePointer).toContain("COMPATIBILITY POINTER - NOT A PARALLEL CANON");
    expect(architectureIndex).toContain("NAVIGATION INDEX - NOT A COMPETING AUTHORITY");
    expect(legacyMaster).toContain("SUPERSEDED - HISTORICAL REFERENCE ONLY");
    expect(oldMasterSpec).toContain("SUPERSEDED AS PARALLEL AUTHORITY");
  });

  it("makes accepted new discoveries merge forward instead of spawning another master", () => {
    expect(master).toContain("NEW INFORMATION");
    expect(master).toContain("UPDATE THIS MASTER CANON");
    expect(authority).toContain("NEW_PARALLEL_SUPREME_CANON");
    expect(authority).toContain("NEW_PARALLEL_MASTER_CANON");
    expect(authority).toContain("NEW_PARALLEL_SOURCE_OF_TRUTH");
  });
});
