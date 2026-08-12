import { NextResponse } from "next/server";
import { z } from "zod";
import { enforceApiPermission } from "@/lib/auth/api-authorization";
import { getClinicSession } from "@/lib/auth/session";
import { accessPaymentVerificationSchema } from "@/lib/commerce/access-payment-rules";
import { listAccessPayments, reviewPaidOnboarding, verifyAccessPayment } from "@/lib/commerce/access-payment-service";

export const dynamic = "force-dynamic";

const reviewSchema = z.object({
  paymentId: z.string().trim().min(1).max(64),
  reviewDecision: z.enum(["approve", "reject"]),
  note: z.string().trim().min(8).max(800),
});

export async function GET(request: Request) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const denied = await enforceApiPermission(session, "sales", "manage", { request });
  if (denied) return denied;
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Payment storage is unavailable." }, { status: 503 });

  const url = new URL(request.url);
  const payments = await listAccessPayments(session, {
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

  const body = await request.json().catch(() => null);
  const reviewParsed = reviewSchema.safeParse(body);
  if (reviewParsed.success) {
    const reviewed = await reviewPaidOnboarding(session, {
      paymentId: reviewParsed.data.paymentId,
      decision: reviewParsed.data.reviewDecision,
      note: reviewParsed.data.note,
    });
    if (!reviewed.ok) {
      return NextResponse.json(
        { error: reviewed.reason === "not_found" ? "Paid onboarding not found." : "Payment is not settled.", reason: reviewed.reason },
        { status: reviewed.reason === "not_found" ? 404 : 409 },
      );
    }
    return NextResponse.json({ ok: true, data: reviewed.payment, reviewApproved: reviewed.approved }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const parsed = accessPaymentVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Supply a payment action or review decision with a note of at least 8 characters." }, { status: 400 });
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
