import { z } from "zod";

export const gridCompositionSlotKinds = [
  "participant",
  "professional",
  "organization",
  "location",
  "space",
  "equipment",
  "product",
  "service",
  "education",
  "referral_capacity",
  "time_window",
  "agreement",
  "consent",
  "payment",
  "authorization",
] as const;

export const gridCompositionSlotSchema = z.object({
  key: z.string().trim().min(2).max(80),
  kind: z.enum(gridCompositionSlotKinds),
  label: z.string().trim().min(2).max(120),
  required: z.boolean().default(true),
  minimumCount: z.number().int().min(0).max(100).default(1),
  maximumCount: z.number().int().min(1).max(100).default(1),
  policyClass: z.string().trim().min(2).max(120).optional().nullable(),
}).superRefine((value, ctx) => {
  if (value.minimumCount > value.maximumCount) {
    ctx.addIssue({ code: "custom", path: ["minimumCount"], message: "Minimum slot count cannot exceed maximum slot count." });
  }
  if (value.required && value.minimumCount === 0) {
    ctx.addIssue({ code: "custom", path: ["minimumCount"], message: "Required slots must require at least one component." });
  }
});

export const gridCompositionTemplateSchema = z.object({
  key: z.string().trim().min(3).max(100),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(1_000),
  version: z.number().int().positive().default(1),
  slots: z.array(gridCompositionSlotSchema).min(1).max(40),
}).superRefine((value, ctx) => {
  const keys = new Set<string>();
  value.slots.forEach((slot, index) => {
    if (keys.has(slot.key)) {
      ctx.addIssue({ code: "custom", path: ["slots", index, "key"], message: `Duplicate composition slot key: ${slot.key}` });
    }
    keys.add(slot.key);
  });
});

export const gridCompositionComponentSchema = z.object({
  slotKey: z.string().trim().min(2).max(80),
  resourceId: z.string().trim().min(1).max(200),
  resourceKind: z.string().trim().min(2).max(80),
  participantId: z.string().trim().min(1).max(200).optional().nullable(),
  organizationId: z.string().trim().min(1).max(200).optional().nullable(),
  eligibilityVerified: z.boolean().default(false),
  authorizationVerified: z.boolean().default(false),
  availabilityVerified: z.boolean().default(false),
  evidence: z.array(z.string().trim().min(2).max(300)).max(20).default([]),
});

export type GridCompositionTemplate = z.infer<typeof gridCompositionTemplateSchema>;
export type GridCompositionComponent = z.infer<typeof gridCompositionComponentSchema>;

export type GridCompositionEvaluation = {
  complete: boolean;
  readyForOffer: boolean;
  filledSlots: number;
  totalRequiredSlots: number;
  missingRequiredSlots: string[];
  overfilledSlots: string[];
  unknownSlotKeys: string[];
  ineligibleComponents: string[];
  unauthorizedComponents: string[];
  unavailableComponents: string[];
};

export function evaluateGridComposition(
  templateInput: GridCompositionTemplate,
  componentInputs: GridCompositionComponent[],
): GridCompositionEvaluation {
  const template = gridCompositionTemplateSchema.parse(templateInput);
  const components = componentInputs.map((component) => gridCompositionComponentSchema.parse(component));
  const slotsByKey = new Map(template.slots.map((slot) => [slot.key, slot]));
  const counts = new Map<string, number>();
  const unknownSlotKeys = new Set<string>();
  const ineligibleComponents: string[] = [];
  const unauthorizedComponents: string[] = [];
  const unavailableComponents: string[] = [];

  for (const component of components) {
    if (!slotsByKey.has(component.slotKey)) {
      unknownSlotKeys.add(component.slotKey);
      continue;
    }
    counts.set(component.slotKey, (counts.get(component.slotKey) ?? 0) + 1);
    if (!component.eligibilityVerified) ineligibleComponents.push(component.resourceId);
    if (!component.authorizationVerified) unauthorizedComponents.push(component.resourceId);
    if (!component.availabilityVerified) unavailableComponents.push(component.resourceId);
  }

  const missingRequiredSlots: string[] = [];
  const overfilledSlots: string[] = [];
  let filledSlots = 0;
  let totalRequiredSlots = 0;

  for (const slot of template.slots) {
    const count = counts.get(slot.key) ?? 0;
    if (slot.required) {
      totalRequiredSlots += slot.minimumCount;
      filledSlots += Math.min(count, slot.minimumCount);
      if (count < slot.minimumCount) missingRequiredSlots.push(slot.key);
    }
    if (count > slot.maximumCount) overfilledSlots.push(slot.key);
  }

  const structurallyComplete =
    missingRequiredSlots.length === 0 &&
    overfilledSlots.length === 0 &&
    unknownSlotKeys.size === 0;

  const verified =
    ineligibleComponents.length === 0 &&
    unauthorizedComponents.length === 0 &&
    unavailableComponents.length === 0;

  return {
    complete: structurallyComplete,
    readyForOffer: structurallyComplete && verified,
    filledSlots,
    totalRequiredSlots,
    missingRequiredSlots,
    overfilledSlots,
    unknownSlotKeys: [...unknownSlotKeys],
    ineligibleComponents,
    unauthorizedComponents,
    unavailableComponents,
  };
}

export const gridCompositionTemplates = {
  clinicalService: gridCompositionTemplateSchema.parse({
    key: "clinical_service",
    title: "Clinical service assembly",
    description: "Composes a permitted service from an eligible professional, approved setting, time, required authorization, and payment state.",
    slots: [
      { key: "professional", kind: "professional", label: "Eligible professional", policyClass: "clinical_professional" },
      { key: "location", kind: "location", label: "Approved service location", policyClass: "clinical_location" },
      { key: "time", kind: "time_window", label: "Available appointment window", policyClass: "availability" },
      { key: "authorization", kind: "authorization", label: "Required authorization", policyClass: "clinical_authorization" },
      { key: "payment", kind: "payment", label: "Payment condition", policyClass: "financial" },
    ],
  }),
  staffingShift: gridCompositionTemplateSchema.parse({
    key: "staffing_shift",
    title: "Staffing shift",
    description: "Composes an organization staffing need with an eligible professional and a compatible time window.",
    slots: [
      { key: "organization", kind: "organization", label: "Requesting organization", policyClass: "organization" },
      { key: "professional", kind: "professional", label: "Eligible professional", policyClass: "clinical_professional" },
      { key: "time", kind: "time_window", label: "Shift window", policyClass: "availability" },
    ],
  }),
  clinicalPlacement: gridCompositionTemplateSchema.parse({
    key: "clinical_placement",
    title: "Clinical education placement",
    description: "Composes a student placement from the learner, education organization, preceptor, approved site, and required time capacity.",
    slots: [
      { key: "student", kind: "participant", label: "Student", policyClass: "student" },
      { key: "school", kind: "organization", label: "Education organization", policyClass: "education_organization" },
      { key: "preceptor", kind: "professional", label: "Eligible preceptor", policyClass: "preceptor" },
      { key: "site", kind: "location", label: "Approved clinical site", policyClass: "clinical_site" },
      { key: "time", kind: "time_window", label: "Placement capacity", policyClass: "availability" },
    ],
  }),
  roomRental: gridCompositionTemplateSchema.parse({
    key: "room_rental",
    title: "Healthcare space reservation",
    description: "Composes an eligible participant with approved healthcare space, a compatible time window, agreement, and payment condition.",
    slots: [
      { key: "participant", kind: "participant", label: "Eligible renter", policyClass: "space_renter" },
      { key: "space", kind: "space", label: "Approved healthcare space", policyClass: "healthcare_space" },
      { key: "time", kind: "time_window", label: "Available reservation window", policyClass: "availability" },
      { key: "agreement", kind: "agreement", label: "Governing agreement", policyClass: "space_agreement" },
      { key: "payment", kind: "payment", label: "Payment condition", policyClass: "financial" },
    ],
  }),
} as const;
