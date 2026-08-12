import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/rbac";
import { getClinicSession } from "@/lib/auth/session";
import { invokeFundedZumi } from "@/features/zumi/funded-invocation";
import { resolveOrganizationEntitlements } from "@/features/zumi/entitlements";
import { ZUMI_BASELINE_PERMISSION, zumiCapabilities, zumiOrbStates } from "@/features/zumi/schemas";
import { zumiGatewayStatus } from "@/features/zumi/providers";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

const requestSchema = z.object({
  capability: z.string().trim().min(2).max(80),
  question: z.string().trim().min(3).max(2_000),
  context: z.record(z.string(), z.unknown()).optional(),
});

function requestIdFromHeader(request: Request) {
  const supplied = request.headers.get("idempotency-key")?.trim();
  if (supplied && supplied.length <= 160 && /^[A-Za-z0-9._:-]+$/.test(supplied)) return supplied;
  return randomUUID();
}

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
  const result = await invokeFundedZumi({
    session,
    capability: parsed.data.capability,
    organizationId: session.organizationId,
    entitlements,
    question: parsed.data.question,
    context: parsed.data.context,
    idempotencyKey: `zumi:${session.sessionId}:${requestIdFromHeader(request)}`,
  });

  if (!result.allowed) {
    return NextResponse.json(
      { error: result.message, reason: result.reason },
      { status: result.status, headers: NO_STORE },
    );
  }

  return NextResponse.json({ data: result.response }, { headers: NO_STORE });
}
