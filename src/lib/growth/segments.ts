/**
 * Solution segments.
 *
 * One page per clinic type, because "we lose track of follow-ups" means something
 * different to a med spa than to a primary care practice, and a single generic page
 * reads as written for nobody.
 *
 * Every claim here is about operations. None promises a clinical or regulatory
 * outcome, and the copy-law test covers the page that renders this.
 *
 * Pure module. No database, no network.
 */

export const segmentKeys = ["medical-spa", "primary-care", "independent-clinic"] as const;
export type SegmentKey = (typeof segmentKeys)[number];

export type Segment = {
  key: SegmentKey;
  name: string;
  eyebrow: string;
  headline: string;
  lead: string;
  /** What this kind of clinic actually loses. Specific, not generic pain-points. */
  losses: readonly { title: string; body: string }[];
  /** The Klinikos surfaces that address them. */
  surfaces: readonly string[];
};

export const segments: Record<SegmentKey, Segment> = {
  "medical-spa": {
    key: "medical-spa",
    name: "Medical spa",
    eyebrow: "Medical spa and aesthetics",
    headline: "Your revenue is in the follow-up, and the follow-up is in someone's head.",
    lead:
      "Aesthetics runs on consultations that convert, packages that get used, and clients who come back on schedule. All three fail quietly, and all three fail in software nobody is watching.",
    losses: [
      { title: "Consultation enquiries that never get a second contact", body: "An enquiry on Friday evening is a booking on Monday morning or it is nothing. Klinikos makes the silence visible at the hour you decide, not at the end of the month." },
      { title: "Packages sold and never redeemed", body: "Unused sessions are revenue you were paid for and a client who is drifting. Both are countable and neither is usually counted." },
      { title: "Retreatment windows that close unnoticed", body: "Most aesthetic treatments have a natural return interval. When nobody tracks it, the client rebooks somewhere else or not at all." },
      { title: "Consent and intake completed in the chair", body: "Paperwork finished at the appointment costs treatment time and produces the least reliable records you hold." },
    ],
    surfaces: ["Med spa CRM", "Follow-up queues", "Retention and rebooking", "Intake and consent", "Revenue recovery", "Owner reporting"],
  },
  "primary-care": {
    key: "primary-care",
    name: "Primary care",
    eyebrow: "Primary care",
    headline: "The results and referrals with no closing loop are the ones that matter most.",
    lead:
      "Primary care does not usually lose money on marketing. It loses time and safety margin on work that was started, handed off, and never confirmed complete.",
    losses: [
      { title: "Results that arrive and wait", body: "A result is not finished when it arrives. It is finished when a clinician has reviewed it and the patient has been told. Klinikos tracks the whole loop rather than the delivery." },
      { title: "Referrals sent into silence", body: "A referral with no recorded outcome is an open question about a patient nobody is holding." },
      { title: "Encounters that never become billable", body: "Documentation gaps that block a claim are usually small, findable, and invisible until the claim is denied." },
      { title: "Eligibility checked too late", body: "A coverage problem found on the day is a cancelled appointment. Found a week out, it is a phone call." },
    ],
    surfaces: ["Results tracking", "Referral tracking", "Billing readiness", "Eligibility workflow", "Task and escalation queues", "Owner reporting"],
  },
  "independent-clinic": {
    key: "independent-clinic",
    name: "Independent clinic",
    eyebrow: "Independent clinic",
    headline: "You are paying for seven systems to do one job badly.",
    lead:
      "An independent clinic carries the same operational complexity as a large group with none of the administrative staff. The usual answer is more software, which adds more places for work to hide.",
    losses: [
      { title: "Software spend nobody can justify line by line", body: "Scheduling, CRM, forms, tasks, a reporting tool, and a spreadsheet holding it together. Most of that is replaceable." },
      { title: "Work that lives between systems", body: "Every hand-off between two tools is a place a patient can be forgotten, and none of those gaps has an owner." },
      { title: "No operating picture", body: "The owner finds out what went wrong from the month's numbers, which is the slowest possible feedback loop." },
      { title: "Staff accountability by memory", body: "Without assigned, tracked work, the clinic runs on whoever happens to be conscientious." },
    ],
    surfaces: ["Scheduling", "Intake and forms", "Task assignment", "CRM", "Follow-up queues", "Reporting", "Operating map"],
  },
};

export function getSegment(key: string): Segment | undefined {
  return segments[key as SegmentKey];
}
