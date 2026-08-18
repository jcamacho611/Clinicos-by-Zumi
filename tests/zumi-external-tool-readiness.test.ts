import { describe, expect, it } from "vitest";
import { getZumiTool, resolveZumiToolReadiness } from "@/features/zumi/tool-catalog";

describe("Zumi external tool readiness", () => {
  it("does not represent SMS as generally configured from Twilio transport credentials", () => {
    const sms = getZumiTool("sms");
    expect(sms).toBeTruthy();
    expect(resolveZumiToolReadiness(sms!, { TWILIO_ACCOUNT_SID: "AC_test" })).toBe("available_to_wire");
    expect(resolveZumiToolReadiness(sms!, {
      TWILIO_ACCOUNT_SID: "AC_test",
      TWILIO_API_KEY_SID: "SK_test",
      TWILIO_API_KEY_SECRET: "secret",
      TWILIO_MESSAGING_SERVICE_SID: "MG_test",
    })).toBe("available_to_wire");
  });

  it("keeps the Twilio transport contract documented without treating it as recipient permission", () => {
    const sms = getZumiTool("sms")!;
    expect(sms.requiredEnvAll).toEqual([
      "TWILIO_ACCOUNT_SID",
      "TWILIO_API_KEY_SID",
      "TWILIO_API_KEY_SECRET",
      "TWILIO_MESSAGING_SERVICE_SID",
    ]);
    expect(sms.description).toContain("credentials configure transport only");
    expect(sms.description).toContain("do not authorize contact");
  });

  it("treats the core Grid interactive map separately from optional routing APIs", () => {
    expect(resolveZumiToolReadiness(getZumiTool("grid_map")!, {})).toBe("active");
    expect(resolveZumiToolReadiness(getZumiTool("maps")!, {})).toBe("pending_connection");
    expect(resolveZumiToolReadiness(getZumiTool("maps")!, { GEOAPIFY_API_KEY: "configured" })).toBe("configured");
  });
});
