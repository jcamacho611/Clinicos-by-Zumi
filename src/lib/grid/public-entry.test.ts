import { describe, expect, it } from "vitest";
import { gridPublicEntryContext } from "@/lib/grid/public-entry";

describe("Grid public entry continuation", () => {
  it("turns a safe public-Zumi staffing intent into a truthful Grid starting point", () => {
    expect(gridPublicEntryContext("public-zumi", "staffing")).toEqual({
      source: "public-zumi",
      intent: "provider",
      initialQuery: "I need a healthcare professional",
      title: "Continue the staffing need you started with Zumi",
      body: "Add the role, location, timing, and any requirements. Grid will narrow real supply without making you start over.",
    });
  });

  it("preserves a generic Grid continuation without inventing details", () => {
    expect(gridPublicEntryContext("public-zumi", "grid")).toMatchObject({
      source: "public-zumi",
      intent: "all",
      initialQuery: "",
    });
  });

  it("ignores untrusted sources and unsupported/free-text intent", () => {
    expect(gridPublicEntryContext("other", "staffing")).toBeNull();
    expect(gridPublicEntryContext("public-zumi", "patient record for Jane Doe")).toBeNull();
    expect(gridPublicEntryContext(undefined, undefined)).toBeNull();
  });

  it("uses the first bounded query value when Next supplies repeated params", () => {
    expect(gridPublicEntryContext(["public-zumi", "other"], ["staffing", "grid"])).toMatchObject({
      source: "public-zumi",
      intent: "provider",
    });
  });
});
