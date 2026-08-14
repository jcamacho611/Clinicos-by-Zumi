import { describe, expect, it } from "vitest";
import { safeReturnTo } from "@/lib/auth/return-to";

describe("safe sign-in continuation", () => {
  it("preserves an internal Grid request path", () => {
    expect(safeReturnTo("/grid/resources/request/resource-1?from=discovery")).toBe("/grid/resources/request/resource-1?from=discovery");
  });

  it("rejects external, protocol-relative, and malformed destinations", () => {
    expect(safeReturnTo("https://attacker.example/grid")).toBeNull();
    expect(safeReturnTo("//attacker.example/grid")).toBeNull();
    expect(safeReturnTo("/grid\\redirect")).toBeNull();
  });
});
