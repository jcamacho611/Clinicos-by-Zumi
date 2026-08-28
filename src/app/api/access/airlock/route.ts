import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AGREEMENT_AIRLOCK_ACKNOWLEDGMENTS,
  AGREEMENT_AIRLOCK_COOKIE,
  agreementAirlockCookieOptions,
  issueAgreementAirlockPass,
} from "@/lib/legal/agreement-airlock";
import { buildGlobalAgreement } from "@/lib/legal/global-agreement";
import { getLegalConfigurationStatus } from "@/lib/legal/legal-config";
import { isSameOriginMutation } from "@/lib/security/same-origin-post";
import { safeReturnTo } from "@/lib/auth/return-to";

const acknowledgmentShape = Object.fromEntries(
  AGREEMENT_AIRLOCK_ACKNOWLEDGMENTS.map(({ key }) => [key, z.literal(true)]),
) as Record<(typeof AGREEMENT_AIRLOCK_ACKNOWLEDGMENTS)[number]["key"], z.ZodLiteral<true>>;

const airlockSchema = z.object({
  acknowledgments: z.object(acknowledgmentShape).strict(),
  returnTo: z.string().max(500).optional().nullable(),
}).strict();

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const parsed = airlockSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Review and accept every required Agreement Airlock disclosure." }, { status: 400 });
  }

  const legal = getLegalConfigurationStatus();
  if (!legal.ready) {
    return NextResponse.json({ error: "Legal execution configuration is incomplete." }, { status: 503 });
  }

  const agreement = buildGlobalAgreement(legal.config);
  const issued = issueAgreementAirlockPass({ agreement, acknowledgments: parsed.data.acknowledgments });
  const returnTo = safeReturnTo(parsed.data.returnTo) ?? "/home";

  const response = NextResponse.json({
    ok: true,
    documentKey: agreement.documentKey,
    documentVersion: agreement.documentVersion,
    documentSha256: issued.pass.documentSha256,
    acceptedAt: issued.pass.acceptedAt,
    returnTo,
  });
  response.cookies.set(AGREEMENT_AIRLOCK_COOKIE, issued.value, agreementAirlockCookieOptions(issued.expiresAt));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
