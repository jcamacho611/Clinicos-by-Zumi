import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateCredentials } from "@/lib/auth/credentials";
import { clearLoginFailures, checkLoginRateLimit, recordLoginFailure } from "@/lib/auth/rate-limit";
import { resolvePostLoginRedirect } from "@/lib/auth/post-login-routing";
import {
  createClinicSession,
  revokeClinicSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/auth/return-to";
import {
  bindEntryAcceptanceToIdentity,
  readAcceptedEntryProof,
} from "@/lib/legal/entry-access";
import { buildGlobalAgreement } from "@/lib/legal/global-agreement";
import { hasCurrentAgreementAcceptance } from "@/lib/legal/legal-access";
import {
  getLegalConfigurationStatus,
  isEntryGateEnforcementEnabled,
  isLegalGateEnforcementEnabled,
} from "@/lib/legal/legal-config";
import { ENTRY_GATE_COOKIE_NAME } from "@/lib/legal/entry-token";
import { isSameOriginMutation } from "@/lib/security/same-origin-post";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(256),
  returnTo: z.string().max(500).optional().nullable(),
});

function accessHref(returnTo: string | null) {
  const loginTarget = returnTo
    ? `/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/login";
  return `/access?returnTo=${encodeURIComponent(loginTarget)}`;
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json(
      { error: "Same-origin request required." },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address and password." }, { status: 400 });
  }

  const returnTo = safeReturnTo(parsed.data.returnTo);
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const key = `${ipAddress}:${parsed.data.email.toLowerCase()}`;
  const limit = checkLoginRateLimit(key);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const entryGateEnabled = isEntryGateEnforcementEnabled();
  const entryProof = entryGateEnabled ? await readAcceptedEntryProof() : null;
  if (entryGateEnabled && !entryProof) {
    return NextResponse.json(
      {
        error: "Enter Klinikos through the protected-entry agreement before signing in.",
        redirectTo: accessHref(returnTo),
      },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const identity = await authenticateCredentials(parsed.data.email, parsed.data.password);
    if (!identity) {
      recordLoginFailure(key);
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const { session, token } = await createClinicSession(identity, {
      ipAddress: ipAddress === "unknown" ? undefined : ipAddress,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    if (entryGateEnabled && entryProof) {
      try {
        await bindEntryAcceptanceToIdentity({
          acceptanceId: entryProof.acceptance.id,
          entrySessionId: entryProof.claims.entrySessionId,
          documentKey: entryProof.claims.documentKey,
          documentVersion: entryProof.claims.documentVersion,
          documentSha256: entryProof.claims.documentSha256,
          identity,
          authSessionId: session.sessionId,
        });
      } catch {
        await revokeClinicSession(session);
        return NextResponse.json(
          { error: "Protected-entry evidence could not be bound to this account. Re-enter Klinikos and try again.", redirectTo: accessHref(returnTo) },
          { status: 409, headers: { "Cache-Control": "private, no-store" } },
        );
      }
    }

    let redirectTo = returnTo ?? (identity.role === "contractor" ? "/grid/opportunities" : "/dashboard");

    // When the universal entry gate is disabled, preserve the existing authenticated
    // global-Terms authority and carry the customer's intended safe destination through it.
    // When universal entry is enabled, the bound entry acceptance is the baseline gate and
    // relationship-specific/additional agreements remain separate workflows.
    if (!entryGateEnabled) {
      const legalGateEnabled = isLegalGateEnforcementEnabled();
      const legalStatus = legalGateEnabled ? getLegalConfigurationStatus() : null;
      let agreementAccepted = false;

      if (legalGateEnabled && legalStatus?.ready && !session.demo && process.env.DATABASE_URL) {
        try {
          agreementAccepted = await hasCurrentAgreementAcceptance(session, buildGlobalAgreement(legalStatus.config));
        } catch {
          agreementAccepted = false;
        }
      }

      redirectTo = resolvePostLoginRedirect({
        role: session.role,
        requestedReturnTo: parsed.data.returnTo,
        legalGateEnabled,
        legalConfigurationReady: legalStatus?.ready ?? true,
        agreementAccepted,
      });
    }

    clearLoginFailures(key);
    const response = NextResponse.json({ ok: true, redirectTo });
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    if (entryGateEnabled) {
      response.cookies.set(ENTRY_GATE_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
