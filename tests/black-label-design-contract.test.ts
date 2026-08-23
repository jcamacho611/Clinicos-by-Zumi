import { readFileSync } from "node:fs";
import { join } from "node:path";
import { brotliDecompressSync } from "node:zlib";
import { describe, expect, it } from "vitest";

const artifactRoot = join(process.cwd(), "docs", "design", "black-label-v2");
const encoded = [0, 1, 2, 3, 4]
  .map((part) => readFileSync(join(artifactRoot, `Klinikos Browser.dc.html.br.b64.part${String(part).padStart(2, "0")}`), "utf8"))
  .join("")
  .trim();
const source = brotliDecompressSync(Buffer.from(encoded, "base64")).toString("utf8");

function explicitButtonTargetsBelow44(html: string) {
  const buttons = html.match(/<button\b[^>]*>/g) ?? [];
  const failures: string[] = [];
  for (const button of buttons) {
    const style = button.match(/style="([^"]*)"/)?.[1] ?? "";
    const minHeight = style.match(/min-height:\s*([0-9.]+)px/)?.[1];
    const width = style.match(/(?:^|;)\s*width:\s*([0-9.]+)px/)?.[1];
    const height = style.match(/(?:^|;)\s*height:\s*([0-9.]+)px/)?.[1];
    if (minHeight && Number(minHeight) < 44) failures.push(button);
    else if (!minHeight && width && height && (Number(width) < 44 || Number(height) < 44)) failures.push(button);
  }
  return failures;
}

describe("Klinikos Black Label V2 Claude Design handoff", () => {
  it("uses production-approved Klinikos assets and valid semantic theme tokens", () => {
    expect(source).not.toContain("--ok-line:var(--ok-line)");
    expect(source).toContain("--ok-line:rgba(143,191,158,.35)");
    expect(source).toContain("/klinikos-orbital-k-production.png");
    expect(source).toContain("/klinikos-wordmark-production.png");
    expect(source).toContain("/klinikos-rose-hero-production.png");
    expect(source).not.toContain("assets/klinikos-orbital-k.png");
    expect(source).not.toContain("assets/klinikos-wordmark.png");
    expect(source).not.toContain("assets/rose-hero.png");
  });

  it("keeps visible interface text at the design handoff floor", () => {
    const sizes = [...source.matchAll(/font-size:\s*\.([0-9]+)rem/g)].map((match) => Number(`0.${match[1]}`));
    expect(sizes.filter((size) => size < 0.75)).toEqual([]);
  });

  it("keeps explicit interactive targets at or above 44px", () => {
    expect(explicitButtonTargetsBelow44(source)).toEqual([]);
    expect(source).not.toContain("width:34px;height:34px");
    expect(source).toContain("width:44px;height:44px");
  });

  it("makes Explore Klinikos a keyboard-managed modal surface", () => {
    expect(source).toContain('role="dialog" aria-modal="true"');
    expect(source).toContain("data-klinikos-palette-search");
    expect(source).toContain("openPalettePanel()");
    expect(source).toContain("restorePaletteFocus()");
    expect(source).toContain("trapPaletteFocus(event)");
  });

  it("keeps motion preference and dead-control truth explicit", () => {
    expect(source).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")');
    expect(source).toContain("const scrollBehavior");
    expect(source).toContain('disabled aria-disabled="true" title="Attachments are not connected in this design preview"');
    expect(source).toContain('disabled aria-disabled="true" title="Voice input is not connected in this design preview"');
    expect(source).toContain('openProfile: () => this.run("Open account and settings", "settings")');
  });

  it("derives the attention badge from the prototype briefing state", () => {
    expect(source).toContain("actionCount: String((BRIEF[s.role].items || []).filter(row => row[4]).length)");
    expect(source).not.toContain('actionCount: "3"');
  });
});
