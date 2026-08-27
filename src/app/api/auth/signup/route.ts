import { NextResponse } from "next/server";
import { requestMetadata } from "@/lib/auth/request-metadata";
import {
  ACCOUNT_SESSION_COOKIE_NAME,
  accountSessionCookieOptions,
  signAccountSessionToken,
} from "@/lib/auth/account-token";
import {
  createFreeMemberAccount,
  FreeMemberSignupError,
  freeMemberSignupSchema,
} from "@/lib/auth/free-member-signup";
import {
  assertMemberSignupAllowed,
  MemberSignupAdmissionError,
} from "@/lib/auth/member-signup-attestation";
import {
  MemberSignupLegalNotReadyError,
  recordMemberSignupAcceptance,
} from "@/lib/legal/member-signup-legal";
import { isSameOriginMutation } from "@/lib/security/same-origin-post";

const noStore = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  if (process.env.KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Free Klinikos membership is not enabled in this deployment." },
      { status: 404, headers: noStore },
    );
  }

  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Same-origin request required." },
      { status: 403, headers: noStore },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = freeMemberSignupSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid name, email, and strong password." },
      { status: 400, headers: noStore },
    );
  }

  const metadata = requestMetadata(request);

  try {
    await assertMemberSignupAllowed({
      ipAddress: metadata.ipAddress,
      email: parsed.data.email,
    });

    const acceptance = await recordMemberSignupAcceptance({
      name: parsed.data.name,
      email: parsed.data.email,
      acceptedTerms: parsed.data.acceptedTerms,
      acceptedPrivacy: parsed.data.acceptedPrivacy,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    const { session } = await createFreeMemberAccount(parsed.data, acceptance, metadata);
    const token = await signAccountSessionToken(session);
    const response = NextResponse.json(
      { ok: true, redirectTo: "/member" },
      { status: 201, headers: noStore },
    );
    response.cookies.set(ACCOUNT_SESSION_COOKIE_NAME, token, accountSessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof MemberSignupAdmissionError) {
      const headers: Record<string, string> = { ...noStore };
      if (error.retryAfterSeconds) headers["Retry-After"] = String(error.retryAfterSeconds);
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    }
    if (error instanceof MemberSignupLegalNotReadyError) {
      return NextResponse.json(
        { error: "Member signup is waiting for approved baseline terms and privacy documents." },
        { status: 503, headers: noStore },
      );
    }
    if (error instanceof FreeMemberSignupError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: noStore });
    }
    return NextResponse.json(
      { error: "Account creation is temporarily unavailable." },
      { status: 503, headers: noStore },
    );
  }
}
