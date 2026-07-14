-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('NORMAL', 'NEEDS_STAFF', 'NEEDS_PROVIDER', 'URGENT', 'DO_NOT_AUTOMATE');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('INTERNAL', 'PATIENT_VISIBLE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CHECKED_IN', 'IN_ROOM', 'WITH_PROVIDER', 'CHECKOUT', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "EncounterStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'SIGNED', 'LOCKED', 'ADDENDUM_NEEDED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('DRAFT', 'READY_FOR_REVIEW', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'DENIED', 'PAID', 'PATIENT_BALANCE', 'APPEALED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clinicType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "demoMode" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mustReset" BOOLEAN NOT NULL DEFAULT false,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passkey_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT[],
    "deviceType" TEXT,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "nickname" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passkey_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "credential" TEXT NOT NULL,
    "specialty" TEXT,
    "npi" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_credentials" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "state" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT,
    "mrn" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "sexAtBirth" TEXT,
    "genderIdentity" TEXT,
    "pronouns" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'English',
    "portalStatus" TEXT NOT NULL DEFAULT 'inactive',
    "communicationPrefs" JSONB,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NORMAL',
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_contacts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_insurance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "payer" TEXT NOT NULL,
    "planName" TEXT,
    "memberId" TEXT NOT NULL,
    "groupNumber" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_pharmacies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" JSONB,
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_pharmacies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_preferences" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_contacts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_types" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "color" TEXT,
    "telemedicine" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT,
    "appointmentTypeId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "telemedicine" BOOLEAN NOT NULL DEFAULT false,
    "formsComplete" BOOLEAN NOT NULL DEFAULT false,
    "insuranceVerified" BOOLEAN NOT NULL DEFAULT false,
    "paymentDueCents" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_availability" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "locationId" TEXT,
    "weekday" INTEGER NOT NULL,
    "startsAt" TEXT NOT NULL,
    "endsAt" TEXT NOT NULL,
    "recurrence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "arrivedAt" TIMESTAMP(3),
    "roomedAt" TIMESTAMP(3),
    "checkoutAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "readiness" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentTypeId" TEXT,
    "preferences" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounters" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "locationId" TEXT,
    "patientId" TEXT NOT NULL,
    "providerId" TEXT,
    "appointmentId" TEXT,
    "type" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "status" "EncounterStatus" NOT NULL DEFAULT 'DRAFT',
    "chiefComplaint" TEXT,
    "hpi" TEXT,
    "reviewOfSystems" JSONB,
    "physicalExam" JSONB,
    "assessment" TEXT,
    "plan" TEXT,
    "patientInstructions" TEXT,
    "followUpPlan" TEXT,
    "requiresCosignature" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soap_notes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "status" "EncounterStatus" NOT NULL DEFAULT 'DRAFT',
    "signedBy" TEXT,
    "signedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soap_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_notes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "status" "EncounterStatus" NOT NULL DEFAULT 'DRAFT',
    "signedBy" TEXT,
    "signedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "addendumOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_templates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "encounterType" TEXT,
    "schema" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smart_phrases" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "shortcut" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smart_phrases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vitals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bloodPressureSystolic" INTEGER,
    "bloodPressureDiastolic" INTEGER,
    "heartRate" INTEGER,
    "temperatureF" DECIMAL(4,1),
    "oxygenPercent" INTEGER,
    "weightLbs" DECIMAL(6,2),
    "heightInches" DECIMAL(5,2),
    "bmi" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "substance" TEXT NOT NULL,
    "reaction" TEXT,
    "severity" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT,
    "frequency" TEXT,
    "route" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "code" TEXT,
    "label" TEXT NOT NULL,
    "onsetDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnoses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "codeSystem" TEXT NOT NULL DEFAULT 'ICD-10-CM',
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedures" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "codeSystem" TEXT NOT NULL DEFAULT 'CPT',
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "modifiers" TEXT[],
    "units" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "providerId" TEXT,
    "type" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "orderedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "specialty" TEXT NOT NULL,
    "destination" TEXT,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "immunizations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "vaccine" TEXT NOT NULL,
    "cvxCode" TEXT,
    "administeredAt" TIMESTAMP(3),
    "lotNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'complete',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "immunizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_plans" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goals" JSONB,
    "interventions" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_instructions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "content" TEXT NOT NULL,
    "patientVisible" BOOLEAN NOT NULL DEFAULT true,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_categories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultAccess" "AccessLevel" NOT NULL DEFAULT 'INTERNAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'INTERNAL',
    "patientVisible" BOOLEAN NOT NULL DEFAULT false,
    "internalOnly" BOOLEAN NOT NULL DEFAULT true,
    "lockedAt" TIMESTAMP(3),
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_reviews" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'needs_review',
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_templates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "schema" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'incomplete',
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'INTERNAL',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "templateId" TEXT,
    "type" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatures" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signatureHash" TEXT NOT NULL,
    "context" JSONB,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "providerId" TEXT,
    "vendor" TEXT,
    "tests" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "orderedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "orderId" TEXT,
    "vendor" TEXT,
    "panelName" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3),
    "resultedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'needs_review',
    "abnormal" BOOLEAN NOT NULL DEFAULT false,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "patientVisible" BOOLEAN NOT NULL DEFAULT false,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_result_items" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "labResultId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "loincCode" TEXT,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "referenceRange" TEXT,
    "abnormalFlag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_result_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imaging_orders" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "providerId" TEXT,
    "study" TEXT NOT NULL,
    "facility" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "orderedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imaging_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imaging_results" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "orderId" TEXT,
    "reportDocumentId" TEXT,
    "facility" TEXT,
    "status" TEXT NOT NULL DEFAULT 'needs_review',
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "patientVisible" BOOLEAN NOT NULL DEFAULT false,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imaging_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_accounts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "guarantorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "balanceCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superbills" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "providerId" TEXT,
    "placeOfService" TEXT,
    "diagnoses" JSONB NOT NULL,
    "procedures" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "superbills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_drafts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "superbillId" TEXT,
    "payer" TEXT NOT NULL,
    "providerNpi" TEXT,
    "facilityNpi" TEXT,
    "taxId" TEXT,
    "placeOfService" TEXT,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_lines" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "claimDraftId" TEXT NOT NULL,
    "cptCode" TEXT NOT NULL,
    "icd10Pointers" TEXT[],
    "modifiers" TEXT[],
    "units" INTEGER NOT NULL DEFAULT 1,
    "chargeCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "billingAccountId" TEXT,
    "source" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "externalId" TEXT,
    "postedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_links" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "balanceCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_balances" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "balanceCents" INTEGER NOT NULL DEFAULT 0,
    "asOf" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "denials" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "claimDraftId" TEXT NOT NULL,
    "reasonCode" TEXT,
    "reason" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "appealDueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "denials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "era_remittances" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "payer" TEXT NOT NULL,
    "externalId" TEXT,
    "receivedAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unposted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "era_remittances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_verifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "insuranceId" TEXT,
    "payer" TEXT NOT NULL,
    "eligibilityStatus" TEXT NOT NULL,
    "copayCents" INTEGER,
    "deductibleCents" INTEGER,
    "coinsurancePercent" DECIMAL(5,2),
    "effectiveDate" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "source" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prior_authorizations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "payer" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prior_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nofault_cases" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "accidentDate" TIMESTAMP(3) NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "adjuster" JSONB,
    "attorney" JSONB,
    "injuredBodyParts" TEXT[],
    "treatmentPlan" TEXT,
    "priorAuthStatus" TEXT,
    "imeStatus" TEXT,
    "narrativeDueAt" TIMESTAMP(3),
    "packetStatus" TEXT NOT NULL DEFAULT 'incomplete',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nofault_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workers_comp_cases" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "accidentDate" TIMESTAMP(3) NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "employer" JSONB,
    "adjuster" JSONB,
    "attorney" JSONB,
    "injuredBodyParts" TEXT[],
    "workStatus" TEXT,
    "authorizationStatus" TEXT,
    "narrativeDueAt" TIMESTAMP(3),
    "packetStatus" TEXT NOT NULL DEFAULT 'incomplete',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workers_comp_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "requirementKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'attached',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_tasks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ownerId" TEXT,
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_packets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "checklist" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_packets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_measures" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "definition" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_measures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_gaps" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "measureId" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "impact" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_gaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_quality_status" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "measureId" TEXT NOT NULL,
    "value" JSONB,
    "status" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_quality_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outreach_campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "measureId" TEXT,
    "channels" TEXT[],
    "audience" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "launchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outreach_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "subject" TEXT,
    "category" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NORMAL',
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "assignedTeam" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "patientId" TEXT,
    "direction" "MessageDirection" NOT NULL,
    "channel" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NORMAL',
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "direction" TEXT NOT NULL,
    "fromNumber" TEXT,
    "toNumber" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "transcript" TEXT,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NORMAL',
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "direction" "MessageDirection" NOT NULL,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "externalId" TEXT,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "direction" "MessageDirection" NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "externalId" TEXT,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "encounterId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "ownerId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NORMAL',
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "assignedTeam" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_summaries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_classifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" DECIMAL(5,4),
    "riskLevel" "RiskLevel" NOT NULL,
    "requiresHumanReview" BOOLEAN NOT NULL,
    "assignedTeam" TEXT,
    "rulesVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_drafts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "patientId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "requiresHumanReview" BOOLEAN NOT NULL DEFAULT true,
    "blockedFromSend" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_reviews" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "patientId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'roadmap',
    "config" JSONB,
    "riskLevel" TEXT NOT NULL,
    "baaRequired" BOOLEAN NOT NULL DEFAULT false,
    "phase" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "scopes" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "locations_organizationId_idx" ON "locations"("organizationId");

-- CreateIndex
CREATE INDEX "departments_organizationId_idx" ON "departments"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_credentials_userId_key" ON "auth_credentials"("userId");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_revokedAt_expiresAt_idx" ON "auth_sessions"("userId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "passkey_credentials_credentialId_key" ON "passkey_credentials"("credentialId");

-- CreateIndex
CREATE INDEX "passkey_credentials_userId_idx" ON "passkey_credentials"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_organizationId_key_key" ON "roles"("organizationId", "key");

-- CreateIndex
CREATE INDEX "permissions_roleId_idx" ON "permissions"("roleId");

-- CreateIndex
CREATE INDEX "providers_organizationId_idx" ON "providers"("organizationId");

-- CreateIndex
CREATE INDEX "provider_credentials_providerId_idx" ON "provider_credentials"("providerId");

-- CreateIndex
CREATE INDEX "patients_organizationId_lastName_firstName_idx" ON "patients"("organizationId", "lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "patients_organizationId_mrn_key" ON "patients"("organizationId", "mrn");

-- CreateIndex
CREATE INDEX "patient_contacts_patientId_idx" ON "patient_contacts"("patientId");

-- CreateIndex
CREATE INDEX "patient_insurance_patientId_idx" ON "patient_insurance"("patientId");

-- CreateIndex
CREATE INDEX "patient_pharmacies_patientId_idx" ON "patient_pharmacies"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_preferences_patientId_key_key" ON "patient_preferences"("patientId", "key");

-- CreateIndex
CREATE INDEX "emergency_contacts_patientId_idx" ON "emergency_contacts"("patientId");

-- CreateIndex
CREATE INDEX "appointment_types_organizationId_idx" ON "appointment_types"("organizationId");

-- CreateIndex
CREATE INDEX "appointments_organizationId_startsAt_idx" ON "appointments"("organizationId", "startsAt");

-- CreateIndex
CREATE INDEX "appointments_patientId_startsAt_idx" ON "appointments"("patientId", "startsAt");

-- CreateIndex
CREATE INDEX "provider_availability_providerId_idx" ON "provider_availability"("providerId");

-- CreateIndex
CREATE INDEX "rooms_locationId_idx" ON "rooms"("locationId");

-- CreateIndex
CREATE INDEX "check_ins_appointmentId_idx" ON "check_ins"("appointmentId");

-- CreateIndex
CREATE INDEX "waitlist_organizationId_status_idx" ON "waitlist"("organizationId", "status");

-- CreateIndex
CREATE INDEX "encounters_patientId_serviceDate_idx" ON "encounters"("patientId", "serviceDate");

-- CreateIndex
CREATE INDEX "encounters_organizationId_status_idx" ON "encounters"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "soap_notes_encounterId_key" ON "soap_notes"("encounterId");

-- CreateIndex
CREATE INDEX "clinical_notes_patientId_createdAt_idx" ON "clinical_notes"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "note_templates_organizationId_idx" ON "note_templates"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "smart_phrases_organizationId_userId_shortcut_key" ON "smart_phrases"("organizationId", "userId", "shortcut");

-- CreateIndex
CREATE INDEX "vitals_patientId_measuredAt_idx" ON "vitals"("patientId", "measuredAt");

-- CreateIndex
CREATE INDEX "allergies_patientId_idx" ON "allergies"("patientId");

-- CreateIndex
CREATE INDEX "medications_patientId_status_idx" ON "medications"("patientId", "status");

-- CreateIndex
CREATE INDEX "problems_patientId_status_idx" ON "problems"("patientId", "status");

-- CreateIndex
CREATE INDEX "diagnoses_encounterId_idx" ON "diagnoses"("encounterId");

-- CreateIndex
CREATE INDEX "procedures_encounterId_idx" ON "procedures"("encounterId");

-- CreateIndex
CREATE INDEX "orders_patientId_type_idx" ON "orders"("patientId", "type");

-- CreateIndex
CREATE INDEX "referrals_patientId_idx" ON "referrals"("patientId");

-- CreateIndex
CREATE INDEX "immunizations_patientId_idx" ON "immunizations"("patientId");

-- CreateIndex
CREATE INDEX "care_plans_patientId_idx" ON "care_plans"("patientId");

-- CreateIndex
CREATE INDEX "patient_instructions_patientId_idx" ON "patient_instructions"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "document_categories_organizationId_name_key" ON "document_categories"("organizationId", "name");

-- CreateIndex
CREATE INDEX "documents_patientId_createdAt_idx" ON "documents"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "document_reviews_documentId_idx" ON "document_reviews"("documentId");

-- CreateIndex
CREATE INDEX "form_templates_organizationId_status_idx" ON "form_templates"("organizationId", "status");

-- CreateIndex
CREATE INDEX "form_submissions_patientId_status_idx" ON "form_submissions"("patientId", "status");

-- CreateIndex
CREATE INDEX "consents_patientId_type_idx" ON "consents"("patientId", "type");

-- CreateIndex
CREATE INDEX "signatures_entityType_entityId_idx" ON "signatures"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "lab_orders_patientId_status_idx" ON "lab_orders"("patientId", "status");

-- CreateIndex
CREATE INDEX "lab_results_organizationId_status_idx" ON "lab_results"("organizationId", "status");

-- CreateIndex
CREATE INDEX "lab_results_patientId_resultedAt_idx" ON "lab_results"("patientId", "resultedAt");

-- CreateIndex
CREATE INDEX "lab_result_items_labResultId_idx" ON "lab_result_items"("labResultId");

-- CreateIndex
CREATE INDEX "imaging_orders_patientId_status_idx" ON "imaging_orders"("patientId", "status");

-- CreateIndex
CREATE INDEX "imaging_results_patientId_status_idx" ON "imaging_results"("patientId", "status");

-- CreateIndex
CREATE INDEX "billing_accounts_patientId_idx" ON "billing_accounts"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "superbills_encounterId_key" ON "superbills"("encounterId");

-- CreateIndex
CREATE INDEX "claim_drafts_organizationId_status_idx" ON "claim_drafts"("organizationId", "status");

-- CreateIndex
CREATE INDEX "claim_lines_claimDraftId_idx" ON "claim_lines"("claimDraftId");

-- CreateIndex
CREATE INDEX "payments_patientId_createdAt_idx" ON "payments"("patientId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_links_tokenHash_key" ON "payment_links"("tokenHash");

-- CreateIndex
CREATE INDEX "payment_links_patientId_idx" ON "payment_links"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_organizationId_number_key" ON "invoices"("organizationId", "number");

-- CreateIndex
CREATE INDEX "patient_balances_patientId_asOf_idx" ON "patient_balances"("patientId", "asOf");

-- CreateIndex
CREATE INDEX "denials_organizationId_status_idx" ON "denials"("organizationId", "status");

-- CreateIndex
CREATE INDEX "era_remittances_organizationId_status_idx" ON "era_remittances"("organizationId", "status");

-- CreateIndex
CREATE INDEX "insurance_verifications_patientId_verifiedAt_idx" ON "insurance_verifications"("patientId", "verifiedAt");

-- CreateIndex
CREATE INDEX "prior_authorizations_patientId_status_idx" ON "prior_authorizations"("patientId", "status");

-- CreateIndex
CREATE INDEX "nofault_cases_organizationId_status_idx" ON "nofault_cases"("organizationId", "status");

-- CreateIndex
CREATE INDEX "workers_comp_cases_organizationId_status_idx" ON "workers_comp_cases"("organizationId", "status");

-- CreateIndex
CREATE INDEX "case_documents_caseType_caseId_idx" ON "case_documents"("caseType", "caseId");

-- CreateIndex
CREATE INDEX "case_tasks_caseType_caseId_status_idx" ON "case_tasks"("caseType", "caseId", "status");

-- CreateIndex
CREATE INDEX "case_packets_caseType_caseId_idx" ON "case_packets"("caseType", "caseId");

-- CreateIndex
CREATE UNIQUE INDEX "quality_measures_organizationId_key_key" ON "quality_measures"("organizationId", "key");

-- CreateIndex
CREATE INDEX "quality_gaps_organizationId_status_idx" ON "quality_gaps"("organizationId", "status");

-- CreateIndex
CREATE INDEX "quality_gaps_patientId_idx" ON "quality_gaps"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_quality_status_patientId_measureId_key" ON "patient_quality_status"("patientId", "measureId");

-- CreateIndex
CREATE INDEX "outreach_campaigns_organizationId_status_idx" ON "outreach_campaigns"("organizationId", "status");

-- CreateIndex
CREATE INDEX "message_threads_organizationId_status_idx" ON "message_threads"("organizationId", "status");

-- CreateIndex
CREATE INDEX "message_threads_patientId_idx" ON "message_threads"("patientId");

-- CreateIndex
CREATE INDEX "messages_threadId_createdAt_idx" ON "messages"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "call_logs_organizationId_startedAt_idx" ON "call_logs"("organizationId", "startedAt");

-- CreateIndex
CREATE INDEX "sms_logs_organizationId_createdAt_idx" ON "sms_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "email_logs_organizationId_createdAt_idx" ON "email_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "tasks_organizationId_status_dueAt_idx" ON "tasks"("organizationId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "escalations_organizationId_status_riskLevel_idx" ON "escalations"("organizationId", "status", "riskLevel");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "ai_summaries_sourceType_sourceId_idx" ON "ai_summaries"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ai_classifications_sourceType_sourceId_idx" ON "ai_classifications"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ai_drafts_sourceType_sourceId_idx" ON "ai_drafts"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "ai_reviews_draftId_idx" ON "ai_reviews"("draftId");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_createdAt_idx" ON "audit_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_patientId_createdAt_idx" ON "audit_logs"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_resourceId_idx" ON "audit_logs"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "activity_logs_organizationId_createdAt_idx" ON "activity_logs"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "settings_organizationId_key_key" ON "settings"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_organizationId_type_vendor_key" ON "integrations"("organizationId", "type", "vendor");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_organizationId_status_idx" ON "api_keys"("organizationId", "status");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_credentials" ADD CONSTRAINT "auth_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passkey_credentials" ADD CONSTRAINT "passkey_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
