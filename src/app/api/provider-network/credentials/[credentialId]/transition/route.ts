import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { recordTrustedPathDomainEvent } from "@/lib/orchestration/path-domain-event-bridge";
import { transitionProviderCredential } from "@/lib/repositories/credentialing-repository";

export async function POST(request: Request, { params }: { params: Promise<{ credentialId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { credentialId } = await params;
  const denied = await enforceApiPermission(session, "credentialing", "update", { request, resourceId: credentialId });
  if (denied) return denied;

  try {
    const body = await request.json() as { action?: string };
    const updated = await transitionProviderCredential(session, credentialId, body);

    if (body.action === "verify" && updated.verificationStatus === "verified") {
      const owner = await db.providerCredential.findUnique({
        where: { id: credentialId },
        select: { provider: { select: { userId: true } } },
      });
      const targetActorId = owner?.provider.userId;
      if (targetActorId) {
        await recordTrustedPathDomainEvent(session, {
          eventType: "provider.credentials.reviewed",
          sourceType: "provider_credential",
          sourceId: credentialId,
          targetActorId,
          metadata: { verificationStatus: updated.verificationStatus, credentialType: updated.type },
        });
      }
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    return networkAccessErrorResponse(error);
  }
}
