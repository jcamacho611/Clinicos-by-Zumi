import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const shell = fs.readFileSync(path.join(process.cwd(), "src/components/clinic/app-shell.tsx"), "utf8");
const layout = fs.readFileSync(path.join(process.cwd(), "src/app/layout.tsx"), "utf8");
const tokens = fs.readFileSync(path.join(process.cwd(), "src/app/design-tokens.css"), "utf8");

describe("Black Label authenticated shell material boundary", () => {
  it("lets the workspace and header follow the shared theme authority", () => {
    expect(shell).toContain("bg-[var(--mode-background)]");
    expect(shell).toContain("bg-[color:var(--mode-header)]");
    expect(tokens).toContain("--mode-background:var(--k-work-bg)");
    expect(tokens).toContain("--mode-header:var(--k-work-header)");
    expect(layout).toContain('className="klinikos-theme-surface"');
  });

  it("preserves the existing Obsidian command rail rather than creating a second shell", () => {
    expect(shell).toContain('bg-[#070304]/98');
    expect(shell).toContain("<KlinikosWordmark");
    expect(shell).toContain("primaryNavigationForRole");
    expect(shell).toContain('aria-label="Primary Klinikos navigation"');
    expect(shell).not.toContain("BlackLabelShell");
    expect(shell).not.toContain("ThemeProvider2");
  });

  it("keeps Explore Klinikos as a real modal command surface", () => {
    expect(shell).toContain('role="dialog" aria-modal="true" aria-label="Explore Klinikos"');
    expect(shell).toContain("⌘K");
    expect(shell).toContain('aria-label="Close Explore Klinikos"');
  });
});
