import "server-only";

import { can, type ClinicAction } from "@/lib/auth/rbac";
import type { ClinicSession } from "@/lib/auth/types";
import { db } from "@/lib/db";

const SALES_OWNER_SLUG = process.env.CLINICOS_SALES_ORGANIZATION_SLUG?.trim() || "clinicos-by-zumi";

export class PlatformSalesAccessError extends Error {
  constructor(message = "Platform commercial activation access is not permitted for this workspace.", readonly status = 403) {
    super(message);
  }
}

/**
 * The generic `sales` RBAC capability is intentionally useful inside ordinary clinic
 * CRM/sales workflows. It is therefore NOT sufficient for the cross-customer Klinikos
 * activation ledger. Platform commercial administration additionally requires the
 * authenticated session to belong to the configured Klinikos sales organization.
 */
export async function requirePlatformSalesWorkspace(session: ClinicSession, action: ClinicAction) {
  if (!can(session.role, "sales", action)) throw new PlatformSalesAccessError();
  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { id: true, slug: true, status: true },
  });
  if (!organization || organization.status !== "active" || organization.slug !== SALES_OWNER_SLUG) {
    throw new PlatformSalesAccessError();
  }
  return organization;
}
