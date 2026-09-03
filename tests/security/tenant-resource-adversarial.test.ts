import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  appointmentFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  db: {
    appointment: { findMany: dbMocks.appointmentFindMany },
  },
}));

import { listAppointmentsForOrganization } from "@/lib/repositories/appointment-repository";

const read = (path: string) => readFileSync(path, "utf8");

const appointmentRoute = read("src/app/api/appointments/route.ts");
const appointmentRepository = read("src/lib/repositories/appointment-repository.ts");
const referralRoute = read("src/app/api/referrals/route.ts");
const referralRepository = read("src/lib/repositories/referral-repository.ts");
const billingPage = read("src/app/(platform)/billing/page.tsx");
const billingRepository = read("src/lib/repositories/billing-truth-repository.ts");

describe("P16 concrete tenant/resource boundaries", () => {
  it("takes appointment organization scope from the authenticated clinic session", () => {
    expect(appointmentRoute).toContain(
      "listAppointmentsForOrganization(session.organizationId)",
    );
    expect(appointmentRoute).toContain("organizationId: session.organizationId");
    expect(appointmentRepository).toContain("patient: { organizationId }");
    expect(appointmentRepository).toContain(
      "where: { id: current.id, organizationId: input.organizationId, status: current.status }",
    );
    expect(appointmentRepository).toContain("updateMany");
  });

  it("executes appointment reads with appointment and patient organization scope", async () => {
    dbMocks.appointmentFindMany.mockResolvedValueOnce([]);

    await listAppointmentsForOrganization("org-a");

    expect(dbMocks.appointmentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-a",
          patient: { organizationId: "org-a" },
        }),
      }),
    );
  });

  it("requires referral source/destination authority instead of trusting a destination identifier alone", () => {
    expect(referralRoute).toContain(
      "listReferralWorkspace(session.organizationId, session.userId)",
    );
    expect(referralRoute).toContain("createReferral(session, await request.json())");
    expect(referralRepository).toContain("requireActiveConnection");
    expect(referralRepository).toContain("requireActiveAgreement");
    expect(referralRepository).toContain("requireActiveAccessConsent");
    expect(referralRepository).toContain(
      'where: { id: input.patientId, organizationId: session.organizationId, status: "active" }',
    );
    expect(referralRepository).toContain(
      "sourceOrganizationId: session.organizationId",
    );
  });

  it("binds billing patient, claim, and denial reads to the authenticated organization", () => {
    expect(billingPage).toContain("const session = await requireClinicSession()");
    expect(billingPage).toContain("listBillingTruthWorkspace(session)");
    expect(billingRepository).toContain(
      'where: { organizationId: session.organizationId, status: "active" }',
    );
    expect(billingRepository).toContain(
      "where: { organizationId: session.organizationId }",
    );
    expect(billingRepository.match(/organizationId: session\.organizationId/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  });
});
