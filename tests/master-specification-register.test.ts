import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MASTER_CANON = "docs/KLINIKOS_MASTER_CANON.md";
const AUTHORITY_MAP = "docs/KLINIKOS_AUTHORITY_MAP.yaml";
const INVENTORY = "docs/governance/KLINIKOS_DOCUMENT_AUTHORITY_INVENTORY.md";
const PREDECESSOR_SPEC = "docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md";

const master = readFileSync(MASTER_CANON, "utf8");
const authority = readFileSync(AUTHORITY_MAP, "utf8");
const inventory = readFileSync(INVENTORY, "utf8");

describe("Klinikos document authority register", () => {
  it("keeps exactly one declared supreme narrative authority", () => {
    expect(master).toContain("KLINIKOS MASTER CANON");
    expect(authority).toContain(`file: ${MASTER_CANON}`);
    expect(authority).toContain("SOLE_ACTIVE_PRODUCT_ARCHITECTURE_BUSINESS_EXPERIENCE_AUTHORITY");
    expect(authority).toContain("may_be_overridden_by_specialist_docs: false");
    expect(authority).toContain("may_be_overridden_by_historical_docs: false");
    expect(inventory).toContain("exactly one narrative document may hold supreme company/product authority");
    expect(inventory).toContain(`\`${MASTER_CANON}\``);
  });

  it("classifies predecessor master documents as migration candidates instead of restoring parallel authority", () => {
    expect(inventory).toContain(`\`${PREDECESSOR_SPEC}\``);
    expect(inventory).toContain("`HISTORICAL_RETIRED_CANDIDATE`");
    expect(inventory).toContain("Extract unique requirements into Master Canon or specialist contracts");
    expect(authority).toContain("NEW_PARALLEL_MASTER_CANON");
    expect(authority).toContain("NEW_PARALLEL_SOURCE_OF_TRUTH");
  });

  it("allows only the four subordinate documentation roles beneath the Master Canon", () => {
    for (const classification of [
      "IMPLEMENTATION_CONTRACT",
      "EVIDENCE_REGISTER",
      "SPECIALIST_REFERENCE",
      "HISTORICAL_RETIRED",
    ]) {
      expect(inventory).toContain(`\`${classification}`);
    }
    expect(inventory).toContain("A file name containing `CANON`, `MASTER`, `FINAL`, `GOVERNING`, `BLUEPRINT`, `SOURCE OF TRUTH`, or `OPERATING SYSTEM` does not grant authority.");
  });

  it("keeps implementation status evidence separate from intended product truth", () => {
    expect(authority).toContain("question: what_exists_today");
    expect(authority).toContain("current_code");
    expect(authority).toContain("current_database_schema");
    expect(authority).toContain("verified_runtime_evidence");
    expect(authority).toContain("implementation_evidence_does_not_redefine_product_target");
    expect(authority).toContain("MASTER_CANON_WINS_FOR_PRODUCT_DIRECTION_CURRENT_VERIFIED_IMPLEMENTATION_WINS_FOR_WHAT_EXISTS");
  });

  it("requires safe migration before duplicate authorities are retired", () => {
    expect(inventory).toContain("remove ambiguity without deleting accepted Klinikos knowledge");
    expect(inventory).toContain("cannot survive as a second active master");
    expect(inventory).toContain("cannot retain independent governing status after their unique content is migrated");
  });
});
