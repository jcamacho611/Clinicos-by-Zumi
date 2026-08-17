import { describe, expect, it } from "vitest";
import { getZumiTool, resolveZumiToolReadiness } from "@/features/zumi/tool-catalog";

describe("Zumi external tool readiness", () => {
  it("does not report SMS configured from an Account SID alone", () => {
    const sms = getZumiTool("sms");
    expect(sms).toBeTruthy();
    expect(resolveZumiToolReadiness(sms!, { TWILIO_ACCOUNT_SID: "AC_test" })).toBe("pending_connection");
  });

  it("requires the complete restricted-key Messaging Service contract", () => {
    const sms = getZumiTool("sms")!;
    expect(resolveZumiToolReadiness(sms, {
      TWILIO_ACCOUNT_SID: "AC_test",
      TWILIO_API_KEY_SID: "SK_test",
      TWILIO_API_KEY_SECRET: "secret",
      TWILIO_MESSAGING_SERVICE_SID: "MG_test",
    })).toBe("configured");
  });

  it("treats the core Grid interactive map separately from optional routing APIs", () => {
    expect(resolveZumiToolReadiness(getZumiTool("grid_map")!, {})).toBe("active");
    expect(resolveZumiToolReadiness(getZumiTool("maps")!, {})).toBe("pending_connection");
    expect(resolveZumiToolReadiness(getZumiTool("maps")!, { GEOAPIFY_API_KEY: "configured" })).toBe("configured");
  });
});
