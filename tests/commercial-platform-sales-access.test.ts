import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClinicSession } from "@/lib/auth/types";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { organization: { findUnique } },
}));

import { can } from "@/lib/auth/rbac";
import { PlatformSalesAccessError, requirePlatformSalesWorkspace } from "@/lib/commercial/platform-sales-access";

function session(role: ClinicSession["role"], organizationId = "org_customer") {
  return {
    userId: "user_test",
    organizationId,
    role,
    email: "operator@example.test",
  } as ClinicSession;
}

describe("platform commercial activation authorization", () => {
  beforeEach(() => findUnique.mockReset());

  it("proves generic clinic-admin sales permission alone is not enough", async () => {
    const ordinaryAdmin = session("administrator");
    expect(can(ordinaryAdmin.role, "sales", "read")).toBe(true);
    findUnique.mockResolvedValue({ id: ordinaryAdmin.organizationId, slug: "customer-clinic", status: "active" });

    await expect(requirePlatformSalesWorkspace(ordinaryAdmin, "read")).rejects.toBeInstanceOf(PlatformSalesAccessError);
  });

  it("allows a sales-capable role only inside the configured platform sales workspace", async () => {
    const platformAdmin = session("administrator", "org_sales");
    findUnique.mockResolvedValue({ id: "org_sales", slug: "clinicos-by-zumi", status: "active" });

    await expect(requirePlatformSalesWorkspace(platformAdmin, "create")).resolves.toMatchObject({ id: "org_sales" });
  });

  it("denies inactive or nonexistent sales workspaces", async () => {
    const platformOwner = session("clinic_owner", "org_sales");
    findUnique.mockResolvedValueOnce({ id: "org_sales", slug: "clinicos-by-zumi", status: "inactive" });
    await expect(requirePlatformSalesWorkspace(platformOwner, "update")).rejects.toBeInstanceOf(PlatformSalesAccessError);

    findUnique.mockResolvedValueOnce(null);
    await expect(requirePlatformSalesWorkspace(platformOwner, "update")).rejects.toBeInstanceOf(PlatformSalesAccessError);
  });

  it("denies roles that do not have the required sales action even inside the platform workspace", async () => {
    const provider = session("provider", "org_sales");
    expect(can(provider.role, "sales", "read")).toBe(false);
    findUnique.mockResolvedValue({ id: "org_sales", slug: "clinicos-by-zumi", status: "active" });

    await expect(requirePlatformSalesWorkspace(provider, "read")).rejects.toBeInstanceOf(PlatformSalesAccessError);
    expect(findUnique).not.toHaveBeenCalled();
  });
});
