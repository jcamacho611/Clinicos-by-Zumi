import { NextResponse } from "next/server";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { accessPaymentVerificationSchema } from "@/lib/commerce/access-payment-rules";
import { listAccessPayments, verifyAccessPayment } from "@/lib/commerce/access-payment-service";

/**
 * Administrator verification of marketplace access payments.
 *
 * Requires the sales-manage permission, an explicit action, and a human note.
 * Portal access is derived from the resulting payment status and the product's
 * review requirement, never set directly by the caller.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "sales", "manage", { request });
  if (denied) return denied;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Payment storage is unavailable." }, { status: 503 });

  const url = new URL(request.url);
  const payments = await listAccessPayments({
    status: url.searchParams.get("status") ?? undefined,
    roleTarget: url.searchParams.get("roleTarget") ?? undefined,
  });

  return NextResponse.json({ data: payments }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "sales", "manage", { request });
  if (denied) return denied;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Payment storage is unavailable." }, { status: 503 });

  const parsed = accessPaymentVerificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Supply a payment, an action, and a note of at least 8 characters." }, { status: 400 });
  }

  const result = await verifyAccessPayment(session, parsed.data);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : result.reason === "reference_required" ? 422 : 409;
    const message = result.reason === "not_found"
      ? "Payment not found."
      : result.reason === "reference_required"
        ? "A provider payment reference is required before a payment can be recorded as settled."
        : "That transition is not allowed from the payment's current status.";
    return NextResponse.json({ error: message, reason: result.reason }, { status });
  }

  return NextResponse.json({ ok: true, data: result.payment }, { headers: { "Cache-Control": "private, no-store" } });
}
