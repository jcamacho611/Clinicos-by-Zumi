import { NextResponse } from "next/server";
import { getAuthenticationSession } from "@/lib/auth/session";
import { agreementSha256, buildGlobalAgreement } from "@/lib/legal/global-agreement";
import { assertLegalExecutionConfigured } from "@/lib/legal/legal-config";
import { createAgreementReviewedToken, verifyLegalReviewToken } from "@/lib/legal/review-token";
import { recordLegalEvent } from "@/lib/legal/legal-access";
import { isSameOriginMutation } from "@/lib/security/same-origin-post";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Same-origin request required." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }

  const session = await getAuthenticationSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }

  const body = await request.json().catch(() => null) as { presentedToken?: unknown } | null;
  if (!body || typeof body.presentedToken !== "string") {
    return NextResponse.json({ error: "Agreement presentation evidence is required." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }

  try {
    const agreement = buildGlobalAgreement(assertLegalExecutionConfigured());
    const identity = {
      documentKey: agreement.documentKey,
      documentVersion: agreement.documentVersion,
      documentSha256: agreementSha256(agreement),
    };
    const presented = await verifyLegalReviewToken(body.presentedToken, session, identity, "presented");
    const reachedEndAt = new Date();
    const reviewToken = await createAgreementReviewedToken(presented, reachedEndAt);

    await recordLegalEvent({
      session,
      eventType: "legal.agreement.reached_end",
      agreement,
      metadata: { reachedEndAt: reachedEndAt.toISOString() },
    });

    return NextResponse.json(
      { reviewToken, reachedEndAt: reachedEndAt.toISOString() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "We could not verify this agreement review. Refresh the agreement and try again." },
      { status: 409, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
