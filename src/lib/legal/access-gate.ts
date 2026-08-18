import "server-only";

import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { WEBSITE_TERMS_KEY, WEBSITE_TERMS_VERSION } from "@/lib/legal/public-terms";

export const ACCESS_TERMS_KEY = "access-confidentiality-ip";
export const ACCESS_TERMS_VERSION = "2026-08-10.1";

export const accessAcceptanceSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  accepted: z.literal(true),
});

type AcceptanceRecord = {
  id: string;
  acceptedAt: Date;
  documentVersion: string;
  email: string;
};

export async function recordAccessAcceptance(
  input: z.infer<typeof accessAcceptanceSchema>,
  metadata: { ipAddress?: string | null; userAgent?: string | null },
) {
  const parsed = accessAcceptanceSchema.parse(input);
  const accessId = crypto.randomUUID();
  const websiteId = crypto.randomUUID();

  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<AcceptanceRecord[]>(Prisma.sql`
      INSERT INTO "access_gate_acceptances"
        ("id", "email", "documentKey", "documentVersion", "ipAddress", "userAgent", "source")
      VALUES
        (${accessId}, ${parsed.email}, ${ACCESS_TERMS_KEY}, ${ACCESS_TERMS_VERSION}, ${metadata.ipAddress ?? null}, ${metadata.userAgent ?? null}, 'web-access-gate')
      RETURNING "id", "acceptedAt", "documentVersion", "email"
    `);

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "access_gate_acceptances"
        ("id", "email", "documentKey", "documentVersion", "ipAddress", "userAgent", "source")
      VALUES
        (${websiteId}, ${parsed.email}, ${WEBSITE_TERMS_KEY}, ${WEBSITE_TERMS_VERSION}, ${metadata.ipAddress ?? null}, ${metadata.userAgent ?? null}, 'protected-access-clickwrap')
    `);

    const acceptance = rows[0];
    if (!acceptance) throw new Error("Access acceptance was not recorded.");
    return acceptance;
  });
}
