import { describe, expect, it } from "vitest";
import { gridOfferEnrollmentHref, inferGridIntent, matchesGridSearchTerms } from "@/lib/grid/intent-rules";

describe("Grid deterministic intent routing", () => {
  it("routes a clinical coverage need to work", () => {
    expect(inferGridIntent("I need an RN shift covered tomorrow in Brooklyn")).toMatchObject({ direction: "need", intent: "work", followUp: null });
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

  it("requires all meaningful terms instead of filtering by only the first", () => {
    expect(matchesGridSearchTerms(["Registered nurse", "California"], ["nurse", "california"])).toBe(true);
    expect(matchesGridSearchTerms(["Registered nurse", "Nevada"], ["nurse", "california"])).toBe(false);
  });

  it("keeps non-clinical services out of clinical eligibility routing", () => {
    expect(inferGridIntent("I need a billing company for my clinic")).toMatchObject({ direction: "need", intent: "service" });
  });
});
