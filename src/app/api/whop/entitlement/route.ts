import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { whopAdapterStatus } from "@/lib/commerce/whop-client";
import { findEntitlementForIdentity } from "@/lib/commerce/whop-entitlements";
import { evaluateEntitlement, type EntitlementRecord } from "@/lib/commerce/whop-rules";
import { summarizeGridMarketplaceAccess } from "@/lib/grid-access";

/**
 * Report the signed-in account's own paid-access state.
 *
 * Client-supplied identifiers are ignored: the entitlement is resolved from the
 * session, so this route cannot be used to enumerate anyone else's purchases.
 *
 * Roles that administer the tenant read it through `settings`; marketplace
 * participants, including contractors, read it through `grid`. Roles with neither
 * do not take part in paid entry and are denied.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = can(session.role, "settings", "read") ? null : await enforceApiPermission(session, "grid", "read");
  if (denied) return denied;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Entitlement storage is unavailable." }, { status: 503 });

  const entitlement = await findEntitlementForIdentity({ email: session.email, organizationId: session.organizationId });
  const record = (entitlement as EntitlementRecord | null) ?? null;
  const evaluated = evaluateEntitlement(record);

  return NextResponse.json(
    {
      data: {
        adapter: whopAdapterStatus(),
        entitlement: entitlement
          ? {
              tierKey: entitlement.tierKey,
              state: entitlement.state,
              membershipStatus: entitlement.membershipStatus,
              validUntil: entitlement.validUntil?.toISOString() ?? null,
              grantedAt: entitlement.grantedAt?.toISOString() ?? null,
              lastVerifiedAt: entitlement.lastVerifiedAt?.toISOString() ?? null,
              claimedByOrganization: Boolean(entitlement.organizationId),
            }
          : null,
        active: evaluated.active,
        reason: evaluated.reason,
        capabilities: evaluated.capabilities,
        // Credential readiness is reported separately by the GRID workspace; this
        // summary reflects the payment gate only.
        gridMarketplace: summarizeGridMarketplaceAccess({ entitlement: record, providerReady: false }),
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
