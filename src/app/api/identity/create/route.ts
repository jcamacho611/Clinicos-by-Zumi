import { NextResponse } from "next/server";
import { z } from "zod";
import { safeReturnTo } from "@/lib/auth/return-to";
import { sendUniversalIdentityVerification } from "@/lib/auth/universal-identity-session";
import { createOrReuseUniversalPerson } from "@/lib/identity/universal-person";
import { readAgreementAirlockPass } from "@/lib/legal/agreement-airlock";
import { isSameOriginMutation } from "@/lib/security/same-origin-post";

const inputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
  returnTo: z.string().max(500).optional().nullable(),
}).strict();

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const airlockPass = readAgreementAirlockPass(request);
  if (!airlockPass) {
    return NextResponse.json({ error: "Complete the Agreement Airlock before creating identity." }, { status: 403 });
  }

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your name and a valid email address." }, { status: 400 });
  }

  try {
    const person = await createOrReuseUniversalPerson({ name: parsed.data.name, email: parsed.data.email });
    const delivery = await sendUniversalIdentityVerification({
      personId: person.id,
      email: parsed.data.email,
      displayName: person.displayName ?? parsed.data.name,
      airlockPass,
      returnTo: safeReturnTo(parsed.data.returnTo) ?? "/home",
    });

    const response = NextResponse.json({ ok: true, delivered: delivery.delivered });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Identity verification is temporarily unavailable." }, { status: 503 });
  }
}
