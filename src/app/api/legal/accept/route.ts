import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticationSession } from "@/lib/auth/session";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { safeReturnTo } from "@/lib/auth/return-to";
import {
  agreementSha256,
  buildGlobalAgreement,
  normalizeSignatureText,
  requiredAcknowledgmentsForRole,
  validateRequiredAcknowledgments,
} from "@/lib/legal/global-agreement";
import { assertLegalExecutionConfigured } from "@/lib/legal/legal-config";
import { createLegalAcceptance, ensureAgreementVersionRegistered } from "@/lib/legal/legal-access";
import { verifyLegalReviewToken } from "@/lib/legal/review-token";
import { isSameOriginMutation } from "@/lib/security/same-origin-post";

const acceptanceSchema = z.object({
  reviewToken: z.string().min(1).max(5000),
  acknowledgments: z.record(z.string(), z.boolean()),
  legalName: z.string().trim().min(2).max(200),
  signerTitle: z.string().trim().max(160).optional(),
  signerCapacity: z.enum(["individual", "organization_representative"]),
  signerCountry: z.string().trim().min(2).max(120),
  signerRegion: z.string().trim().max(120).optional(),
  signatureText: z.string().trim().min(2).max(200),
  authorityConfirmed: z.boolean().default(false),
  idempotencyKey: z.string().uuid(),
  sourceRoute: z.string().trim().max(500).optional(),
  returnTo: z.string().trim().max(500).optional(),
});

function defaultProtectedPath(role: string) {
  return role === "contractor" ? "/grid/opportunities" : "/dashboard";
}

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Same-origin request required." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }

  const session = await getAuthenticationSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }
  if (session.demo || !process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Agreement execution requires a persistent authenticated account." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }

  const parsed = acceptanceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Complete every required agreement and signature field." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }

  try {
    const agreement = buildGlobalAgreement(assertLegalExecutionConfigured());
    const required = requiredAcknowledgmentsForRole(session.role);
    const sha256 = agreementSha256(agreement);
    const reviewed = await verifyLegalReviewToken(
      parsed.data.reviewToken,
      session,
      { documentKey: agreement.documentKey, documentVersion: agreement.documentVersion, documentSha256: sha256 },
      "reviewed",
    );

    if (!reviewed.reachedEndAt) {
      return NextResponse.json({ error: "Review the complete agreement before signing." }, { status: 409, headers: { "Cache-Control": "private, no-store" } });
    }
    if (!validateRequiredAcknowledgments(required, parsed.data.acknowledgments)) {
      return NextResponse.json({ error: "Every required acknowledgment must be affirmatively selected." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
    }
    if (normalizeSignatureText(parsed.data.signatureText) !== normalizeSignatureText(parsed.data.legalName)) {
      return NextResponse.json({ error: "Your typed signature must match the legal name you entered." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
    }
    if (parsed.data.signerCapacity === "organization_representative" && (!parsed.data.authorityConfirmed || !parsed.data.signerTitle)) {
      return NextResponse.json({ error: "Confirm your authority and provide your title when signing for an organization." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
    }

    await ensureAgreementVersionRegistered(agreement, required);
    const signedAt = new Date();
    const metadata = requestMetadata(request);
    const { acceptance } = await createLegalAcceptance({
      session,
      agreement,
      legalName: parsed.data.legalName,
      signerTitle: parsed.data.signerTitle || undefined,
      signerCapacity: parsed.data.signerCapacity,
      signerCountry: parsed.data.signerCountry,
      signerRegion: parsed.data.signerRegion || undefined,
      signatureText: parsed.data.signatureText,
      authorityConfirmed: parsed.data.signerCapacity === "organization_representative" ? parsed.data.authorityConfirmed : false,
      acknowledgments: Object.fromEntries(required.map(({ key }) => [key, parsed.data.acknowledgments[key] === true])),
      presentedAt: new Date(reviewed.presentedAt),
      reachedEndAt: new Date(reviewed.reachedEndAt),
      signedAt,
      idempotencyKey: parsed.data.idempotencyKey,
      sourceRoute: parsed.data.sourceRoute,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    const requestedReturnTo = safeReturnTo(parsed.data.returnTo);
    const redirectTo = requestedReturnTo && !requestedReturnTo.startsWith("/legal/")
      ? requestedReturnTo
      : defaultProtectedPath(session.role);

    return NextResponse.json(
      {
        ok: true,
        acceptance: {
          id: acceptance.id,
          documentKey: acceptance.documentKey,
          documentVersion: acceptance.documentVersion,
          documentSha256: acceptance.documentSha256,
          signedAt: acceptance.signedAt?.toISOString() ?? acceptance.acceptedAt.toISOString(),
          signatureMethod: acceptance.signatureMethod,
        },
        pdfUrl: `/api/legal/agreements/${acceptance.id}/pdf`,
        redirectTo,
      },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "The agreement could not be executed safely. Refresh the agreement and try again." },
      { status: 409, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
