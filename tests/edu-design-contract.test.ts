import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import { commandPalette, commandSurfaces } from "@/lib/design/command-system";

const workforcePages = [
  "src/app/edu/(lab)/programs/page.tsx",
  "src/app/edu/(lab)/programs/[pathway]/page.tsx",
  "src/app/edu/(lab)/programs/career-readiness/page.tsx",
  "src/app/edu/(lab)/reports/page.tsx",
  "src/app/edu/(lab)/demo-kit/page.tsx",
];

describe("EDU workforce visual contract", () => {
  it("uses the existing Klinikos command palette rather than a new theme", () => {
    expect(commandPalette.ground).toBe("#050303");
    expect(commandPalette.marble).toBe("#f8efed");
    expect(commandPalette.cyan).toBe("#e6817b");
    expect(commandSurfaces.shell).toContain("bg-[#050303]");
  });

  it("does not introduce a page-local font family or external font import", () => {
    for (const relativePath of workforcePages) {
      const source = fs.readFileSync(path.join(process.cwd(), relativePath), "utf8").toLowerCase();
      expect(source).not.toContain("font-family");
      expect(source).not.toContain("next/font");
      expect(source).not.toContain("fonts.googleapis.com");
    }
  });

  it("keeps evaluator pages inside the existing EduCommandHeader shell", () => {
    for (const relativePath of workforcePages) {
      const source = fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
      expect(source).toContain("EduCommandHeader");
    }
  });
});