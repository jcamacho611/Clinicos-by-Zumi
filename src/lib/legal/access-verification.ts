import "server-only";

import crypto from "node:crypto";
import { db } from "@/lib/db";

const ACCESS_VERIFICATION_TTL_MS = 30 * 60 * 1000;

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://www.klinikos.io").replace(/\/$/, "");
}

function hashToken(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function sendAccessVerificationEmail(input: {
  email: string;
  acceptanceId: string;
  documentVersion: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ACCESS_VERIFICATION_TTL_MS);

  const record = await db.accessEmailVerification.create({
    data: {
      email: input.email,
      acceptanceId: input.acceptanceId,
      documentVersion: input.documentVersion,
      tokenHash,
      expiresAt,
      requestedIpAddress: input.ipAddress ?? null,
      requestedUserAgent: input.userAgent ?? null,
      status: "pending",
    },
    select: { id: true, expiresAt: true },
  });

  const verifyUrl = `${appUrl()}/access/verify?token=${encodeURIComponent(token)}`;

  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required for production access verification.");
    }
    console.info("Klinikos access verification URL", { email: input.email, verifyUrl, verificationId: record.id });
    return { ...record, delivered: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.ACCESS_EMAIL_FROM || "Klinikos Access <access@klinikos.io>",
      to: [input.email],
      subject: "Verify your Klinikos evaluation access",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#0b1e3a"><h2>Verify your Klinikos access</h2><p>Your agreement has been recorded. Verify this work email to continue into protected Klinikos evaluation materials.</p><p><a href="${verifyUrl}" style="display:inline-block;background:#0b1e3a;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Verify work email</a></p><p>This link expires in 30 minutes. If you did not request access, you can ignore this message.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error(`Resend delivery failed with ${response.status}`);
  return { ...record, delivered: true };
}

export async function verifyAccessEmail(rawToken: string, metadata: { ipAddress?: string | null; userAgent?: string | null }) {
  const token = rawToken.trim();
  if (!token) return { ok: false as const, reason: "missing" as const };
  const tokenHash = hashToken(token);
  const verification = await db.accessEmailVerification.findUnique({ where: { tokenHash } });
  if (!verification) return { ok: false as const, reason: "invalid" as const };
  if (verification.status === "verified") return { ok: true as const, email: verification.email, alreadyVerified: true };
  if (verification.expiresAt <= new Date()) {
    await db.accessEmailVerification.update({ where: { id: verification.id }, data: { status: "expired" } }).catch(() => undefined);
    return { ok: false as const, reason: "expired" as const };
  }

  const now = new Date();
  await db.$transaction([
    db.accessEmailVerification.update({
      where: { id: verification.id },
      data: {
        status: "verified",
        verifiedAt: now,
        verifiedIpAddress: metadata.ipAddress ?? null,
        verifiedUserAgent: metadata.userAgent ?? null,
      },
    }),
    db.accessGateAcceptance.update({
      where: { id: verification.acceptanceId },
      data: { verifiedEmailAt: now },
    }),
  ]);
  return { ok: true as const, email: verification.email, alreadyVerified: false };
}
