import "server-only";

import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ClinicSession } from "@/lib/auth/types";
import {
  gridResourceCreateSchema,
  type GridResourceCreateInput,
} from "@/lib/grid/resource-rules";
import { NetworkAccessError } from "@/lib/repositories/network-access-error";

export const externalGridParticipantKinds = [
  "space_owner",
  "seller",
  "equipment_owner",
  "service_provider",
  "organization",
  "education_partner",
  "referral_partner",
] as const;

export type ExternalGridParticipantKind = (typeof externalGridParticipantKinds)[number];

const participantKindSchema = z.enum(externalGridParticipantKinds);

const strongPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128)
  .refine((value) => /[a-z]/.test(value), "Password needs a lowercase letter.")
  .refine((value) => /[A-Z]/.test(value), "Password needs an uppercase letter.")
  .refine((value) => /\d/.test(value), "Password needs a number.")
  .refine((value) => /[^A-Za-z0-9]/.test(value), "Password needs a symbol.");

const enrollmentSchema = z.object({
  participantKind: participantKindSchema,
  fullName: z.string().trim().min(2).max(140),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: strongPasswordSchema,
  organizationName: z.string().trim().min(2).max(180),
  resource: gridResourceCreateSchema,
});

const allowedResourceTypes: Record<ExternalGridParticipantKind, readonly string[]> = {
  space_owner: ["space"],
  seller: ["product"],
  equipment_owner: ["equipment"],
  service_provider: ["service"],
  organization: ["organization_capacity"],
  education_partner: ["education"],
  referral_partner: ["referral"],
};

const allowedPolicyClasses: Record<ExternalGridParticipantKind, readonly string[]> = {
  space_owner: ["healthcare_space"],
  seller: ["general_supply"],
  equipment_owner: ["equipment_capacity"],
  service_provider: ["business_service"],
  organization: ["organization_capacity"],
  education_partner: ["education_capacity"],
  referral_partner: ["referral_capacity"],
};

function participantKindFromClinicType(clinicType: string): ExternalGridParticipantKind | null {
  if (!clinicType.startsWith("grid_")) return null;
  const candidate = clinicType.slice("grid_".length);
  const parsed = participantKindSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function assertParticipantCanCreate(kind: ExternalGridParticipantKind, resource: GridResourceCreateInput) {
  if (!allowedResourceTypes[kind].includes(resource.resourceType)) {
    throw new NetworkAccessError("This Grid participant type cannot create that resource class.", 403);
  }
  if (!allowedPolicyClasses[kind].includes(resource.policyClass)) {
    throw new NetworkAccessError("This Grid participant type cannot use that resource policy class.", 403);
  }
  if (resource.policyClass === "regulated_product" || resource.policyClass === "clinical_service") {
    throw new NetworkAccessError("Regulated products and clinical services must use their dedicated Grid safety pathway.", 409);
  }
}

function slugify(value: string) {
  const base = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "grid-participant";
}

function participantClinicType(kind: ExternalGridParticipantKind) {
  return `grid_${kind}`;
}

type ResourceRow = {
  id: string;
  organizationId: string;
  createdBy: string;
  resourceType: string;
  policyClass: string;
  status: string;
  reviewStatus: string;
};

async function insertResource(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    userId: string;
    participantKind: ExternalGridParticipantKind;
    resource: GridResourceCreateInput;
    submitForReview: boolean;
  },
) {
  assertParticipantCanCreate(input.participantKind, input.resource);

  const id = randomUUID();
  const status = input.submitForReview ? "pending_review" : "draft";
  const reviewStatus = input.submitForReview ? "in_review" : "not_submitted";
  const metadata = JSON.stringify({
    credentialRequirements: input.resource.credentialRequirements,
    insuranceRequirements: input.resource.insuranceRequirements,
    operatorRequirements: input.resource.operatorRequirements,
    usageRestrictions: input.resource.usageRestrictions,
    participantKind: input.participantKind,
    externalGridEnrollment: true,
  });

  const rows = await tx.$queryRaw<ResourceRow[]>(Prisma.sql`
    INSERT INTO "GridResourceRecord" (
      "id", "organizationId", "createdBy", "resourceType", "subtype", "title", "description", "policyClass",
      "visibility", "status", "city", "state", "timezone", "latitude", "longitude", "pricingModel", "priceCents",
      "capacity", "requiresHumanReview", "reviewStatus", "metadata", "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${input.organizationId}, ${input.userId}, ${input.resource.resourceType}, ${input.resource.subtype ?? null},
      ${input.resource.title}, ${input.resource.description}, ${input.resource.policyClass}, ${input.resource.visibility}, ${status},
      ${input.resource.city ?? null}, ${input.resource.state ?? null}, ${input.resource.timezone},
      ${input.resource.latitude ?? null}, ${input.resource.longitude ?? null}, ${input.resource.pricingModel},
      ${input.resource.priceCents ?? null}, ${input.resource.capacity}, TRUE, ${reviewStatus}, CAST(${metadata} AS JSONB),
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    RETURNING "id", "organizationId", "createdBy", "resourceType", "policyClass", "status", "reviewStatus"
  `);

  const resource = rows[0];
  if (!resource) throw new NetworkAccessError("Grid resource could not be created.", 500);

  for (const slot of input.resource.availability) {
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "GridResourceAvailabilityRecord" (
        "id", "resourceId", "startsAt", "endsAt", "capacity", "status", "createdAt", "updatedAt"
      ) VALUES (
        ${randomUUID()}, ${id}, ${new Date(slot.startsAt)}, ${new Date(slot.endsAt)}, ${slot.capacity},
        'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `);
  }

  await tx.$executeRaw(Prisma.sql`
    INSERT INTO "GridResourceReviewEventRecord" (
      "id", "organizationId", "resourceId", "actorId", "action", "fromStatus", "toStatus", "note", "metadata", "createdAt"
    ) VALUES (
      ${randomUUID()}, ${input.organizationId}, ${id}, ${input.userId},
      ${input.submitForReview ? "grid.resource.pending_review" : "grid.resource.created"}, NULL, ${status},
      ${input.submitForReview ? "External Grid participant created this resource and submitted it for review." : "External Grid participant created this resource draft."},
      CAST(${JSON.stringify({ participantKind: input.participantKind, externalGridEnrollment: true })} AS JSONB), CURRENT_TIMESTAMP
    )
  `);

  await tx.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.userId,
      actorType: "user",
      action: input.submitForReview ? "grid.external_resource_submitted" : "grid.external_resource_created",
      resourceType: "grid_resource",
      resourceId: id,
      metadata: {
        participantKind: input.participantKind,
        resourceType: input.resource.resourceType,
        policyClass: input.resource.policyClass,
        reviewStatus,
        externalGridEnrollment: true,
      },
    },
  });

  return resource;
}

export async function createExternalGridParticipantEnrollment(rawInput: unknown) {
  const input = enrollmentSchema.parse(rawInput);
  assertParticipantCanCreate(input.participantKind, input.resource);
  const passwordHash = await hash(input.password, 12);

  return db.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (existing) {
      throw new NetworkAccessError("An account already exists for this email. Sign in to add Grid resources.", 409);
    }

    const slug = `${slugify(input.organizationName)}-${randomUUID().slice(0, 8)}`;
    const organization = await tx.organization.create({
      data: {
        name: input.organizationName,
        slug,
        clinicType: participantClinicType(input.participantKind),
        status: "active",
        demoMode: true,
      },
      select: { id: true, name: true, slug: true },
    });

    const user = await tx.user.create({
      data: {
        organizationId: organization.id,
        email: input.email,
        name: input.fullName,
        roleKey: "contractor",
        status: "active",
      },
      select: { id: true, email: true },
    });

    await tx.authCredential.create({
      data: {
        userId: user.id,
        passwordHash,
        mustReset: false,
      },
    });

    const resource = await insertResource(tx, {
      organizationId: organization.id,
      userId: user.id,
      participantKind: input.participantKind,
      resource: input.resource,
      submitForReview: true,
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        actorId: user.id,
        actorType: "user",
        action: "grid.external_participant_enrolled",
        resourceType: "grid_participant",
        resourceId: user.id,
        metadata: {
          participantKind: input.participantKind,
          initialResourceId: resource.id,
          accountStatus: "active",
          resourceReviewStatus: resource.reviewStatus,
          demoMode: true,
        },
      },
    });

    return {
      userId: user.id,
      organizationId: organization.id,
      organizationSlug: organization.slug,
      participantKind: input.participantKind,
      resourceId: resource.id,
      resourceStatus: resource.status,
      reviewStatus: resource.reviewStatus,
      nextHref: "/login",
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function createExternalGridResourceForSession(session: ClinicSession, rawInput: unknown) {
  if (session.role !== "contractor") {
    throw new NetworkAccessError("This Grid partner resource path is limited to external Grid participant accounts.", 403);
  }

  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { clinicType: true, demoMode: true, status: true },
  });
  if (!organization || organization.status !== "active") throw new NetworkAccessError("Organization not found.", 404);
  if (!organization.demoMode) throw new NetworkAccessError("External Grid partner resources require production review before live regulated use.", 409);

  const participantKind = participantKindFromClinicType(organization.clinicType);
  if (!participantKind) throw new NetworkAccessError("This contractor account is not a universal Grid participant account.", 403);

  const resource = gridResourceCreateSchema.parse(rawInput);
  assertParticipantCanCreate(participantKind, resource);

  return db.$transaction((tx) => insertResource(tx, {
    organizationId: session.organizationId,
    userId: session.userId,
    participantKind,
    resource,
    submitForReview: false,
  }));
}

export function externalGridParticipantKindFromClinicType(clinicType: string) {
  return participantKindFromClinicType(clinicType);
}
