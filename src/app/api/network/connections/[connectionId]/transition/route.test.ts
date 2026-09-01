import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const enforcePermission = vi.fn();
const transitionConnection = vi.fn();

vi.mock("@/lib/auth/session", () => ({ getClinicSession: () => getSession() }));
vi.mock("@/lib/auth/api-authorization", () => ({
  enforceApiPermission: (...args: unknown[]) => enforcePermission(...args),
}));
vi.mock("@/lib/repositories/network-directory-repository", () => ({
  transitionNetworkConnection: (...args: unknown[]) => transitionConnection(...args),
}));

const { POST } = await import("@/app/api/network/connections/[connectionId]/transition/route");

const administratorSession = {
  sessionId: "session-b",
  userId: "admin-b",
  organizationId: "org-b",
  organizationName: "Organization B",
  organizationSlug: "organization-b",
  email: "admin@example.test",
  name: "Organization Administrator",
  role: "administrator",
  demo: true,
  expiresAt: Date.now() + 60_000,
};

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue(administratorSession);
  enforcePermission.mockResolvedValue(null);
  transitionConnection.mockResolvedValue({ id: "connection-1", status: "active" });
});

describe("network connection transition API", () => {
  it("uses update authorization so the domain-approved administrator role reaches receiver approval", async () => {
    const request = new Request("https://klinikos.io/api/network/connections/connection-1/transition", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "approve",
        reason: "The receiving organization approved the requested purposes.",
      }),
    });
    const response = await POST(request, { params: Promise.resolve({ connectionId: "connection-1" }) });

    expect(response.status).toBe(200);
    expect(enforcePermission).toHaveBeenCalledWith(
      administratorSession,
      "network",
      "update",
      expect.objectContaining({ request, resourceId: "connection-1" }),
    );
    expect(transitionConnection).toHaveBeenCalledWith(
      administratorSession,
      "connection-1",
      expect.objectContaining({ action: "approve" }),
    );
  });
});
