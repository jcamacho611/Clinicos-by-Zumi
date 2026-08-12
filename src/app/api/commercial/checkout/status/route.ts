import { NextResponse } from "next/server";
import { z } from "zod";
import { getClinicSession } from "@/lib/auth/session";
import { getCommercialCheckoutStatus } from "@/lib/commercial/commercial-status-repository";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;
const stateSchema = z.string().trim().min(16).max(96).regex(/^[A-Za-z0-9_-]+$/);

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });

  const state = new URL(request.url).searchParams.get("state");
  const parsed = stateSchema.safeParse(state);
  if (!parsed.success) return NextResponse.json({ error: "Invalid checkout state." }, { status: 400, headers: NO_STORE });

  const status = await getCommercialCheckoutStatus(session.organizationId, parsed.data);
  if (!status) return NextResponse.json({ error: "Checkout not found." }, { status: 404, headers: NO_STORE });

  return NextResponse.json(
    {
      data: {
        provider: status.provider,
        productKey: status.productKey,
        productLabel: status.productLabel,
        status: status.status,
        completedAt: status.completedAt?.toISOString() ?? null,
        expiresAt: status.expiresAt.toISOString(),
        processorVerificationAvailable: status.processorVerificationAvailable,
      },
    },
    { headers: NO_STORE },
  );
}
