import { NextResponse } from "next/server";
import { z } from "zod";
import { getClinicSession } from "@/lib/auth/session";
import { roleMayReconcileCommercialPayment } from "@/lib/commercial/access-policy";
import { commercialProductKeys } from "@/lib/commercial/product-catalog";
import { applyManualCommercialPayment } from "@/lib/commercial/payment-evidence-repository";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

const bodySchema = z.object({
  productKey: z.enum(commercialProductKeys),
  provider: z.literal("godaddy"),
  externalReference: z.string().trim().min(3).max(180),
  amountCents: z.number().int().positive().max(10_000_000),
  currency: z.string().trim().length(3).optional(),
});

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  if (!roleMayReconcileCommercialPayment(session.role)) {
    return NextResponse.json({ error: "This role cannot reconcile payments." }, { status: 403, headers: NO_STORE });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment reconciliation." }, { status: 400, headers: NO_STORE });

  try {
    const result = await applyManualCommercialPayment({
      organizationId: session.organizationId,
      actorId: session.userId,
      productKey: parsed.data.productKey,
      provider: parsed.data.provider,
      externalReference: parsed.data.externalReference,
      amountCents: parsed.data.amountCents,
      currency: parsed.data.currency,
    });
    return NextResponse.json({ data: result }, { headers: NO_STORE });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment could not be reconciled." },
      { status: 409, headers: NO_STORE },
    );
  }
}
