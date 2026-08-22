import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The composer collapsed because a stylesheet described a component that no longer
 * existed. A mobile override declared four grid columns —
 * `2.5rem minmax(0,1fr) 2.7rem 3rem` — for a composer that had four children. Today's
 * composer has exactly one in-flow child, because the submit control is absolutely
 * positioned over the Zumi orb by design, so below 768px the textarea was placed in the
 * leading 2.5rem track and rendered typed text as a 40px vertical strip.
 *
 * Measured before: textarea width 40px at both 600px and 390px viewport.
 * Measured after:  534px and 324px respectively, with 738px from 960px upward.
 *
 * A rendered browser check is the only thing that catches the real failure, and that
 * runs in the release gate's browser QA rather than here. What is guarded here is the
 * structural invariant that made it possible, because it is the part a future edit can
 * silently reintroduce: the column count must live with the markup that defines the
 * children, never in a breakpoint override.
 */

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("public composer layout", () => {
  it("keeps every breakpoint template matching the number of in-flow controls", () => {
    // Comments stripped first: the note explaining why the template was removed
    // mentions the property by name, and a guard that fails on its own rationale
    // punishes the documentation rather than the defect.
    const css = read("src/app/cinematic-home-overrides.css")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    const composerBlocks = css
      .split("}")
      .filter((block) => block.includes("reference-composer-shell") && !block.includes("button"));
    // The composer has two in-flow controls: the field and the send button. A template
    // declaring more tracks than that is the original defect — four tracks
    // (2.5rem minmax(0,1fr) 2.7rem 3rem) put the textarea in a 40px column below 768px.
    for (const block of composerBlocks) {
      const match = block.match(/grid-template-columns:\s*([^;]+);/);
      if (!match) continue;
      const tracks = match[1].trim().split(/\s+(?![^(]*\))/).length;
      expect(tracks, `a breakpoint declares ${tracks} columns for two controls: ${match[1].trim()}`)
        .toBeLessThanOrEqual(2);
    }
  });

  it("gives the text field the whole track and lets it shrink", () => {
    // `w-full` stops the textarea resolving to an intrinsic width narrower than its
    // track; `min-w-0` stops a grid item's automatic minimum size from forcing overflow.
    const source = read("src/components/marketing/public-living-gateway.tsx");
    // The element is self-closing, so slice to the end of its own tag rather than
    // looking for a closing tag that does not exist.
    const start = source.indexOf("<textarea");
    const textarea = source.slice(start, source.indexOf("/>", start) + 2);
    expect(textarea).toContain("w-full");
    expect(textarea).toContain("min-w-0");
  });

  it("declares one column per in-flow control", () => {
    // The send button is in normal flow, so the template declares exactly two tracks:
    // a fractional one for the field and a fixed one for the button. The failure this
    // guards is a template that describes more children than exist — four tracks for a
    // composer with two put the textarea in a 2.5rem column.
    const source = read("src/components/marketing/public-living-gateway.tsx");
    expect(source).toContain("grid-cols-[minmax(0,1fr)_3.5rem]");
  });

  it("keeps the send control in normal flow", () => {
    // An older treatment absolutely positioned this button as a transparent hit target
    // over the Zumi orb. It is a real, visible control now, so it must occupy its track.
    const css = read("src/app/experience-convergence.css");
    expect(css).toMatch(/reference-composer-shell > button\[type="submit"\][\s\S]{0,140}position:\s*static/);
  });
});
