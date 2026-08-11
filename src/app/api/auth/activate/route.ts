import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { verifyAccountActivationToken } from "@/lib/auth/account-activation";

const activationSchema = z.object({
  token: z.string().trim().min(40).max(4096),
  password: z.string().min(12).max(256),
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Account activation is unavailable." }, { status: 503 });
  const parsed = activationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid activation token and a password of at least 12 characters." }, { status: 400 });

  const claims = await verifyAccountActivationToken(parsed.data.token);
  if (!claims) return NextResponse.json({ error: "This activation link is invalid or expired." }, { status: 400 });

  const user = await db.user.findUnique({
    where: { id: claims.userId },
    select: { id: true, email: true, organizationId: true, authCredential: { select: { id: true } } },
  });
  if (!user || user.email !== claims.email || user.organizationId !== claims.organizationId) {
    return NextResponse.json({ error: "This activation link no longer matches an account." }, { status: 409 });
  }
  if (user.authCredential) return NextResponse.json({ error: "This account is already activated." }, { status: 409 });

  const passwordHash = await hash(parsed.data.password, 12);
  await db.authCredential.create({
    data: {
      userId: user.id,
      passwordHash,
      mustReset: false,
      failedAttempts: 0,
    },
  });

  return NextResponse.json({ ok: true, redirectTo: "/login" }, { headers: { "Cache-Control": "no-store" } });
}
