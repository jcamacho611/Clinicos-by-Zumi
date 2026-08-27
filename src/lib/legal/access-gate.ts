import "server-only";

import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  PUBLIC_ACCESS_TERMS_KEY,
  PUBLIC_ACCESS_TERMS_VERSION,
} from "@/lib/legal/public-access-contract";

export const ACCESS_TERMS_KEY = PUBLIC_ACCESS_TERMS_KEY;
export const ACCESS_TERMS_VERSION = PUBLIC_ACCESS_TERMS_VERSION;

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
  const id = crypto.randomUUID();
  const rows = await db.$queryRaw<AcceptanceRecord[]>(Prisma.sql`
    INSERT INTO "access_gate_acceptances"
      ("id", "email", "documentKey", "documentVersion", "ipAddress", "userAgent", "source")
    VALUES
      (${id}, ${parsed.email}, ${ACCESS_TERMS_KEY}, ${ACCESS_TERMS_VERSION}, ${metadata.ipAddress ?? null}, ${metadata.userAgent ?? null}, 'web-access-gate')
    RETURNING "id", "acceptedAt", "documentVersion", "email"
  `);

  const acceptance = rows[0];
  if (!acceptance) throw new Error("Access acceptance was not recorded.");
  return acceptance;
}
