import { NextResponse } from "next/server";
import { z } from "zod";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { safeReturnTo } from "@/lib/auth/return-to";
import { createAnonymousEntryAcceptance } from "@/lib/legal/entry-access";
import { buildEntryAgreement, ENTRY_ACKNOWLEDGMENTS } from "@/lib/legal/entry-agreement";
import { agreementSha256 } from "@/lib/legal/global-agreement";
import { assertLegalExecutionConfigured } from "@/lib/legal/legal-config";
import { ensureAgreementVersionRegistered } from "@/lib/legal/legal-access";
import {
  createEntryAcceptedToken,
  ENTRY_ACCEPTED_TTL_SECONDS,
  ENTRY_GATE_COOKIE_NAME,
  verifyEntryToken,
} from "@/lib/legal/entry-token";
import { isSameOriginMutation } from "@/lib/security/same-origin-post";

const acceptEntrySchema = z.object({
  reviewToken: z.string().min(1).max(5000),
  acknowledgments: z.record(z.string(), z.boolean()),
  idempotencyKey: z.string().uuid(),
  returnTo: z.string().max(500).optional(),
});

function loginHrefFor(returnTo: string | null) {
  if (!returnTo || returnTo.startsWith("/legal/") || returnTo.startsWith("/access")) return "/login";
  if (returnTo === "/login" || returnTo.startsWith("/login?")) return returnTo;
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Same-origin request required." },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Protected-entry acceptance is unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const parsed = acceptEntrySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Complete the agreement review and required acknowledgments before entering Klinikos." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const allAcknowledged = ENTRY_ACKNOWLEDGMENTS.every(({ key }) => parsed.data.acknowledgments[key] === true);
  if (!allAcknowledged) {
    return NextResponse.json(
      { error: "Every required acknowledgment must be affirmed." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const agreement = buildEntryAgreement(assertLegalExecutionConfigured());
    await ensureAgreementVersionRegistered(agreement, ENTRY_ACKNOWLEDGMENTS);
    const documentSha256 = agreementSha256(agreement);
    const agreementIdentity = {
      documentKey: agreement.documentKey,
      documentVersion: agreement.documentVersion,
      documentSha256,
    };
    const reviewed = await verifyEntryToken(parsed.data.reviewToken, agreementIdentity, "reviewed");
    if (!reviewed.reachedEndAt) throw new Error("Review evidence is incomplete.");

    const metadata = requestMetadata(request);
    const acceptedAt = new Date();
    const acceptance = await createAnonymousEntryAcceptance({
      entrySessionId: reviewed.entrySessionId,
      agreement,
      acknowledgments: parsed.data.acknowledgments,
      presentedAt: new Date(reviewed.presentedAt),
      reachedEndAt: new Date(reviewed.reachedEndAt),
      acceptedAt,
      idempotencyKey: parsed.data.idempotencyKey,
      ipAddress: metadata.ipAddress ?? undefined,
      userAgent: metadata.userAgent ?? undefined,
    });
    const acceptedToken = await createEntryAcceptedToken(reviewed, acceptance.id, acceptedAt);
    const returnTo = safeReturnTo(parsed.data.returnTo);
    const response = NextResponse.json(
      {
        ok: true,
        acceptanceId: acceptance.id,
        acceptedAt: acceptance.acceptedAt.toISOString(),
        documentVersion: acceptance.documentVersion,
        loginHref: loginHrefFor(returnTo),
        signupHref: process.env.KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED === "true" ? "/signup" : null,
      },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
    response.cookies.set(ENTRY_GATE_COOKIE_NAME, acceptedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ENTRY_ACCEPTED_TTL_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "We could not verify and record this protected-entry acceptance. Refresh and try again." },
      { status: 409, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
