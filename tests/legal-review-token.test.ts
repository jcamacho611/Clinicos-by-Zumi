import { beforeEach, describe, expect, it } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";
import {
  createAgreementPresentedToken,
  createAgreementReviewedToken,
  verifyLegalReviewToken,
} from "@/lib/legal/review-token";

const session: ClinicSession = {
  sessionId: "session-legal-1",
  userId: "user-legal-1",
  organizationId: "org-legal-1",
  organizationName: "Test Clinic",
  organizationSlug: "test-clinic",
  email: "signer@example.test",
  name: "Signer",
  role: "clinic_owner",
  demo: false,
  expiresAt: Math.floor(Date.now() / 1000) + 3600,
};

const agreement = {
  documentKey: "agreement-key",
  documentVersion: "2026.08.18.1",
  documentSha256: "a".repeat(64),
};

describe("legal review tokens", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-legal-review-secret-that-is-more-than-32-characters";
  });

  it("binds presentation and review evidence to the current session and agreement", async () => {
    const presentedToken = await createAgreementPresentedToken(session, agreement, new Date("2026-08-18T18:00:00.000Z"));
    const presented = await verifyLegalReviewToken(presentedToken, session, agreement, "presented");
    expect(presented.presentedAt).toBe("2026-08-18T18:00:00.000Z");

    const reviewedToken = await createAgreementReviewedToken(presented, new Date("2026-08-18T18:02:00.000Z"));
    const reviewed = await verifyLegalReviewToken(reviewedToken, session, agreement, "reviewed");
    expect(reviewed.reachedEndAt).toBe("2026-08-18T18:02:00.000Z");
  });

  it("rejects a review token presented by another authenticated session", async () => {
    const presentedToken = await createAgreementPresentedToken(session, agreement);
    await expect(verifyLegalReviewToken(presentedToken, { ...session, sessionId: "different-session" }, agreement, "presented")).rejects.toThrow();
  });

  it("rejects agreement evidence when the document hash changes", async () => {
    const presentedToken = await createAgreementPresentedToken(session, agreement);
    await expect(verifyLegalReviewToken(presentedToken, session, { ...agreement, documentSha256: "b".repeat(64) }, "presented")).rejects.toThrow();
  });

  it("does not let a presentation token masquerade as completed review evidence", async () => {
    const presentedToken = await createAgreementPresentedToken(session, agreement);
    await expect(verifyLegalReviewToken(presentedToken, session, agreement, "reviewed")).rejects.toThrow();
  });
});
