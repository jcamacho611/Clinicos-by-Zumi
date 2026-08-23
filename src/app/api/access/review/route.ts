import { NextResponse } from "next/server";
import { agreementSha256 } from "@/lib/legal/global-agreement";
import { buildEntryAgreement } from "@/lib/legal/entry-agreement";
import { assertLegalExecutionConfigured } from "@/lib/legal/legal-config";
import { createEntryReviewedToken, verifyEntryToken } from "@/lib/legal/entry-token";
import { isSameOriginMutation } from "@/lib/security/same-origin-post";

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Same-origin request required." },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const body = await request.json().catch(() => null) as { presentedToken?: unknown } | null;
  if (!body || typeof body.presentedToken !== "string") {
    return NextResponse.json(
      { error: "Protected-entry presentation evidence is required." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const agreement = buildEntryAgreement(assertLegalExecutionConfigured());
    const identity = {
      documentKey: agreement.documentKey,
      documentVersion: agreement.documentVersion,
      documentSha256: agreementSha256(agreement),
    };
    const presented = await verifyEntryToken(body.presentedToken, identity, "presented");
    const reachedEndAt = new Date();
    const reviewToken = await createEntryReviewedToken(presented, reachedEndAt);

    return NextResponse.json(
      { reviewToken, reachedEndAt: reachedEndAt.toISOString() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "We could not verify this protected-entry review. Refresh and try again." },
      { status: 409, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
