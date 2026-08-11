import { NextResponse } from "next/server";
import { z } from "zod";
import { requireClinicSession } from "@/lib/auth/session";
import { resolveIdentityContextForSession } from "@/lib/identity/context";
import { listIntelligenceConnections, upsertIntelligenceConnection } from "@/lib/intelligence/connections";

const connectSchema = z.object({
  providerKey: z.string().min(1).max(80),
  authorizationMethod: z.enum(["api_key", "oauth", "organization", "enterprise", "bring_your_own_key"]),
  secretReference: z.string().min(1).max(500),
  modelPreference: z.string().max(120).nullable().optional(),
});

export async function GET() {
  const session = await requireClinicSession();
  const context = await resolveIdentityContextForSession(session);

  const connections = await listIntelligenceConnections({
    identityId: context.identityId.startsWith("legacy:") ? undefined : context.identityId,
    organizationId: context.activeOrganizationId,
  });

  return NextResponse.json({
    connections: connections.map((connection) => ({
      id: connection.id,
      scopeType: connection.scopeType,
      providerKey: connection.providerKey,
      authorizationMethod: connection.authorizationMethod,
      modelPreference: connection.modelPreference,
      paysUsage: connection.paysUsage,
      phiEligible: connection.phiEligible,
      status: connection.status,
      updatedAt: connection.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireClinicSession();
  const context = await resolveIdentityContextForSession(session);
  if (context.identityId.startsWith("legacy:")) {
    return NextResponse.json({ error: "Universal identity migration is required before personal AI connections can be saved." }, { status: 409 });
  }

  const parsed = connectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid AI connection request." }, { status: 400 });
  }

  const connection = await upsertIntelligenceConnection({
    scopeType: "identity",
    identityId: context.identityId,
    providerKey: parsed.data.providerKey,
    authorizationMethod: parsed.data.authorizationMethod,
    secretReference: parsed.data.secretReference,
    modelPreference: parsed.data.modelPreference ?? null,
    paysUsage: "identity",
    // A public client may never self-assert PHI eligibility. That requires a server-side
    // compliance decision tied to the provider contract, retention mode, and BAA evidence.
    phiEligible: false,
    status: "pending",
  });

  return NextResponse.json({
    connection: {
      id: connection.id,
      providerKey: connection.providerKey,
      authorizationMethod: connection.authorizationMethod,
      modelPreference: connection.modelPreference,
      paysUsage: connection.paysUsage,
      phiEligible: connection.phiEligible,
      status: connection.status,
    },
  }, { status: 201 });
}
