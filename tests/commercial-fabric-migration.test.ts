import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  commercialFabricPrinciples,
  customerCommercialProgression,
  unfinishedWorkProgression,
} from "@/lib/commercial/klinikos-commercial";

const ROOTS = ["src", "docs", "governance"] as const;
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".md", ".json"]);
const FORBIDDEN = [
  "clinic operating analysis",
  "implementation blueprint",
  "founding clinic implementation",
  "private_workflow_demo",
  "founding_clinic_evaluation",
  "founding_clinic_program",
] as const;

function collectTextFiles(path: string): string[] {
  const absolute = join(process.cwd(), path);
  if (statSync(absolute).isFile()) return [path];

  return readdirSync(absolute).flatMap((entry) => {
    const child = join(path, entry);
    const childAbsolute = join(process.cwd(), child);
    if (statSync(childAbsolute).isDirectory()) return collectTextFiles(child);
    return TEXT_EXTENSIONS.has(extname(entry)) ? [child] : [];
  });
}

describe("commercial fabric migration", () => {
  it("removes retired clinic-ladder identities from active authority and source", () => {
    const files = [...ROOTS.flatMap(collectTextFiles), "README.md"];
    const violations: string[] = [];

    for (const file of files) {
      const text = readFileSync(join(process.cwd(), file), "utf8").toLowerCase();
      for (const forbidden of FORBIDDEN) {
        if (text.includes(forbidden)) violations.push(`${relative(process.cwd(), join(process.cwd(), file))}: ${forbidden}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("makes first useful result and economic value the commercial progression", () => {
    expect(customerCommercialProgression).toEqual([
      "DISCOVERY",
      "JOIN FREE",
      "INTENT",
      "CONTEXT",
      "FIRST USEFUL RESULT",
      "ECONOMIC VALUE",
      "PAID CAPABILITY",
      "MEASURED OUTCOME",
      "RETENTION",
      "EXPANSION",
    ]);
    expect(unfinishedWorkProgression).toContain("UNFINISHED WORK");
    expect(unfinishedWorkProgression).toContain("PROVE ECONOMIC VALUE");
  });

  it("keeps payment separate from governed authority", () => {
    expect(commercialFabricPrinciples.freePaidBoundary).toBe(
      "FREE PARTICIPATION AND FIRST VALUE -> PAID CAPABILITY FOLLOWS ADDITIONAL ECONOMIC VALUE",
    );
    expect(commercialFabricPrinciples.paymentCreatesAuthority).toBe(false);
    expect(commercialFabricPrinciples.offerAuthority).toBe("server_owned");
  });
});
