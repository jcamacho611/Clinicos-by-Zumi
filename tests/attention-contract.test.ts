import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  attentionItemIsConsistent,
  badgeFor,
  badgeTotal,
  briefingSentence,
  everythingHandled,
  orderAttention,
  type AttentionItem,
} from "@/lib/home/attention";

function item(overrides: Partial<AttentionItem> = {}): AttentionItem {
  return {
    id: "intake-incomplete",
    subject: "forms before today's appointments",
    noun: "patient",
    pluralNoun: "patients",
    count: 2,
    severity: "due",
    recordIds: ["patient-1", "patient-2"],
    due: { kind: "no_deadline" },
    action: { label: "Review", href: "/forms" },
    evidence: "Appointments today whose intake form is unsigned.",
    ...overrides,
  };
}

describe("attention badges read structured state, never a sentence", () => {
  it("derives the badge from the count field rather than the briefing text", () => {
    const subject = item({ count: 7, recordIds: Array.from({ length: 7 }, (_, index) => `patient-${index}`) });
    expect(badgeFor(subject)).toBe(7);

    // The load-bearing property: rewording the sentence must not move the number. A
    // badge that scraped `briefingSentence` would change here; this one cannot.
    const reworded = { ...subject, subject: "to finish intake", noun: "person", pluralNoun: "people" };
    expect(briefingSentence(reworded)).not.toBe(briefingSentence(subject));
    expect(badgeFor(reworded)).toBe(badgeFor(subject));
  });

  it("survives a sentence with no digits in it at all", () => {
    // The failure mode text-scraping hits first: a sentence written in words, or in
    // another language, has nothing for `/\d+/` to find and the badge silently reads 0.
    const subject = item({ count: 3, recordIds: ["a", "b", "c"] });
    const wordySentence = "Three patients still need forms.";
    expect(wordySentence).not.toMatch(/\d/);
    expect(badgeFor(subject)).toBe(3);
  });

  it("shows no badge rather than a zero", () => {
    expect(badgeFor(item({ count: 0, recordIds: [] }))).toBeNull();
    expect(badgeTotal([item({ count: 0, recordIds: [] })])).toBeNull();
  });

  it("sums structured counts for the rail total", () => {
    const total = badgeTotal([
      item({ id: "a", count: 2, recordIds: ["1", "2"] }),
      item({ id: "b", count: 3, recordIds: ["3", "4", "5"] }),
    ]);
    expect(total).toBe(5);
  });

  it("requires a count to name the records it came from", () => {
    expect(attentionItemIsConsistent(item())).toBe(true);
    // A count that cannot produce its records is an assertion, not evidence — a person
    // who does not believe the number has no way to check it.
    expect(attentionItemIsConsistent(item({ count: 5 }))).toBe(false);
  });

  it("agrees with itself in singular and plural", () => {
    expect(briefingSentence(item({ count: 1, recordIds: ["patient-1"] }))).toContain("1 patient needs");
    expect(briefingSentence(item({ count: 2 }))).toContain("2 patients need");
  });

  it("says nothing is open plainly instead of inventing something to show", () => {
    const quiet = item({ count: 0, recordIds: [] });
    expect(everythingHandled([quiet])).toBe(true);
    expect(briefingSentence(quiet)).toBe("No patients need attention.");
  });

  it("puts a single critical item above a large informational pile", () => {
    const ordered = orderAttention([
      item({ id: "bulk", count: 40, severity: "informational", recordIds: Array.from({ length: 40 }, (_, i) => `r${i}`) }),
      item({ id: "urgent", count: 1, severity: "critical", recordIds: ["r"] }),
    ]);
    expect(ordered[0]?.id).toBe("urgent");
  });

  it("gives each item exactly one action, so the briefing decides what matters", () => {
    const subject = item();
    expect(subject.action.label.length).toBeGreaterThan(0);
    expect(subject.action.href.startsWith("/")).toBe(true);
    // `action` is a single object by type, not a list — there is no second primary.
    expect(Array.isArray(subject.action)).toBe(false);
  });

  it("never parses a sentence for a number anywhere in the module", () => {
    // The rule stated as code: no regex digit extraction, no split-on-space arithmetic.
    const source = fs.readFileSync(path.join(process.cwd(), "src/lib/home/attention.ts"), "utf8");
    const body = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(body).not.toMatch(/match\(\s*\/.*\\d/);
    expect(body).not.toMatch(/parseInt|parseFloat|Number\(\s*\w+\.(subject|evidence)/);
    expect(body).not.toMatch(/briefingSentence\([^)]*\)\s*\.\s*(match|replace|split)/);
    // And the derivation runs the right way: the sentence reads the count.
    expect(source).toMatch(/function briefingSentence[\s\S]*?item\.count/);
  });
});
