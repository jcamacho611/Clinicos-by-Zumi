import { NextResponse } from "next/server";
import { z } from "zod";
import { requireClinicSession } from "@/lib/auth/session";
import { ClinicProvisioningError, createClinicPlanCheckout, listClinicPlanCheckouts, reconcileClinicPlanCheckout } from "@/lib/commercial/clinic-provisioning";
import { PlatformSalesAccessError, requirePlatformSalesWorkspace } from "@/lib/commercial/platform-sales-access";
import {
  createStripeClinicSubscriptionCheckout,
  issueStripeClinicActivationLink,
  stripeRecurringSubscriptionStatus,
  StripeClinicSubscriptionError,
} from "@/lib/commercial/stripe-clinic-subscriptions";
import { PRIVATE_NO_STORE_HEADERS } from "@/lib/security/headers";

const NO_STORE = PRIVATE_NO_STORE_HEADERS;

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_checkout"), clinicName: z.string(), email: z.string(), productKey: z.string() }),
  z.object({ action: z.literal("reconcile"), intentId: z.string().uuid(), confirmation: z.literal("I_VERIFIED_PAYMENT") }),
  z.object({ action: z.literal("issue_activation"), intentId: z.string().uuid() }),
]);

function commercialError(error: unknown) {
  if (!(error instanceof ClinicProvisioningError || error instanceof StripeClinicSubscriptionError || error instanceof PlatformSalesAccessError)) {
    return null;
  }
  const message = error.status === 401
    ? "Authentication required."
    : error.status === 403
      ? "Access denied."
      : error.status === 404
        ? "The requested commercial record was not found."
        : error.status === 409
          ? "This action conflicts with the current payment or activation state."
          : error.status >= 500
            ? "Clinic activation is temporarily unavailable."
            : "The commercial activation request is invalid.";
  return NextResponse.json({ error: message }, { status: error.status, headers: NO_STORE });
}

function checkoutListView(checkouts: Awaited<ReturnType<typeof listClinicPlanCheckouts>>) {
  return checkouts.map((checkout) => ({
    id: checkout.id,
    clinicName: checkout.clinicName,
    email: checkout.email,
    productLabel: checkout.productLabel,
    status: checkout.status,
    expectedAmountCents: checkout.expectedAmountCents,
    currency: checkout.currency,
    expiresAt: checkout.expiresAt,
    completedAt: checkout.completedAt,
    createdAt: checkout.createdAt,
  }));
}

type CheckoutCreationResult =
  | Awaited<ReturnType<typeof createClinicPlanCheckout>>
  | Awaited<ReturnType<typeof createStripeClinicSubscriptionCheckout>>;

function checkoutCreationView(result: CheckoutCreationResult) {
  return {
    id: result.id,
    productLabel: result.productLabel,
    expectedAmountCents: result.expectedAmountCents,
    checkoutUrl: result.checkoutUrl,
    expiresAt: result.expiresAt,
  };
}

export async function GET() {
  try {
    const session = await requireClinicSession();
    await requirePlatformSalesWorkspace(session, "read");
    const checkouts = await listClinicPlanCheckouts(session);
    return NextResponse.json({ ok: true, checkouts: checkoutListView(checkouts) }, { headers: NO_STORE });
  } catch (error) {
    const response = commercialError(error);
    if (response) return response;
    return NextResponse.json({ error: "Clinic activation desk is temporarily unavailable." }, { status: 503, headers: NO_STORE });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireClinicSession();
    const parsed = actionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "The commercial activation request is invalid." }, { status: 400, headers: NO_STORE });

    if (parsed.data.action === "create_checkout") {
      await requirePlatformSalesWorkspace(session, "create");
      const recurringStripe = stripeRecurringSubscriptionStatus();
      const result = recurringStripe.processorVerification
        ? await createStripeClinicSubscriptionCheckout(session, parsed.data)
        : await createClinicPlanCheckout(session, parsed.data);
      return NextResponse.json(
        { ok: true, action: "checkout_created", checkout: checkoutCreationView(result) },
        { status: 201, headers: NO_STORE },
      );
    }

    await requirePlatformSalesWorkspace(session, "update");
    if (parsed.data.action === "issue_activation") {
      const result = await issueStripeClinicActivationLink(session, parsed.data.intentId);
      return NextResponse.json(
        { ok: true, action: "activation_link_issued", activationUrl: result.activationUrl },
        { headers: NO_STORE },
      );
    }

    const result = await reconcileClinicPlanCheckout(session, parsed.data.intentId);
    return NextResponse.json(
      {
        ok: true,
        action: "payment_reconciled",
        activation: {
          productLabel: result.productLabel,
          periodEndsAt: result.periodEndsAt,
          activationUrl: result.activationUrl,
        },
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    const response = commercialError(error);
    if (response) return response;
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "The commercial activation request is invalid." }, { status: 400, headers: NO_STORE });
    }
    return NextResponse.json({ error: "The commercial activation action could not be completed." }, { status: 503, headers: NO_STORE });
  }
}
