import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { clinicActivationDraftFieldsSchema, type ClinicActivationDraft } from "@/lib/commercial/clinic-activation-rules";
import { ClinicProvisioningError, getClinicActivationPreview, verifyClinicActivationToken } from "@/lib/commercial/clinic-provisioning";

type CheckoutMetadataRow = {
  metadata: Prisma.JsonValue;
};

function asRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/**
 * Read only the non-secret onboarding draft bound to this signed activation link.
 * Passwords, terms acceptance, organization IDs, roles, plans, and payment state are
 * intentionally outside the draft contract.
 */
export async function getClinicActivationDraft(token: string): Promise<ClinicActivationDraft | null> {
  const payload = verifyClinicActivationToken(token);
  const preview = await getClinicActivationPreview(token);
  if (preview.alreadyActivated) return null;

  const rows = await db.$queryRaw<CheckoutMetadataRow[]>(Prisma.sql`
    SELECT "metadata"
    FROM "commercial_checkout_intents"
    WHERE "id" = ${payload.checkoutIntentId}
      AND "organizationId" = ${payload.organizationId}
      AND "email" = ${payload.email}
      AND "productKey" = ${payload.productKey}
    LIMIT 1
  `);
  const metadata = asRecord(rows[0]?.metadata ?? {});
  const parsed = clinicActivationDraftFieldsSchema.safeParse(metadata.activationDraft);
  return parsed.success ? parsed.data : null;
}

/**
 * Persist resumable owner setup without ever storing the password or acceptance
 * checkbox. The signed link chooses the checkout, organization, email, and plan; the
 * browser cannot redirect a draft into another tenant.
 */
export async function saveClinicActivationDraft(token: string, draft: ClinicActivationDraft) {
  const payload = verifyClinicActivationToken(token);
  const preview = await getClinicActivationPreview(token);
  if (preview.alreadyActivated) throw new ClinicProvisioningError("This clinic is already activated. Sign in instead.", 409);
  const parsed = clinicActivationDraftFieldsSchema.parse(draft);
  const savedAt = new Date().toISOString();

  const updated = await db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<CheckoutMetadataRow[]>(Prisma.sql`
      SELECT "metadata"
      FROM "commercial_checkout_intents"
      WHERE "id" = ${payload.checkoutIntentId}
        AND "organizationId" = ${payload.organizationId}
        AND "email" = ${payload.email}
        AND "productKey" = ${payload.productKey}
      FOR UPDATE
    `);
    if (!rows[0]) throw new ClinicProvisioningError("This clinic activation record was not found.", 404);

    const metadata = asRecord(rows[0].metadata);
    const nextMetadata = {
      ...metadata,
      activationDraft: parsed,
      activationDraftUpdatedAt: savedAt,
    };
    const count = await tx.$executeRaw(Prisma.sql`
      UPDATE "commercial_checkout_intents"
      SET "metadata" = ${JSON.stringify(nextMetadata)}::jsonb,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${payload.checkoutIntentId}
        AND "organizationId" = ${payload.organizationId}
        AND "email" = ${payload.email}
        AND "productKey" = ${payload.productKey}
    `);
    return count;
  });

  if (updated !== 1) throw new ClinicProvisioningError("Onboarding progress could not be saved.", 409);
  return { savedAt };
}
