import { describe, expect, it } from "vitest";
import { safeClinicReturnTo, safePersonReturnTo, safeReturnTo } from "@/lib/auth/return-to";

describe("safe sign-in continuation", () => {
  it("preserves an internal Grid request path", () => {
    expect(safeReturnTo("/grid/resources/request/resource-1?from=discovery")).toBe("/grid/resources/request/resource-1?from=discovery");
  });

  it("rejects external, protocol-relative, and malformed destinations", () => {
    expect(safeReturnTo("https://attacker.example/grid")).toBeNull();
    expect(safeReturnTo("//attacker.example/grid")).toBeNull();
    expect(safeReturnTo("/grid\\redirect")).toBeNull();
  });

  it("keeps person principals out of organization-only destinations", () => {
    expect(safePersonReturnTo("/member")).toBe("/member");
    expect(safePersonReturnTo("/grid?intent=work")).toBe("/grid?intent=work");
    expect(safePersonReturnTo("/dashboard")).toBeNull();
    expect(safePersonReturnTo("/patients/patient-1")).toBeNull();
  });

  it("keeps clinic principals out of the person-only member surface", () => {
    expect(safeClinicReturnTo("/dashboard")).toBe("/dashboard");
    expect(safeClinicReturnTo("/member")).toBeNull();
    expect(safeClinicReturnTo("/signup")).toBeNull();
  });
});
