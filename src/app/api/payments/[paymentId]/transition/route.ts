import { NextResponse } from "next/server";
import { getClinicSession } from "@/lib/auth/session";
import { networkAccessErrorResponse } from "@/lib/network-access-http";
import { transitionPayment } from "@/lib/repositories/payment-repository";

export async function POST(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  const session = await getClinicSession();
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try { const { paymentId } = await params; return NextResponse.json({ data: await transitionPayment(session, paymentId, await request.json()) }); }
  catch (error) { return networkAccessErrorResponse(error); }
}
