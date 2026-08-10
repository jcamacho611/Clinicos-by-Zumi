import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requestMetadata } from "@/lib/auth/request-metadata";
import { db } from "@/lib/db";
import { sendAccessVerificationEmail } from "@/lib/legal/access-verification";

const requestSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254) });

type AcceptanceRow = { id: string; documentVersion: string };

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Email verification is unavailable." }, { status: 503 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid work email." }, { status: 400 });

  const rows = await db.$queryRaw<AcceptanceRow[]>(Prisma.sql`
    SELECT "id", "documentVersion"
    FROM "access_gate_acceptances"
    WHERE "email" = ${parsed.data.email}
      AND "documentKey" = 'access-confidentiality-ip'
    ORDER BY "acceptedAt" DESC
    LIMIT 1
  `);
  const recentAcceptance = rows[0];
  if (!recentAcceptance) return NextResponse.json({ error: "Accept the current access terms before requesting verification." }, { status: 409 });

  const metadata = requestMetadata(request);
  try {
    const verification = await sendAccessVerificationEmail({
      email: parsed.data.email,
      acceptanceId: recentAcceptance.id,
      documentVersion: recentAcceptance.documentVersion,
      ipAddress: metadata.ipAddress ?? null,
      userAgent: metadata.userAgent ?? null,
    });
    return NextResponse.json({ ok: true, expiresAt: verification.expiresAt.toISOString() }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "We could not send the verification email. Please try again." }, { status: 503 });
  }
}
