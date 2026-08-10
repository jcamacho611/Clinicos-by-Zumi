import { NextResponse } from "next/server";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { createEvaluationAccessToken, verifyAccessEmail } from "@/lib/legal/access-verification";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const metadata = requestMetadata(request);

  try {
    const verification = await verifyAccessEmail(token, metadata);
    if (!verification.ok) {
      const denied = new URL("/access", url.origin);
      denied.searchParams.set("verification", verification.reason);
      return NextResponse.redirect(denied, 303);
    }

    const session = createEvaluationAccessToken(verification.email);
    const destination = new URL("/private-demo", url.origin);
    const response = NextResponse.redirect(destination, 303);
    response.cookies.set({
      name: "klinikos_evaluation_access",
      value: session.value,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    const unavailable = new URL("/access", url.origin);
    unavailable.searchParams.set("verification", "unavailable");
    return NextResponse.redirect(unavailable, 303);
  }
}
