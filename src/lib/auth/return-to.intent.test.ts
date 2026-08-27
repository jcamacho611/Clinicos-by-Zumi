import { describe, expect, it } from "vitest";
import { safeReturnTo } from "@/lib/auth/return-to";

describe("safeReturnTo Grid persistence routes", () => {
  it("accepts the same-origin Grid need route with public listing context", () => {
    expect(safeReturnTo("/grid/needs/new?kind=provider&listingId=listing_123")).toBe(
      "/grid/needs/new?kind=provider&listingId=listing_123",
    );
  });

  it("continues rejecting external and malformed redirect variants", () => {
    expect(safeReturnTo("//evil.example/grid/needs/new")).toBeNull();
    expect(safeReturnTo("https://evil.example/grid/needs/new")).toBeNull();
    expect(safeReturnTo("/grid\\needs\\new")).toBeNull();
    expect(safeReturnTo("/grid/needs/new\r\nLocation:https://evil.example")).toBeNull();
    expect(safeReturnTo(`/${"a".repeat(501)}`)).toBeNull();
  });
});
