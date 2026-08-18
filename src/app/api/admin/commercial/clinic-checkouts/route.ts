import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/rbac";
import { requireClinicSession } from "@/lib/auth/session";
import { ClinicProvisioningError, createClinicPlanCheckout, listClinicPlanCheckouts, reconcileClinicPlanCheckout } from "@/lib/commercial/clinic-provisioning";
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

export async function GET() {
  try {
    const session = await requireClinicSession();
    if (!can(session.role, "sales", "read")) return NextResponse.json({ error: "Commercial activation access is not permitted for this role." }, { status: 403 });
    const checkouts = await listClinicPlanCheckouts(session);
    return NextResponse.json({ ok: true, checkouts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ClinicProvisioningError || error instanceof StripeClinicSubscriptionError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Clinic activation desk is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireClinicSession();
    const parsed = actionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "The commercial activation request is invalid." }, { status: 400 });

    if (parsed.data.action === "create_checkout") {
      if (!can(session.role, "sales", "create")) return NextResponse.json({ error: "Creating clinic checkouts is not permitted for this role." }, { status: 403 });
      const recurringStripe = stripeRecurringSubscriptionStatus();
      const result = recurringStripe.processorVerification
        ? await createStripeClinicSubscriptionCheckout(session, parsed.data)
        : await createClinicPlanCheckout(session, parsed.data);
      return NextResponse.json({ ok: true, action: "checkout_created", result }, { status: 201 });
    }

    if (!can(session.role, "sales", "update")) return NextResponse.json({ error: "Updating clinic activation is not permitted for this role." }, { status: 403 });

    if (parsed.data.action === "issue_activation") {
      const result = await issueStripeClinicActivationLink(session, parsed.data.intentId);
      return NextResponse.json({ ok: true, action: "activation_link_issued", result });
    }

    const result = await reconcileClinicPlanCheckout(session, parsed.data.intentId);
    return NextResponse.json({ ok: true, action: "payment_reconciled", result });
  } catch (error) {
    if (error instanceof ClinicProvisioningError || error instanceof StripeClinicSubscriptionError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "The request is invalid." }, { status: 400 });
    return NextResponse.json({ error: "The commercial activation action could not be completed." }, { status: 503 });
  }
}
