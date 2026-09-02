import "server-only";

import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthSecret } from "@/lib/auth/config";

const WINDOW_MS = 60 * 60 * 1_000;
const EMAIL_LIMIT = 3;
const IP_LIMIT = 5;
const EXPIRED_BUCKET_CLEANUP_LIMIT = 100;

type BucketResult = { attemptCount: number };

export class MemberSignupAdmissionError extends Error {
  constructor(
    message: string,
    readonly status: 429 | 503,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "MemberSignupAdmissionError";
  }
}

function keyedDigest(scope: string, value: string) {
  return createHmac("sha256", getAuthSecret())
    .update(`member-signup-admission:v1\0${scope}\0${value}`)
    .digest("hex");
}

function windowAt(now: number) {
  const start = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  return {
    windowStart: new Date(start),
    expiresAt: new Date(start + WINDOW_MS * 2),
    retryAfterSeconds: Math.max(1, Math.ceil((start + WINDOW_MS - now) / 1_000)),
  };
}

async function cleanupExpiredBuckets(now: number) {
  try {
    await db.$executeRaw(Prisma.sql`
      DELETE FROM "public_mutation_rate_limits" AS target
      USING (
        SELECT "scope", "keyHash", "windowStart"
        FROM "public_mutation_rate_limits"
        WHERE "expiresAt" <= ${new Date(now)}
        ORDER BY "expiresAt" ASC
        LIMIT ${EXPIRED_BUCKET_CLEANUP_LIMIT}
      ) AS expired
      WHERE target."scope" = expired."scope"
        AND target."keyHash" = expired."keyHash"
        AND target."windowStart" = expired."windowStart"
    `);
  } catch {
    // Retention cleanup is best-effort; admission remains fail-closed in consume().
  }
}

async function consume(scope: string, rawValue: string, limit: number, now: number) {
  const { windowStart, expiresAt, retryAfterSeconds } = windowAt(now);
  const keyHash = keyedDigest(scope, rawValue);
  const rows = await db.$queryRaw<BucketResult[]>(Prisma.sql`
    INSERT INTO "public_mutation_rate_limits" (
      "scope", "keyHash", "windowStart", "attemptCount", "expiresAt", "createdAt", "updatedAt"
    ) VALUES (
      ${scope}, ${keyHash}, ${windowStart}, 1, ${expiresAt}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("scope", "keyHash", "windowStart")
    DO UPDATE SET
      "attemptCount" = "public_mutation_rate_limits"."attemptCount" + 1,
      "expiresAt" = EXCLUDED."expiresAt",
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "attemptCount"
  `);

  const count = rows[0]?.attemptCount;
  if (!count) throw new MemberSignupAdmissionError("Klinikos cannot verify signup safety right now.", 503);
  if (count > limit) {
    throw new MemberSignupAdmissionError(
      "Too many signup attempts. Please try again later.",
      429,
      retryAfterSeconds,
    );
  }
}

export async function assertMemberSignupAllowed(input: { email: string; ipAddress?: string }) {
  if (!process.env.DATABASE_URL) {
    throw new MemberSignupAdmissionError("Klinikos signup is temporarily unavailable.", 503);
  }

  const email = input.email.trim().toLowerCase();
  const ipAddress = input.ipAddress?.trim();
  const now = Date.now();

  try {
    await cleanupExpiredBuckets(now);
    await consume("member-signup:email", email, EMAIL_LIMIT, now);
    if (ipAddress) await consume("member-signup:ip", ipAddress, IP_LIMIT, now);
  } catch (error) {
    if (error instanceof MemberSignupAdmissionError) throw error;
    throw new MemberSignupAdmissionError("Klinikos cannot verify signup safety right now.", 503);
  }
}
