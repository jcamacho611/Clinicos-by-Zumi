import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 160);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function createOrReuseUniversalPerson(input: { name: string; email: string }) {
  const displayName = normalizeName(input.name);
  const primaryEmail = normalizeEmail(input.email);
  if (!displayName) throw new Error("Name is required.");
  if (!primaryEmail || primaryEmail.length > 254) throw new Error("A valid email is required.");

  return db.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${primaryEmail}))`);
    const matches = await tx.person.findMany({
      where: { primaryEmail, status: "active" },
      orderBy: { createdAt: "asc" },
      take: 2,
    });

    if (matches.length > 1) {
      throw new Error("Universal identity is ambiguous and requires human review.");
    }

    if (matches[0]) {
      if (!matches[0].displayName) {
        return tx.person.update({ where: { id: matches[0].id }, data: { displayName } });
      }
      return matches[0];
    }

    return tx.person.create({
      data: {
        displayName,
        primaryEmail,
        status: "active",
        sourceType: "self_registered",
        sourceReference: "agreement_airlock_identity",
      },
    });
  });
}
