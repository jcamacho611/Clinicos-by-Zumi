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

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_checkout"), clinicName: z.string(), email: z.string(), productKey: z.string() }),
  z.object({ action: z.literal("reconcile"), intentId: z.string().uuid(), confirmation: z.literal("I_VERIFIED_PAYMENT") }),
  z.object({ action: z.literal("issue_activation"), intentId: z.string().uuid() }),
]);

function commercialError(error: unknown) {
  if (error instanceof ClinicProvisioningError || error instanceof StripeClinicSubscriptionError || error instanceof PlatformSalesAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}

export async function GET() {
  try {
    const session = await requireClinicSession();
    await requirePlatformSalesWorkspace(session, "read");
    const checkouts = await listClinicPlanCheckouts(session);
    return NextResponse.json({ ok: true, checkouts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const response = commercialError(error);
    if (response) return response;
    return NextResponse.json({ error: "Clinic activation desk is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireClinicSession();
    const parsed = actionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "The commercial activation request is invalid." }, { status: 400 });

    if (parsed.data.action === "create_checkout") {
      await requirePlatformSalesWorkspace(session, "create");
      const recurringStripe = stripeRecurringSubscriptionStatus();
      const result = recurringStripe.processorVerification
        ? await createStripeClinicSubscriptionCheckout(session, parsed.data)
        : await createClinicPlanCheckout(session, parsed.data);
      return NextResponse.json({ ok: true, action: "checkout_created", result }, { status: 201 });
    }

    await requirePlatformSalesWorkspace(session, "update");
    if (parsed.data.action === "issue_activation") {
      const result = await issueStripeClinicActivationLink(session, parsed.data.intentId);
      return NextResponse.json({ ok: true, action: "activation_link_issued", result });
    }

    const result = await reconcileClinicPlanCheckout(session, parsed.data.intentId);
    return NextResponse.json({ ok: true, action: "payment_reconciled", result });
  } catch (error) {
    const response = commercialError(error);
    if (response) return response;
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "The request is invalid." }, { status: 400 });
    return NextResponse.json({ error: "The commercial activation action could not be completed." }, { status: 503 });
  }
}
