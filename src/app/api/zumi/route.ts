import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { invokeZumi } from "@/features/zumi/gateway";
import { resolveOrganizationEntitlements } from "@/features/zumi/entitlements";
import { ZUMI_BASELINE_PERMISSION, zumiCapabilities, zumiOrbStates } from "@/features/zumi/schemas";
import { zumiGatewayStatus } from "@/features/zumi/providers";

/**
 * The only HTTP entry point to Zumi.
 *
 * It is deliberately thin. Every decision — permission, entitlement, tenant,
 * redaction, audit — belongs to the gateway, so a second route added later cannot
 * accidentally implement a weaker version of any of them.
 *
 * Both methods declare the baseline `ai:read` gate here as well as inside the
 * gateway. That is not redundancy for its own sake: a route is the thing a reviewer
 * reads to learn what it requires, and the repository's authorization contract test
 * asserts every session-bearing method states its gate at the door.
 */

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

/**
 * The request body.
 *
 * Note what is absent: no organizationId, no role, no entitlements, no
 * requiresHumanReview. Those are resolved server-side from the session. A body that
 * could name its own organization would make the tenant check theatre.
 */
const requestSchema = z.object({
  capability: z.string().trim().min(2).max(80),
  question: z.string().trim().min(3).max(2_000),
  /** Structured operational context. Redacted by the gateway before egress. */
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, ZUMI_BASELINE_PERMISSION.resource, ZUMI_BASELINE_PERMISSION.action)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE });
  }

  const status = zumiGatewayStatus();
  const entitlements = await resolveOrganizationEntitlements(session.organizationId);

  return NextResponse.json(
    {
      data: {
        status,
        orbStates: zumiOrbStates,
        // The catalog is descriptive, not a grant. A capability listed here is still
        // subject to every check in the gateway when it is actually invoked.
        capabilities: zumiCapabilities.map((capability) => ({
          key: capability.key,
          label: capability.label,
          tier: capability.tier,
          produces: capability.produces,
          entitled: capability.requiresEntitlement === null || entitlements.includes(capability.requiresEntitlement),
          requiresEntitlement: capability.requiresEntitlement,
        })),
      },
    },
    { headers: NO_STORE },
  );
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!can(session.role, ZUMI_BASELINE_PERMISSION.resource, ZUMI_BASELINE_PERMISSION.action)) {
    return NextResponse.json({ error: "Access denied." }, { status: 403, headers: NO_STORE });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400, headers: NO_STORE });
  }

  const entitlements = await resolveOrganizationEntitlements(session.organizationId);

  const result = await invokeZumi({
    session,
    capability: parsed.data.capability,
    // The session's organization, passed as the requested one. There is no path by
    // which a caller supplies this value.
    organizationId: session.organizationId,
    entitlements,
    question: parsed.data.question,
    context: parsed.data.context,
  });

  if (!result.allowed) {
    return NextResponse.json(
      { error: result.message, reason: result.reason },
      { status: result.status, headers: NO_STORE },
    );
  }

  return NextResponse.json({ data: result.response }, { headers: NO_STORE });
}
