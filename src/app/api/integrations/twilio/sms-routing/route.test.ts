import { beforeEach, describe, expect, it, vi } from "vitest";

const getClinicSession = vi.fn();
const enforceApiPermission = vi.fn();
const getTwilioSmsRoutingConfig = vi.fn();
const configureTwilioSmsRouting = vi.fn();

vi.mock("@/lib/auth/session", () => ({ getClinicSession }));
vi.mock("@/lib/auth/api-authorization", () => ({ enforceApiPermission }));
vi.mock("@/lib/communications/twilio-integration", () => ({
  getTwilioSmsRoutingConfig,
  configureTwilioSmsRouting,
}));

const { GET, PATCH } = await import("@/app/api/integrations/twilio/sms-routing/route");

const session = {
  sessionId: "session-1",
  userId: "user-1",
  organizationId: "org-1",
  organizationName: "Example Clinic",
  organizationSlug: "example-clinic",
  email: "owner@example.test",
  name: "Owner",
  role: "clinic_owner",
  demo: false,
  expiresAt: Date.now() + 60_000,
};

function privateRoutingFixture() {
  return {
    integrationId: "integration-secret-id",
    integrationStatus: "pending_connection",
    routing: {
      senderPhone: "+12125550100",
      messagingServiceSid: "MG1234567890SECRET",
      inboundEnabled: true,
      configuredAt: "2026-08-18T12:00:00.000Z",
      configuredBy: "internal-user-secret",
    },
  };
}

beforeEach(() => {
  getClinicSession.mockReset().mockResolvedValue(session);
  enforceApiPermission.mockReset().mockResolvedValue(null);
  getTwilioSmsRoutingConfig.mockReset().mockResolvedValue(privateRoutingFixture());
  configureTwilioSmsRouting.mockReset().mockResolvedValue({
    ok: true,
    integrationId: "integration-secret-id",
    routing: privateRoutingFixture().routing,
  });
});

describe("Twilio SMS routing API disclosure boundary", () => {
  it("returns operational readiness without service identifiers, actor IDs, or credential names", async () => {
    const response = await GET(new Request("https://klinikos.io/api/integrations/twilio/sms-routing"));
    const payload = await response.json();
    const serialized = JSON.stringify(payload);

    expect(response.status).toBe(200);
    expect(payload.data).toEqual({
      configured: true,
      status: "pending_connection",
      senderPhone: "+12125550100",
      inboundEnabled: true,
      messagingServiceConfigured: true,
      webhookPath: "/api/webhooks/twilio/sms",
    });
    expect(serialized).not.toContain("integration-secret-id");
    expect(serialized).not.toContain("MG1234567890SECRET");
    expect(serialized).not.toContain("internal-user-secret");
    expect(serialized).not.toContain("TWILIO_AUTH_TOKEN");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("does not echo the submitted Messaging Service SID after an authorized update", async () => {
    const response = await PATCH(new Request("https://klinikos.io/api/integrations/twilio/sms-routing", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        senderPhone: "+12125550100",
        messagingServiceSid: "MG1234567890SECRET",
        inboundEnabled: true,
      }),
    }));
    const payload = await response.json();
    const serialized = JSON.stringify(payload);

    expect(response.status).toBe(200);
    expect(configureTwilioSmsRouting).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: "org-1",
      actorId: "user-1",
    }));
    expect(payload.data.messagingServiceConfigured).toBe(true);
    expect(serialized).not.toContain("MG1234567890SECRET");
    expect(serialized).not.toContain("integration-secret-id");
  });
});
