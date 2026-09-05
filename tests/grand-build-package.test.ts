import { existsSync, readFileSync, readdirSync } from "node:fs";
import { globSync } from "node:fs";
import { describe, expect, it } from "vitest";

const DIR = "docs/grand-build";
const EXPECTED = [
  "00_START_HERE.md",
  "01_GRAND_BUILD_CONSTITUTION.md",
  "01.5_RECONCILIATION_OVERRIDE.md",
  "02_LIVING_REALITY_BUILD_PROMPT.md",
  "03_COUNCIL_PACK.md",
  "04_AGENT_HANDOFF.md",
  "05_LANGUAGE_BOOK.md",
  "06_WAVE_0_TRUTH.md",
  "07_MONEY_AND_STRIPE.md",
  "08_VISION.md",
  "09_PERSONAS.md",
  "10_CONNECTION_PROMPT.md",
  "11_FRONTEND_PROMPT.md",
];

const read = (f: string) => readFileSync(`${DIR}/${f}`, "utf8");
const all = EXPECTED.map(read).join("\n");

describe("grand build package", () => {
  it("contains exactly the twelve canonical documents", () => {
    const present = readdirSync(DIR).filter((f) => f.endsWith(".md")).sort();
    expect(present).toEqual([...EXPECTED].sort());
  });

  it("never claims to be a canon", () => {
    // Standing law: do not create another Master Canon. Every document in this
    // package must declare itself subordinate, so a future agent cannot mistake
    // a build instruction for product authority.
    for (const file of EXPECTED) {
      expect(read(file), file).toMatch(/SUBORDINATE|subordinate to/);
    }
    expect(all).toContain("docs/KLINIKOS_MASTER_CANON.md");
  });

  it("never instructs an agent to install the stale dependency versions", () => {
    // R3F 8 requires React 18; this repo is React 19. An older revision of the
    // build prompt told agents to install it, which would break the build.
    // The correction tables legitimately QUOTE the stale versions in order to
    // reject them, so this asserts no INSTALL instruction, not no mention.
    expect(all).not.toMatch(/npm\s+i(nstall)?[^\n]*@react-three\/fiber@\^?8/);
    expect(all).not.toMatch(/npm\s+i(nstall)?[^\n]*three@\^?0\.169/);
    expect(all).toContain("0.185.1");
    expect(all).toContain("9.7.0");
    // And the correction is stated explicitly somewhere.
    expect(all).toMatch(/R3F 8[\s\S]*React 18/);
  });

  it("names living-reality canonical and forbids a parallel runtime", () => {
    expect(all).toContain("src/lib/living-reality/");
    const override = read("01.5_RECONCILIATION_OVERRIDE.md");
    // The override must explicitly prohibit the parallel directory, since 02
    // quotes it in its correction table.
    expect(override).toMatch(/Do not create those/i);
    expect(override).toMatch(/second runtime under a different name/i);
  });

  it("keeps proprietary attention weights out of the browser", () => {
    const override = read("01.5_RECONCILIATION_OVERRIDE.md");
    expect(override).toContain("AttentionLevel");
    expect(override).toMatch(/normal[\s\S]*elevated[\s\S]*critical/);
    expect(override).toMatch(/never expose raw score|Never expose raw score/i);
  });

  it("versions the override, because it ages faster than the constitution", () => {
    const override = read("01.5_RECONCILIATION_OVERRIDE.md");
    for (const field of [
      "DOCUMENT_VERSION",
      "LAST_VERIFIED_MAIN_SHA",
      "LAST_VERIFIED_AT",
      "REVERIFY_IF_MAIN_MOVES",
    ]) {
      expect(override, field).toContain(field);
    }
  });

  it("states the measured literal baseline, not the stale ceiling", () => {
    // main@799612bf measures 2,735. Older documents said 2,206.
    expect(read("06_WAVE_0_TRUTH.md")).toContain("2,735");
    expect(all).not.toMatch(/ratchet ceiling: 2206|ceiling of 2,206 is current/);
  });

  it("carries no stylesheet count that the evidence document does not record", () => {
    // 11 cited 06 for "nine stylesheets, five override layers". 06 recorded neither, and
    // src/app holds twelve. A citation is only valid if the cited document carries it.
    const truth = read("06_WAVE_0_TRUTH.md");
    const frontend = read("11_FRONTEND_PROMPT.md");

    // The stale sentence is legitimately quoted inside the CORRECTION block. What must
    // never happen is it standing as a live claim, so require every occurrence to be a
    // quoted line. A test that just forbade the words would fail on its own correction.
    const stale = frontend
      .split("\n")
      .filter((line) => /records nine/.test(line));
    expect(stale.length).toBeGreaterThan(0); // the correction must still cite what it corrects
    for (const line of stale) expect(line.trimStart().startsWith(">")).toBe(true);

    expect(frontend).toContain("12 stylesheets");
    expect(frontend).toContain("CORRECTION");

    expect(truth).toContain("six override layers");
  });

  it("states override-stack numbers that are true of the repository right now", () => {
    // Measure from the files, then require the documents to state what was measured.
    // A substring check would pass on a number that merely appears somewhere.
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    const imported = [...layout.matchAll(/import "\.\/([\w-]+\.css)"/g)].map((m) => m[1]);
    const overrides = imported.slice(
      imported.indexOf("globals.css") + 1,
      imported.indexOf("accessibility.css"),
    );

    const count = (files: string[]) =>
      files.reduce(
        (acc, file) => {
          const css = readFileSync(file, "utf8");
          return {
            literals: acc.literals + (css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).length,
            importants: acc.importants + (css.match(/!important/g) ?? []).length,
          };
        },
        { literals: 0, importants: 0 },
      );

    const stack = count(overrides.map((f) => `src/app/${f}`));
    const modules = count(globSync("src/app/**/*.module.css"));

    const truth = read("06_WAVE_0_TRUTH.md");
    const frontend = read("11_FRONTEND_PROMPT.md");

    // summary table
    expect(truth).toMatch(
      new RegExp(`\\| Literals inside those 6 layers \\| \\*\\*${stack.literals}\\*\\*`),
    );
    expect(truth).toMatch(
      new RegExp(
        `\\| \`!important\` inside those 6 layers \\| \\*\\*${stack.importants}\\*\\*`,
      ),
    );

    // the prose in both documents must carry the same pair
    const prose = new RegExp(
      `\\*\\*${stack.literals} hardcoded literals and\\s+${stack.importants} \`!important\``,
    );
    expect(truth).toMatch(prose);
    expect(frontend).toMatch(
      new RegExp(
        `\\*\\*${stack.literals} hardcoded literals and\\s+${stack.importants} \`!important\``,
      ),
    );

    // the route-scoped modules are counted separately and must also be true
    expect(truth).toMatch(
      new RegExp(
        `${modules.literals} literals and ${modules.importants} \`!important\` declarations`,
      ),
    );

    // and every per-file line of the import-order block must match its file
    for (const file of [...overrides, "accessibility.css"]) {
      const css = readFileSync(`src/app/${file}`, "utf8");
      const literals = (css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).length;
      const importants = (css.match(/!important/g) ?? []).length;
      expect(truth).toMatch(
        new RegExp(
          `${file.replace(/[.]/g, "\\.")}\\s+${literals} literals?\\s+·\\s+${importants} !important`,
        ),
      );
    }
  });

  it("discloses the literals this package's own branch adds", () => {
    // The four are token definitions in design-tokens.css, not component literals.
    const truth = read("06_WAVE_0_TRUTH.md");
    expect(truth).toContain("2,739");
    expect(truth).toContain("design-tokens.css");

    const tokens = readFileSync("src/app/design-tokens.css", "utf8");
    for (const literal of ["#f0aaa3", "#6f4a4b", "#a84d55", "#c2a6a6"]) {
      expect(truth).toContain(literal);
      expect(tokens).toContain(literal);
    }
  });

  it("defers the council roster to the governance protocol on main", () => {
    const council = read("03_COUNCIL_PACK.md");
    const protocol = readFileSync(
      "docs/governance/KLINIKOS_SPECIALIST_COUNCIL_AND_CAPABILITY_ROUTING_PROTOCOL.md",
      "utf8",
    );
    expect(council).toContain("KLINIKOS_SPECIALIST_COUNCIL_AND_CAPABILITY_ROUTING_PROTOCOL.md");
    expect(council).toMatch(/governance protocol wins/i);
    // the three councils 03 does not carry must exist in the protocol it points at
    for (const name of ["Customer Success", "Digital Twin", "Company Command"]) {
      expect(council).toContain(name);
      expect(protocol).toContain(name);
    }
  });

  it("places the package below every slot of the execution index", () => {
    const start = read("00_START_HERE.md");
    expect(start).toContain("KLINIKOS_EXECUTION_INDEX.md");
    expect(start).toMatch(/Loses to all eight|wins on nothing/);
    // every authority file 00 points at must exist
    for (const file of [
      "docs/KLINIKOS_EXECUTION_INDEX.md",
      "docs/KLINIKOS_MASTER_CANON.md",
      "docs/governance/KLINIKOS_EXECUTION_TRACEABILITY.json",
    ]) {
      expect(existsSync(file)).toBe(true);
    }
  });

  it("makes no unverified live-revenue claim", () => {
    const money = read("07_MONEY_AND_STRIPE.md");
    expect(money).toMatch(/Live Stripe verified in this session:.{0,6}NO/);
    expect(money).toMatch(/query live stripe/i);
    expect(money).toContain("ASSUMPTION");
  });

  it("keeps the Demand Escrow copy truthful before persistence", () => {
    const language = read("05_LANGUAGE_BOOK.md");
    expect(language).toContain("No verified openings match this yet.");
    expect(language).toContain("Klinikos can watch for one.");
    // The forbidden forms appear only inside explicit strike-through examples.
    expect(language).toMatch(/~~"I've saved this as a live search\."~~/);
    expect(language).toMatch(/~~"you'll be the first person it reaches\."~~/);
  });

  it("records the README offers with no Stripe price behind them", () => {
    // A public offer the company cannot fulfil at the stated price is a live
    // commercial exposure, not a stale-document problem. It must stay written
    // down until the commercial convergence tranche removes it.
    const money = read("07_MONEY_AND_STRIPE.md");
    expect(money).toMatch(/no Stripe product or price behind them/i);
    expect(money).toMatch(/\$995 \/ \$1,995 \/ \$3,995/);
    expect(money).toMatch(/cannot fulfil|cannot fulfill/i);
    // And the three prices that ARE real are named, so nobody re-invents them.
    for (const id of ["price_1U5j3h", "price_1U5uX7", "price_1U5uhr"]) {
      expect(money, id).toContain(id);
    }
  });

  it("records that no canonical capability is verified live", () => {
    // The single most important number for anyone writing a customer, lender or
    // investor claim.
    const truth = read("06_WAVE_0_TRUTH.md");
    expect(truth).toMatch(/\*\*0\*\*|`LIVE_VERIFIED`\*\* \| \*\*0\*\*/);
    expect(truth).toContain("66 capabilities");
    expect(truth).toMatch(/production phi remains blocked/i);
  });
});
