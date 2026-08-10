import "server-only";

import { z } from "zod";
import { db } from "@/lib/db";

export const ACCESS_TERMS_KEY = "access-confidentiality-ip";
export const ACCESS_TERMS_VERSION = "2026-08-10.1";

export const accessAcceptanceSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  accepted: z.literal(true),
});

export async function recordAccessAcceptance(input: z.infer<typeof accessAcceptanceSchema>, metadata: { ipAddress?: string | null; userAgent?: string | null }) {
  const parsed = accessAcceptanceSchema.parse(input);
  return db.accessGateAcceptance.create({
    data: {
      email: parsed.email,
      documentKey: ACCESS_TERMS_KEY,
      documentVersion: ACCESS_TERMS_VERSION,
      ipAddress: metadata.ipAddress ?? null,
      userAgent: metadata.userAgent ?? null,
      source: "web-access-gate",
    },
    select: { id: true, acceptedAt: true, documentVersion: true, email: true },
  });
}
