/**
 * Client-safe vocabulary for Klinikos' public action-first surface.
 *
 * These are ordinary sentences a person can choose. The browser carries only this
 * presentation vocabulary and an opaque allowlisted action identity. Path selection,
 * eligibility logic, routing rules, and authority decisions stay server-side.
 */
export const PUBLIC_LIVING_ACTIONS = [
  { id: "care", label: "I need care", prompt: "I need care", side: "need", category: "need" },
  { id: "work", label: "I need work", prompt: "I need work", side: "need", category: "need" },
  { id: "cover", label: "I need someone tomorrow", prompt: "I need someone tomorrow", side: "need", category: "need" },
  { id: "room", label: "I need a room", prompt: "I need a room to treat a client", side: "need", category: "need" },
  { id: "placement", label: "I need a clinical placement", prompt: "I need a clinical placement", side: "need", category: "need" },
  { id: "paid", label: "Why hasn't this been paid?", prompt: "Why hasn't this been paid?", side: "need", category: "need" },
  { id: "followup", label: "I need to close open loops", prompt: "I need to close open loops", side: "need", category: "need" },
  { id: "resource", label: "I need space or equipment", prompt: "I need healthcare space or equipment", side: "need", category: "need" },
  { id: "client", label: "I have my own client", prompt: "I have my own client and need somewhere to treat them", side: "have", category: "offer" },
  { id: "rooms", label: "I have rooms open Friday", prompt: "I have rooms open Friday", side: "have", category: "offer" },
  { id: "students", label: "I can take students", prompt: "I can take students for clinical placement", side: "have", category: "offer" },
  { id: "precept", label: "I want to precept", prompt: "I want to precept", side: "have", category: "offer" },
  { id: "learn", label: "I want to learn", prompt: "I want to learn a healthcare skill", side: "have", category: "grow" },
  { id: "ownpractice", label: "I want to work for myself", prompt: "I want to work for myself", side: "have", category: "grow" },
  { id: "runclinic", label: "Help me run my practice", prompt: "Help me run my practice", side: "have", category: "grow" },
  { id: "aesthetics", label: "I want to build an injector career", prompt: "I want to build an injector career", side: "have", category: "grow" },
  { id: "procurement", label: "I need to prepare an RFP response", prompt: "I need to prepare a healthcare RFP response", side: "need", category: "need" },
] as const;

export type PublicLivingAction = (typeof PUBLIC_LIVING_ACTIONS)[number];
