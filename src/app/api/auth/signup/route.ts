import { NextResponse } from "next/server";
import { requestMetadata } from "@/lib/auth/request-metadata";
import {
  ACCOUNT_SESSION_COOKIE_NAME,
  accountSessionCookieOptions,
} from "@/lib/auth/account-session";
import { signAccountSessionToken } from "@/lib/auth/account-token";
import {
  checkMemberSignupRateLimit,
  recordMemberSignupAttempt,
} from "@/lib/auth/rate-limit";
import {
  createFreeMemberAccount,
  FreeMemberSignupError,
  freeMemberSignupSchema,
} from "@/lib/auth/free-member-signup";
import { readAcceptedEntryProof } from "@/lib/legal/entry-access";
import { ENTRY_GATE_COOKIE_NAME } from "@/lib/legal/entry-token";
import { isSameOriginMutation } from "@/lib/security/same-origin-post";

export async function POST(request: Request) {
  if (process.env.KLINIKOS_FREE_MEMBER_SIGNUP_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Free Klinikos membership is not enabled in this deployment." },
      { status: 404, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Same-origin request required." },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = freeMemberSignupSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid name, email, and strong password." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const metadata = requestMetadata(request);
  const rateKey = `${metadata.ipAddress ?? "unknown"}:${parsed.data.email}`;
  const limit = checkMemberSignupRateLimit(rateKey);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many account-creation attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Cache-Control": "private, no-store",
          "Retry-After": String(limit.retryAfterSeconds),
        },
      },
    );
  }
  recordMemberSignupAttempt(rateKey);

  const entryProof = await readAcceptedEntryProof();
  if (!entryProof) {
    return NextResponse.json(
      {
        error: "Enter Klinikos through the protected-entry agreement before creating an account.",
        redirectTo: "/access?returnTo=%2Fsignup",
      },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const { session } = await createFreeMemberAccount(parsed.data, entryProof, metadata);
    const token = await signAccountSessionToken(session);
    const response = NextResponse.json(
      { ok: true, redirectTo: "/member" },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
    response.cookies.set(ACCOUNT_SESSION_COOKIE_NAME, token, accountSessionCookieOptions());
    response.cookies.set(ENTRY_GATE_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    if (error instanceof FreeMemberSignupError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    return NextResponse.json(
      { error: "Account creation is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
