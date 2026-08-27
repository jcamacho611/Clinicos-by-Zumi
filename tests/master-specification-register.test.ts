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

  it("locks the founder-approved protected-app sequence before authenticated Zumi", () => {
    const enter = master.indexOf("ENTER KLINIKOS");
    const airlock = master.indexOf(
      "PROTECTED ACCESS TERMS + CONFIDENTIALITY / IP / RESTRICTED-USE AIRLOCK",
      enter,
    );
    const identity = master.indexOf("SIGN IN OR CREATE ONE KLINIKOS IDENTITY", airlock);
    const bind = master.indexOf(
      "BIND AGREEMENT ACCEPTANCE TO AUTHENTICATED IDENTITY / SESSION",
      identity,
    );
    const restore = master.indexOf(
      "RESTORE SAFE ENTRY ROUTE / RETURN-TO / REFERRAL / INVITATION CONTEXT",
      bind,
    );
    const zumi = master.indexOf("AUTHENTICATED ZUMI INTRODUCTION", restore);
    const envelope = master.indexOf("ACTIVE EXPERIENCE ENVELOPE", zumi);
    const engine = master.indexOf("EXPERIENCE ENGINE", envelope);

    expect(enter).toBeGreaterThanOrEqual(0);
    expect(airlock).toBeGreaterThan(enter);
    expect(identity).toBeGreaterThan(airlock);
    expect(bind).toBeGreaterThan(identity);
    expect(restore).toBeGreaterThan(bind);
    expect(zumi).toBeGreaterThan(restore);
    expect(envelope).toBeGreaterThan(zumi);
    expect(engine).toBeGreaterThan(envelope);
    expect(master).toContain("Do not require a permanent persona choice.");
  });

  it("requires prototype statements to resolve into real business architecture", () => {
    expect(master).toContain("KLINIKOS-PROTOTYPE-001");
    expect(master).toContain(
      "What real identity, relationship, authority, workflow, evidence, financial, network, clinical, memory, and data infrastructure would make this statement true?",
    );
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