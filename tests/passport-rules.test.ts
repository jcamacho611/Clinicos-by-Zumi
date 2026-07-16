import { describe, expect, it } from "vitest";
import { confirmIntakePassportSchema, refreshPassportSchema, updateConsentWalletSchema } from "@/lib/passport-rules";

describe("passport rules", () => {
  it("requires a patient for chart refresh", () => {
    expect(() => refreshPassportSchema.parse({})).toThrow();
    expect(refreshPassportSchema.parse({ patientId: "pt-1001" })).toEqual({ patientId: "pt-1001" });
  });

  it("requires explicit wallet preferences and emergency policy", () => {
    expect(() => updateConsentWalletSchema.parse({ patientId: "pt-1001", sharingDefaults: {}, emergencyPreference: "blocked" })).toThrow();
    expect(updateConsentWalletSchema.parse({ patientId: "pt-1001", sharingDefaults: { treatment: "ask_each_time" }, emergencyPreference: "allow_break_glass_with_alert" }).emergencyPreference).toBe("allow_break_glass_with_alert");
  });

  it("does not allow an empty reusable intake passport", () => {
    expect(() => confirmIntakePassportSchema.parse({ patientId: "pt-1001", reusableFields: {} })).toThrow();
    expect(confirmIntakePassportSchema.parse({ patientId: "pt-1001", reusableFields: { demographics: "confirmed" } }).reusableFields).toEqual({ demographics: "confirmed" });
  });
});
