import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function read(relative: string) {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function luminance(hex: string) {
  const raw = hex.replace("#", "");
  const red = channel(parseInt(raw.slice(0, 2), 16));
  const green = channel(parseInt(raw.slice(2, 4), 16));
  const blue = channel(parseInt(raw.slice(4, 6), 16));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

describe("public Grid small-text contrast", () => {
  it("keeps the approved muted inks above the normal-text contrast floor", () => {
    expect(contrast("#756461", "#fffdf9")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#756461", "#f2ece8")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#475569", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#5b6675", "#fbfcfd")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#64748b", "#f8fafc")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#9f8985", "#050303")).toBeGreaterThanOrEqual(4.5);
  });

  it("does not reintroduce the measured low-contrast Grid metadata tones", () => {
    const files = [
      "src/app/grid/page.tsx",
      "src/components/grid/grid-resource-marketplace.tsx",
      "src/components/grid/marketplace-browser.tsx",
      "src/components/grid/universal-resource-browser.tsx",
      "src/components/grid/grid-exchange-field.tsx",
    ];
    const forbidden = ["#94a3b8", "#9b8883", "#8a7772", "#8f7c77", "#7b8490", "#806965"];
    const offenders: string[] = [];

    for (const file of files) {
      const source = read(file);
      for (const tone of forbidden) {
        if (source.includes(tone)) offenders.push(`${file} uses ${tone}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("keeps governed resource-request labels and hints out of the unreadable white-opacity range", () => {
    const request = read("src/components/grid/grid-resource-request-form.tsx");
    expect(request).not.toContain("text-white/30");
    expect(request).not.toContain("text-white/35");
    expect(request).toContain("text-white/55");
    expect(request).toContain("placeholder:text-white/55");
  });
});
