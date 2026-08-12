import { NextResponse } from "next/server";
import { z } from "zod";
import { getClinicSession } from "@/lib/auth/session";
import { roleMayPurchaseCommercialProduct } from "@/lib/commercial/access-policy";
import { getCommercialProduct, commercialProductKeys } from "@/lib/commercial/product-catalog";
import { selectCheckoutConnector } from "@/lib/commercial/payment-connectors";
import { createCommercialCheckoutIntent } from "@/lib/commercial/payment-evidence-repository";

const NO_STORE = { "Cache-Control": "private, no-store" } as const;

const requestSchema = z.object({
  productKey: z.enum(commercialProductKeys),
});

function absoluteUrl(request: Request, path: string) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.APP_URL?.trim();
  if (configured) return new URL(path, configured).toString();
  return new URL(path, request.url).toString();
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid checkout request." }, { status: 400, headers: NO_STORE });

  if (!roleMayPurchaseCommercialProduct(session.role, parsed.data.productKey)) {
    return NextResponse.json({ error: "This role cannot purchase that Klinikos access path." }, { status: 403, headers: NO_STORE });
  }

  const product = getCommercialProduct(parsed.data.productKey);
  if (!product) return NextResponse.json({ error: "Unknown Klinikos access path." }, { status: 404, headers: NO_STORE });

  const selected = selectCheckoutConnector();
  if (!selected.ok || !selected.connector.createCheckout) {
    return NextResponse.json({ error: selected.detail }, { status: 503, headers: NO_STORE });
  }

  const intent = await createCommercialCheckoutIntent({
    organizationId: session.organizationId,
    email: session.email,
    provider: selected.connector.key,
    productKey: product.key,
  });

  try {
    const checkout = await selected.connector.createCheckout({
      product,
      organizationId: session.organizationId,
      email: session.email,
      state: intent.state,
      returnUrl: absoluteUrl(request, `/commercial/return?state=${encodeURIComponent(intent.state)}`),
    });

    return NextResponse.json(
      {
        data: {
          provider: checkout.provider,
          checkoutUrl: checkout.checkoutUrl,
          processorVerificationAvailable: checkout.processorVerificationAvailable,
          product: { key: product.key, label: product.label, boundary: product.boundary },
          expiresAt: intent.expiresAt.toISOString(),
        },
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout could not be created." },
      { status: 503, headers: NO_STORE },
    );
  }
}
