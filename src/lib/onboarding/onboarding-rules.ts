import { z } from "zod";

/**
 * Zumi-guided clinic onboarding.
 *
 * The point is not to collect answers faster. It is to ask for as little as possible:
 * everything Klinikos already knows is prefilled, everything it can derive is
 * derived, and what remains is asked one question at a time in the order a person
 * would actually ask it.
 *
 * The old shape of this problem is a fifteen-page setup wizard that hands the
 * customer their configuration as homework. This is the opposite: Klinikos proposes,
 * the owner corrects.
 *
 * Pure module. No database, no network.
 */

export const onboardingStepKeys = ["identity", "specialty", "scale", "current_system", "priorities", "review"] as const;
export type OnboardingStepKey = (typeof onboardingStepKeys)[number];

export type OnboardingAnswers = {
  clinicName?: string;
  specialty?: string;
  locationCount?: string;
  providerCount?: string;
  currentSystem?: string;
  priorities?: string[];
};

/**
 * What Klinikos already knows about this clinic.
 *
 * Assembled from the purchase, the organization record, and anything the buyer told
 * the Growth Engine before paying. A customer who typed their clinic name into the
 * lead form should never be asked for it again.
 */
export type KnownContext = {
  clinicName: string | null;
  clinicType: string | null;
  locationCount: string | null;
  providerCount: string | null;
  contactName: string | null;
  /** Where each fact came from, so the interface can say "you told us this". */
  sources: Partial<Record<keyof OnboardingAnswers, "purchase" | "enquiry" | "organization">>;
};

export const specialties = [
  "medical_spa", "primary_care", "urgent_care", "dental", "behavioral_health",
  "physical_therapy", "dermatology", "specialty", "other",
] as const;

export const specialtyLabels: Record<(typeof specialties)[number], string> = {
  medical_spa: "Medical spa / aesthetics",
  primary_care: "Primary care",
  urgent_care: "Urgent care",
  dental: "Dental",
  behavioral_health: "Behavioral health",
  physical_therapy: "Physical therapy",
  dermatology: "Dermatology",
  specialty: "Other specialty",
  other: "Something else",
};

export const currentSystems = [
  "spreadsheets", "athenahealth", "epic", "cerner", "eclinicalworks", "drchrono",
  "kareo_tebra", "jane", "nextech", "boulevard", "other", "none",
] as const;

export const currentSystemLabels: Record<(typeof currentSystems)[number], string> = {
  spreadsheets: "Spreadsheets and paper",
  athenahealth: "athenahealth",
  epic: "Epic",
  cerner: "Oracle Cerner",
  eclinicalworks: "eClinicalWorks",
  drchrono: "DrChrono",
  kareo_tebra: "Tebra / Kareo",
  jane: "Jane",
  nextech: "Nextech",
  boulevard: "Boulevard",
  other: "Something else",
  none: "Nothing — we are starting fresh",
};

export const operationalPriorities = [
  "follow_up", "no_shows", "paperwork", "billing_readiness", "staff_accountability",
  "lead_conversion", "retention", "reporting",
] as const;

export const priorityLabels: Record<(typeof operationalPriorities)[number], string> = {
  follow_up: "Follow-ups that never happen",
  no_shows: "No-shows and cancellations",
  paperwork: "Incomplete paperwork",
  billing_readiness: "Encounters that never get billed",
  staff_accountability: "Work with no clear owner",
  lead_conversion: "Enquiries that never convert",
  retention: "Patients who drift away",
  reporting: "Not being able to see any of it",
};

export const onboardingAnswersSchema = z.object({
  clinicName: z.string().trim().min(2).max(160).optional(),
  specialty: z.enum(specialties).optional(),
  locationCount: z.string().trim().max(20).optional(),
  providerCount: z.string().trim().max(20).optional(),
  currentSystem: z.enum(currentSystems).optional(),
  priorities: z.array(z.enum(operationalPriorities)).max(8).optional(),
});

export type OnboardingStep = {
  key: OnboardingStepKey;
  /** What Zumi says. Written as a proposal to confirm, not a field to fill. */
  prompt: (context: KnownContext, answers: OnboardingAnswers) => string;
  /** Whether this step can be skipped because Klinikos already has the answer. */
  satisfiedBy: (context: KnownContext, answers: OnboardingAnswers) => boolean;
};

export const onboardingSteps: readonly OnboardingStep[] = [
  {
    key: "identity",
    prompt: (context) =>
      context.clinicName
        ? `You told us your clinic is ${context.clinicName}. Is that the name it should appear under in Klinikos?`
        : "What is your clinic called?",
    satisfiedBy: (context, answers) => Boolean(answers.clinicName ?? context.clinicName),
  },
  {
    key: "specialty",
    prompt: (context) =>
      context.clinicType
        ? `Klinikos has you down as ${context.clinicType.replace(/_/g, " ")}. Is that right?`
        : "What kind of work does the clinic do? This decides which queues matter to you.",
    satisfiedBy: (_context, answers) => Boolean(answers.specialty),
  },
  {
    key: "scale",
    prompt: (context) =>
      context.providerCount
        ? `You mentioned ${context.providerCount.replace(/_/g, "–")} providers across ${context.locationCount?.replace(/_/g, "–") ?? "one"} location. Still accurate?`
        : "How many providers and locations should Klinikos expect?",
    satisfiedBy: (context, answers) =>
      Boolean((answers.providerCount ?? context.providerCount) && (answers.locationCount ?? context.locationCount)),
  },
  {
    key: "current_system",
    prompt: () => "What are you running today? This tells Klinikos what it can import and what will need an export from you.",
    satisfiedBy: (_context, answers) => Boolean(answers.currentSystem),
  },
  {
    key: "priorities",
    prompt: () => "Which of these is actually costing you? Klinikos will watch these first.",
    satisfiedBy: (_context, answers) => (answers.priorities?.length ?? 0) > 0,
  },
  {
    key: "review",
    prompt: (context, answers) => `Here is what Klinikos will set up for ${answers.clinicName ?? context.clinicName ?? "your clinic"}.`,
    satisfiedBy: () => false,
  },
];

/**
 * The next question worth asking.
 *
 * Steps Klinikos can already answer are skipped entirely rather than shown prefilled
 * and confirmed — confirming a fact nobody disputed is still homework.
 */
export function nextStep(context: KnownContext, answers: OnboardingAnswers): OnboardingStep {
  return onboardingSteps.find((step) => !step.satisfiedBy(context, answers)) ?? onboardingSteps[onboardingSteps.length - 1];
}

export function onboardingProgress(context: KnownContext, answers: OnboardingAnswers) {
  const total = onboardingSteps.length - 1;
  const done = onboardingSteps.slice(0, total).filter((step) => step.satisfiedBy(context, answers)).length;
  return { done, total, complete: done === total };
}

/**
 * What migrating from the named system realistically involves.
 *
 * Deliberately honest per system. Telling a clinic on Epic that Klinikos will import
 * everything automatically is a promise that fails on the first day of the engagement.
 */
export function migrationOutlook(system: string | undefined) {
  switch (system) {
    case "none":
      return { automatic: ["Nothing to migrate"], needsExport: [], needsReview: [], note: "You are starting fresh, so there is nothing to move." };
    case "spreadsheets":
      return {
        automatic: ["Patient list", "Appointment list"],
        needsExport: ["Your spreadsheets as CSV"],
        needsReview: ["Duplicate patients", "Inconsistent date formats"],
        note: "Spreadsheets import cleanly once you send them. Expect to review duplicates.",
      };
    case "epic":
    case "cerner":
      return {
        automatic: [],
        needsExport: ["A record export requested from your current vendor"],
        needsReview: ["Clinical history mapping", "Coded data reconciliation"],
        note: "Enterprise systems do not offer self-service export. This needs a scheduled engagement and their cooperation, and Klinikos will not pretend otherwise.",
      };
    default:
      return {
        automatic: ["Patient demographics", "Upcoming appointments"],
        needsExport: ["A data export from your current system"],
        needsReview: ["Historical clinical records", "Document attachments"],
        note: "Most practice-management systems can export demographics and schedules. Historical charts usually need review.",
      };
  }
}

export const ONBOARDING_HONESTY_NOTICE =
  "Klinikos will set up everything it can from what you have told it. Anything that needs an account you own — messaging, payments, laboratories, a clearinghouse — is requested separately and shown as not connected until it genuinely is.";
