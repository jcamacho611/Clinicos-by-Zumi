import { describe, expect, it } from "vitest";
import { PORTAL_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth/config";
import { portalLoginSchema } from "@/lib/auth/portal-rules";
import { signPortalSessionToken, verifyPortalSessionToken } from "@/lib/auth/portal-token";
import { signSessionToken, verifySessionToken } from "@/lib/auth/token";

describe("patient portal authentication boundary", () => {
  it("validates organization-scoped portal credentials", () => {
    expect(portalLoginSchema.safeParse({ organization: "brooklyn-family-medicine", email: "MAYA@example.test", password: "long-enough-password" }).success).toBe(true);
    expect(portalLoginSchema.safeParse({ organization: "../other-clinic", email: "maya@example.test", password: "long-enough-password" }).success).toBe(false);
  });

  it("uses a separate cookie and token audience from clinic staff", async () => {
    expect(PORTAL_SESSION_COOKIE_NAME).not.toBe(SESSION_COOKIE_NAME);
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    const portalToken = await signPortalSessionToken({ sessionId: "portal-session", accountId: "portal-account", patientId: "patient-1", organizationId: "org-1", organizationName: "Clinic", organizationSlug: "clinic", email: "patient@example.test", name: "Patient", authLevel: "password", expiresAt });
    const staffToken = await signSessionToken({ sessionId: "staff-session", userId: "user-1", organizationId: "org-1", organizationName: "Clinic", organizationSlug: "clinic", email: "staff@example.test", name: "Staff", role: "viewer", demo: false, expiresAt });

    expect((await verifyPortalSessionToken(portalToken))?.patientId).toBe("patient-1");
    expect(await verifyPortalSessionToken(staffToken)).toBeNull();
    expect(await verifySessionToken(portalToken)).toBeNull();
  });
});
