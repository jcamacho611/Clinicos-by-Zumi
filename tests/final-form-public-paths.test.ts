import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PUBLIC_ENTRY_FAMILIES,
  PUBLIC_PATH_CATALOG,
  PUBLIC_PATH_METADATA_HAS_NO_AUTHORITY,
  type PublicPathTruthState,
} from "@/lib/orchestration/public-path-catalog";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

const REQUIRED_PATHS = [
  "patient",
  "caregiver",
  "student",
  "worker",
  "professional",
  "clinic_owner",
  "clinic_staff",
  "employer",
  "school",
  "workforce_board",
  "educator",
  "vendor",
  "capacity_supplier",
  "investor",
  "entrepreneur",
  "partner",
  "procurement",
  "referrer",
  "enterprise_buyer",
] as const;

const TRUTH_STATES: PublicPathTruthState[] = [
  "AVAILABLE_NOW",
  "GOVERNED_ACCOUNT_REQUIRED",
  "ACTIVE_DEVELOPMENT",
  "PLANNED",
];

describe("Final-Form public path catalogue", () => {
  it("covers every mandatory universal participant path", () => {
    const keys = new Set(PUBLIC_PATH_CATALOG.map((entry) => entry.key));
    for (const key of REQUIRED_PATHS) expect(keys.has(key)).toBe(true);
  });

  it("keeps each path complete enough for progressive public routing", () => {
    for (const entry of PUBLIC_PATH_CATALOG) {
      expect(entry.label.trim().length).toBeGreaterThan(1);
      expect(entry.entryExamples.length).toBeGreaterThan(0);
      expect(entry.entryExamples.every((value) => value.trim().length > 3)).toBe(true);
      expect(entry.destination.startsWith("/")).toBe(true);
      expect(entry.destination.startsWith("//")).toBe(false);
      expect(entry.firstValue.trim().length).toBeGreaterThan(20);
      expect(entry.verification.trim().length).toBeGreaterThan(10);
      expect(entry.economics.trim().length).toBeGreaterThan(10);
      expect(TRUTH_STATES).toContain(entry.truthState);
    }
  });

  it("keeps path metadata explicitly non-authoritative", () => {
    expect(PUBLIC_PATH_METADATA_HAS_NO_AUTHORITY).toContain("does not grant");
    expect(PUBLIC_PATH_METADATA_HAS_NO_AUTHORITY).toContain("authority");
  });

  it("offers a small progressive-disclosure set instead of a product wall", () => {
    expect(PUBLIC_ENTRY_FAMILIES.map((entry) => entry.key)).toEqual([
      "care",
      "work",
      "operate",
      "learn",
      "capacity",
      "partner",
    ]);
    expect(PUBLIC_ENTRY_FAMILIES.length).toBe(6);
    for (const family of PUBLIC_ENTRY_FAMILIES) {
      expect(family.promptExamples.length).toBeGreaterThanOrEqual(2);
      expect(family.destination.startsWith("/")).toBe(true);
      expect(family.description.length).toBeGreaterThan(20);
    }
  });
});

describe("Final-Form homepage progressive disclosure", () => {
  it("will place universal paths after the Zumi gateway and before detailed product evidence", () => {
    const page = read("src/app/page.tsx");
    expect(page).toContain("UniversalPathwaysSection");
    const gatewayIndex = page.indexOf("<PublicLivingGateway />");
    const pathsIndex = page.indexOf("<UniversalPathwaysSection />");
    const evidenceIndex = page.indexOf("<ProductEvidenceSection />");
    expect(gatewayIndex).toBeGreaterThan(-1);
    expect(pathsIndex).toBeGreaterThan(gatewayIndex);
    expect(evidenceIndex).toBeGreaterThan(pathsIndex);
  });
});
