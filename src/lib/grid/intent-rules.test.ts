import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { gridOfferEnrollmentHref, inferGridIntent, matchesGridSearchTerms } from "@/lib/grid/intent-rules";

describe("Grid deterministic intent routing", () => {
  it("routes a clinical coverage need to work and structures its time", () => {
    expect(inferGridIntent("I need an RN shift covered Friday 9-5 in Brooklyn")).toMatchObject({
      direction: "need",
      intent: "work",
      followUp: null,
      temporal: { weekdays: [5], startTime: "09:00", endTime: "17:00" },
    });
  });

  it("routes offered treatment space to the space-owner enrollment", () => {
    const interpretation = inferGridIntent("I have a treatment room available Saturdays");
    expect(interpretation).toMatchObject({ direction: "offer", intent: "space", followUp: "What city is the space in?" });
    expect(gridOfferEnrollmentHref(interpretation.intent)).toBe("/grid/join/location");
  });

  it("preserves every meaningful search term and matches state names to codes", () => {
    const interpretation = inferGridIntent("I need a nurse in California");
    expect(interpretation.searchTerms).toEqual(["nurse", "california"]);
    expect(matchesGridSearchTerms(["Registered nurse", "CA"], interpretation.searchTerms)).toBe(true);
    expect(matchesGridSearchTerms(["Registered nurse", "NY"], interpretation.searchTerms)).toBe(false);
  });

  it("does not require a listing to literally contain temporal words or clock digits", () => {
    const interpretation = inferGridIntent("I need a nurse Friday 9-5 in California");
    expect(interpretation.searchTerms).toEqual(["nurse", "california"]);
    expect(interpretation.temporal.weekdays).toEqual([5]);
    expect(matchesGridSearchTerms(["Registered nurse", "CA"], interpretation.searchTerms)).toBe(true);
  });

  it("requires all meaningful terms instead of filtering by only the first", () => {
    expect(matchesGridSearchTerms(["Registered nurse", "California"], ["nurse", "california"])).toBe(true);
    expect(matchesGridSearchTerms(["Registered nurse", "Nevada"], ["nurse", "california"])).toBe(false);
  });

  it("keeps an explicit exchange direction while the visitor types", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/components/grid/grid-exchange-field.tsx"), "utf8");
    expect(source).toContain('onClick={() => setDirectionOverride("offer")}');
    expect(source).toContain("onChange={(event) => setQuery(event.target.value)}");
    expect(source).not.toContain("setDirectionOverride(null)");
  });

  it("keeps non-clinical services out of clinical eligibility routing", () => {
    expect(inferGridIntent("I need a billing company for my clinic")).toMatchObject({ direction: "need", intent: "service" });
  });
});
