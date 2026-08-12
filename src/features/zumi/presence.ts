import { z } from "zod";

export const zumiSurfaces = [
  "platform",
  "grid",
  "clinic_portal",
  "provider_portal",
  "patient_portal",
  "public_site",
  "mobile",
  "voice",
] as const;
export type ZumiSurface = (typeof zumiSurfaces)[number];

export const zumiInteractionModes = ["conversation", "research", "command", "briefing"] as const;
export type ZumiInteractionMode = (typeof zumiInteractionModes)[number];

export const zumiAutonomyModes = ["answer_only", "suggest_actions", "prepare_actions"] as const;
export type ZumiAutonomyMode = (typeof zumiAutonomyModes)[number];

export const zumiInputModalities = ["text", "voice", "image", "file", "structured_context"] as const;
export const zumiOutputModalities = ["text", "speech", "visual", "structured_action"] as const;

export const zumiPresenceSchema = z.object({
  surface: z.enum(zumiSurfaces).default("platform"),
  mode: z.enum(zumiInteractionModes).default("conversation"),
  autonomy: z.enum(zumiAutonomyModes).default("suggest_actions"),
  pathname: z.string().trim().max(500).optional(),
  pageTitle: z.string().trim().max(200).optional(),
  timezone: z.string().trim().max(80).optional(),
  locale: z.string().trim().max(40).optional(),
  inputModalities: z.array(z.enum(zumiInputModalities)).max(5).default(["text"]),
  outputModalities: z.array(z.enum(zumiOutputModalities)).max(4).default(["text"]),
}).default({
  surface: "platform",
  mode: "conversation",
  autonomy: "suggest_actions",
  inputModalities: ["text"],
  outputModalities: ["text"],
});

export const zumiAccessibilitySchema = z.object({
  responseLength: z.enum(["concise", "balanced", "detailed"]).default("balanced"),
  languageStyle: z.enum(["plain", "professional", "technical"]).default("professional"),
  speechOutput: z.boolean().default(false),
  captions: z.boolean().default(true),
  keyboardFirst: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
  highContrast: z.boolean().default(false),
  preferredLanguage: z.string().trim().min(2).max(40).optional(),
}).default({
  responseLength: "balanced",
  languageStyle: "professional",
  speechOutput: false,
  captions: true,
  keyboardFirst: false,
  reducedMotion: false,
  highContrast: false,
});

export type ZumiPresence = z.infer<typeof zumiPresenceSchema>;
export type ZumiAccessibility = z.infer<typeof zumiAccessibilitySchema>;

export function presenceInstruction(input: {
  presence: ZumiPresence;
  accessibility: ZumiAccessibility;
}) {
  const { presence, accessibility } = input;
  return [
    `Interaction surface: ${presence.surface}.`,
    `Interaction mode: ${presence.mode}.`,
    `Autonomy posture: ${presence.autonomy}.`,
    presence.pathname ? `Current Klinikos route: ${presence.pathname}.` : "Current route was not supplied.",
    presence.pageTitle ? `Current page title: ${presence.pageTitle}.` : "Current page title was not supplied.",
    `Input modalities available this turn: ${presence.inputModalities.join(", ")}.`,
    `Output modalities requested: ${presence.outputModalities.join(", ")}.`,
    `Preferred response length: ${accessibility.responseLength}.`,
    `Preferred language style: ${accessibility.languageStyle}.`,
    accessibility.preferredLanguage ? `Preferred language: ${accessibility.preferredLanguage}.` : "Use the language the user is speaking unless context requires otherwise.",
    accessibility.speechOutput ? "The response may be spoken aloud. Use sentence structure that is easy to follow by ear." : "Speech output is not currently requested.",
    accessibility.keyboardFirst ? "The user is operating keyboard-first. Avoid instructions that assume touch or mouse-only interaction." : "No keyboard-first preference was supplied.",
    accessibility.reducedMotion ? "The user prefers reduced motion. Do not rely on animation to communicate state." : "No reduced-motion preference was supplied.",
    presence.autonomy === "answer_only"
      ? "Do not propose execution as if it will happen. Answer and explain only."
      : presence.autonomy === "prepare_actions"
        ? "You may prepare an action plan or draft payload, but consequential execution still requires the normal authorization and approval gates."
        : "You may suggest useful actions, but do not represent suggestions as executed actions.",
  ].join("\n");
}
