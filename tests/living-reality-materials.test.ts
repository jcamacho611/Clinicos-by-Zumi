import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { readLivingRealityMaterialTokens } from "@/lib/living-reality/material-tokens";

const css = readFileSync("src/app/design-tokens.css", "utf8");

describe("Living Reality material tokens", () => {
  it("extends the existing Klinikos semantic token authority instead of defining a parallel palette", () => {
    for (const [token, authority] of [
      ["--k-reality-environment", "var(--k-public-bg)"],
      ["--k-reality-object", "var(--k-public-surface)"],
      ["--k-reality-line", "var(--k-line)"],
      ["--k-reality-attention", "var(--k-accent)"],
      ["--k-reality-selected", "var(--k-accent)"],
      ["--k-reality-blocked", "var(--status-signal)"],
      ["--k-reality-verified", "var(--status-resolved)"],
    ]) {
      expect(css).toContain(`${token}:${authority}`);
    }
  });

  it("reads presentation materials from computed semantic variables", () => {
    const values: Record<string, string> = {
      "--k-reality-environment": "env",
      "--k-reality-object": "object",
      "--k-reality-line": "line",
      "--k-reality-attention": "attention",
      "--k-reality-selected": "selected",
      "--k-reality-blocked": "blocked",
      "--k-reality-verified": "verified",
    };
    const computed = {
      getPropertyValue: vi.fn((name: string) => ` ${values[name] ?? ""} `),
    } as unknown as CSSStyleDeclaration;
    vi.stubGlobal("getComputedStyle", vi.fn(() => computed));

    expect(readLivingRealityMaterialTokens({} as Element)).toEqual({
      environment: "env",
      object: "object",
      line: "line",
      attention: "attention",
      selected: "selected",
      blocked: "blocked",
      verified: "verified",
    });

    vi.unstubAllGlobals();
  });
});
