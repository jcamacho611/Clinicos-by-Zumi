import "server-only";

import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthSecret } from "@/lib/auth/config";

const WINDOW_MS = 60 * 60 * 1000;
const IP_LIMIT = 5;
const EMAIL_LIMIT = 3;

type AdmissionInput = {
  ipAddress?: string;
  email: string;
};

type BucketResult = { attemptCount: number };

export class MemberSignupAdmissionError extends Error {
  constructor(
    message: string,
    readonly status: 429 | 503,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

function keyedDigest(scope: string, value: string) {
  return createHmac("sha256", getAuthSecret())
    .update(`member-signup-abuse:v1\0${scope}\0${value}`)
    .digest("hex");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function currentWindow(now = Date.now()) {
  const startMs = Math.floor(now / WINDOW_MS) * WINDOW_MS;
  return {
    windowStart: new Date(startMs),
    expiresAt: new Date(startMs + WINDOW_MS * 2),
    retryAfterSeconds: Math.max(1, Math.ceil((startMs + WINDOW_MS - now) / 1000)),
  };
}

async function consumeBucket({
  scope,
  rawValue,
  limit,
  now,
}: {
  scope: string;
  rawValue: string;
  limit: number;
  now: number;
}) {
  const { windowStart, expiresAt, retryAfterSeconds } = currentWindow(now);
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
  if (!count) {
    throw new MemberSignupAdmissionError("Klinikos cannot verify signup safety right now.", 503);
  }
  if (count > limit) {
    throw new MemberSignupAdmissionError(
      "Too many signup attempts. Please try again later.",
      429,
      retryAfterSeconds,
    );
  }
}

export async function assertMemberSignupAllowed(input: AdmissionInput) {
  if (!process.env.DATABASE_URL) {
    throw new MemberSignupAdmissionError("Klinikos signup is temporarily unavailable.", 503);
  }

  const email = normalizeEmail(input.email);
  const ipAddress = input.ipAddress?.trim();
  const now = Date.now();

  try {
    // Email throttling remains effective even when an upstream proxy does not provide
    // a trustworthy client address. When an address is available, require both gates.
    await consumeBucket({ scope: "member-signup:email", rawValue: email, limit: EMAIL_LIMIT, now });
    if (ipAddress) {
      await consumeBucket({ scope: "member-signup:ip", rawValue: ipAddress, limit: IP_LIMIT, now });
    }
  } catch (error) {
    if (error instanceof MemberSignupAdmissionError) throw error;
    throw new MemberSignupAdmissionError("Klinikos cannot verify signup safety right now.", 503);
  }
}
