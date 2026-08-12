import { NextResponse } from "next/server";
import { z } from "zod";
import { requireClinicSession } from "@/lib/auth/session";
import { ClinicProvisioningError, createClinicPlanCheckout, listClinicPlanCheckouts, reconcileClinicPlanCheckout } from "@/lib/commercial/clinic-provisioning";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_checkout"), clinicName: z.string(), email: z.string(), productKey: z.string() }),
  z.object({ action: z.literal("reconcile"), intentId: z.string().uuid(), confirmation: z.literal("I_VERIFIED_PAYMENT") }),
]);

export async function GET() {
  try {
    const session = await requireClinicSession();
    const checkouts = await listClinicPlanCheckouts(session);
    return NextResponse.json({ ok: true, checkouts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ClinicProvisioningError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Clinic activation desk is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireClinicSession();
    const parsed = actionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "The commercial activation request is invalid." }, { status: 400 });

    if (parsed.data.action === "create_checkout") {
      const result = await createClinicPlanCheckout(session, parsed.data);
      return NextResponse.json({ ok: true, action: "checkout_created", result }, { status: 201 });
    }

    const result = await reconcileClinicPlanCheckout(session, parsed.data.intentId);
    return NextResponse.json({ ok: true, action: "payment_reconciled", result });
  } catch (error) {
    if (error instanceof ClinicProvisioningError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "The request is invalid." }, { status: 400 });
    return NextResponse.json({ error: "The commercial activation action could not be completed." }, { status: 503 });
  }
}
